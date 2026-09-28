/*
    002_log_correo_cuerpo.sql
    ------------------------------------------------------------------
    PBI          : RUTEC-2027 / Oleada 0.5 — IEmailService
    Descripcion  : agrega CUERPO y ES_HTML a dbo.TB_LOG_CORREO
    Rollback     : db/rollback/002_log_correo_cuerpo_rollback.sql
    Probado en   : instancia local MSSQLSERVER, base RUTEC
    ------------------------------------------------------------------
    La 001 dejo la bitacora sin el cuerpo del mensaje. Con eso se puede
    auditar que un correo fallo, pero no reenviarlo: si el proceso se cae
    entre el intento y el reintento, el contenido se perdio y la fila
    queda como un FALLIDO que nadie puede resolver.

    El reintento tiene que sobrevivir a un reinicio del servicio, asi que
    el cuerpo va en la tabla.

    Ambas columnas entran NULL y sin DEFAULT, segun la regla 3 de
    db/README.md: no se reescriben las filas existentes y el ALTER es solo
    metadatos. Las filas anteriores a este avance quedan con CUERPO NULL y
    el servicio de reintento las salta de forma explicita.

    ES_HTML admite NULL por la misma razon; el codigo interpreta NULL como
    HTML, que es lo que enviaba el unico camino existente.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
-- TB_LOG_CORREO tiene un indice filtrado: sin estas dos, cualquier DML
-- sobre la tabla falla con Msg 1934. Ver db/README.md.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @Nombre      VARCHAR(200) = '002_log_correo_cuerpo.sql',
        @Numero      CHAR(3)      = '002',
        @Tipo        VARCHAR(20)  = 'MIGRACION',
        @Pbi         VARCHAR(50)  = 'RUTEC-2027-O0.5',
        @Descripcion VARCHAR(500) = 'Agrega CUERPO y ES_HTML a dbo.TB_LOG_CORREO para que el reintento pueda reenviar';

IF OBJECT_ID('dbo.CONTROL_MIGRACION', 'U') IS NULL
BEGIN
    RAISERROR('Falta dbo.CONTROL_MIGRACION. Ejecute primero db/_control/000_control_migracion.sql.', 16, 1);
    RETURN;
END

IF OBJECT_ID('dbo.TB_LOG_CORREO', 'U') IS NULL
BEGIN
    RAISERROR('Falta dbo.TB_LOG_CORREO. Ejecute primero db/migrations/001_log_correo.sql.', 16, 1);
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

    IF NOT EXISTS (SELECT 1 FROM sys.columns
                   WHERE object_id = OBJECT_ID('dbo.TB_LOG_CORREO')
                     AND name = 'CUERPO')
    BEGIN
        ALTER TABLE dbo.TB_LOG_CORREO ADD CUERPO NVARCHAR(MAX) NULL;
        PRINT '  CUERPO agregada.';
    END
    ELSE
    BEGIN
        PRINT '  CUERPO ya existia.';
    END

    IF NOT EXISTS (SELECT 1 FROM sys.columns
                   WHERE object_id = OBJECT_ID('dbo.TB_LOG_CORREO')
                     AND name = 'ES_HTML')
    BEGIN
        ALTER TABLE dbo.TB_LOG_CORREO ADD ES_HTML BIT NULL;
        PRINT '  ES_HTML agregada.';
    END
    ELSE
    BEGIN
        PRINT '  ES_HTML ya existia.';
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
