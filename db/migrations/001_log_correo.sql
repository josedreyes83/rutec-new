/*
    001_log_correo.sql
    ------------------------------------------------------------------
    PBI          : RUTEC-2027 / Oleada 0.5 — IEmailService
    Descripcion  : tabla de bitacora de correos enviados, con estado y reintentos
    Rollback     : db/rollback/001_log_correo_rollback.sql
    Probado en   : instancia local MSSQLSERVER, base RUTEC
    ------------------------------------------------------------------
    El servicio de correo necesita responder tres preguntas que hoy no
    tienen respuesta: si un correo salio, por que fallo, y cuantas veces
    se reintento. Sin esta tabla el envio es fuego y olvido.

    La tabla es nueva, no toca nada existente: el ALTER no aplica y no hay
    bloqueo sobre tablas con datos.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
-- sqlcmd entra con QUOTED_IDENTIFIER OFF y eso hace fallar CREATE INDEX
-- sobre indices filtrados. Ambas van siempre, no depender del cliente.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @Nombre      VARCHAR(200) = '001_log_correo.sql',
        @Numero      CHAR(3)      = '001',
        @Tipo        VARCHAR(20)  = 'MIGRACION',
        @Pbi         VARCHAR(50)  = 'RUTEC-2027-O0.5',
        @Descripcion VARCHAR(500) = 'Crea dbo.TB_LOG_CORREO para la bitacora de envios de IEmailService';

IF OBJECT_ID('dbo.CONTROL_MIGRACION', 'U') IS NULL
BEGIN
    RAISERROR('Falta dbo.CONTROL_MIGRACION. Ejecute primero db/_control/000_control_migracion.sql.', 16, 1);
    RETURN;
END

IF EXISTS (SELECT 1 FROM dbo.CONTROL_MIGRACION WHERE NOMBRE = @Nombre AND TIPO = @Tipo)
BEGIN
    PRINT @Nombre + ' ya fue aplicado. No se hace nada.';
    RETURN;
END

DECLARE @Inicio DATETIME2(3) = SYSDATETIME();

BEGIN TRY
    BEGIN TRANSACTION;

    /* ============================================================
       CAMBIO
    ============================================================ */

    IF OBJECT_ID('dbo.TB_LOG_CORREO', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.TB_LOG_CORREO
        (
            ID_LOG_CORREO       BIGINT IDENTITY(1,1)    NOT NULL,

            -- Que se envio
            DESTINATARIO        VARCHAR(500)            NOT NULL,  -- admite varios separados por ;
            CON_COPIA           VARCHAR(500)            NULL,
            ASUNTO              NVARCHAR(500)           NOT NULL,
            PLANTILLA           VARCHAR(100)            NULL,      -- nombre logico de la plantilla usada

            -- A que se refiere. Sin FK: puede apuntar a trabajador, contrato
            -- o empleador, y las tablas legadas no comparten convencion de PK.
            TIPO_ENTIDAD        VARCHAR(50)             NULL,      -- TRABAJADOR | CONTRATO | EMPLEADOR
            ID_ENTIDAD          NUMERIC(18,0)           NULL,

            -- Como termino
            ESTADO              VARCHAR(20)             NOT NULL,  -- PENDIENTE | ENVIADO | FALLIDO
            INTENTOS            INT                     NOT NULL
                CONSTRAINT DF_TB_LOG_CORREO_INTENTOS DEFAULT (0),
            ERROR_MENSAJE       NVARCHAR(2000)          NULL,      -- solo el mensaje, nunca credenciales SMTP

            FECHA_CREACION      DATETIME2(0)            NOT NULL
                CONSTRAINT DF_TB_LOG_CORREO_FECHA_CREACION DEFAULT (SYSDATETIME()),
            FECHA_ULTIMO_INTENTO DATETIME2(0)           NULL,
            FECHA_ENVIO         DATETIME2(0)            NULL,      -- solo cuando ESTADO = ENVIADO

            USUARIO_ORIGEN      NVARCHAR(256)           NULL,      -- quien disparo el envio

            CONSTRAINT PK_TB_LOG_CORREO PRIMARY KEY CLUSTERED (ID_LOG_CORREO),
            CONSTRAINT CK_TB_LOG_CORREO_ESTADO
                CHECK (ESTADO IN ('PENDIENTE', 'ENVIADO', 'FALLIDO'))
        );

        -- El reintento busca pendientes y fallidos por orden de llegada.
        -- Filtrado para que no crezca con los millones de ENVIADO.
        CREATE INDEX IX_TB_LOG_CORREO_PENDIENTES
            ON dbo.TB_LOG_CORREO (ESTADO, FECHA_CREACION)
            INCLUDE (INTENTOS)
            WHERE ESTADO <> 'ENVIADO';

        -- Consulta de soporte: "que se le mando a este trabajador".
        CREATE INDEX IX_TB_LOG_CORREO_ENTIDAD
            ON dbo.TB_LOG_CORREO (TIPO_ENTIDAD, ID_ENTIDAD, FECHA_CREACION DESC);

        PRINT '  dbo.TB_LOG_CORREO creada.';
    END
    ELSE
    BEGIN
        PRINT '  dbo.TB_LOG_CORREO ya existia.';
    END

    /* ============================================================
       FIN DEL CAMBIO
    ============================================================ */

    INSERT INTO dbo.CONTROL_MIGRACION (NUMERO, NOMBRE, TIPO, DESCRIPCION, PBI, DURACION_MS)
    VALUES (@Numero, @Nombre, @Tipo, @Descripcion, @Pbi,
            DATEDIFF(MILLISECOND, @Inicio, SYSDATETIME()));

    COMMIT TRANSACTION;
    PRINT @Nombre + ' aplicado correctamente.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;

    DECLARE @Msg NVARCHAR(2048) = 'Fallo ' + @Nombre + ': ' + ERROR_MESSAGE();
    RAISERROR(@Msg, 16, 1);
END CATCH
GO
