/*
    NNN_descripcion.sql
    ------------------------------------------------------------------
    PBI          : RUTEC-XXXX
    Descripcion  : <que cambia y por que, en una linea>
    Rollback     : db/rollback/NNN_descripcion_rollback.sql
    Probado en   : <instancia local / fecha>
    ------------------------------------------------------------------
    Copiar este archivo, renombrarlo y llenar el bloque CAMBIO.
    No modificar el bloque de control.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;        -- cualquier error aborta la transaccion completa
-- sqlcmd entra con QUOTED_IDENTIFIER OFF y eso hace fallar CREATE INDEX
-- sobre indices filtrados. Ambas van siempre, no depender del cliente.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @Nombre      VARCHAR(200) = 'NNN_descripcion.sql',
        @Numero      CHAR(3)      = 'NNN',
        @Tipo        VARCHAR(20)  = 'MIGRACION',
        @Pbi         VARCHAR(50)  = 'RUTEC-XXXX',
        @Descripcion VARCHAR(500) = '<que cambia y por que>';

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
       CAMBIO — empieza aqui

       Reglas (db/README.md seccion 3):
         - Idempotente: IF COL_LENGTH(...) IS NULL / IF NOT EXISTS.
         - Columna nueva SIEMPRE NULL y sin DEFAULT.
         - Nada de UPDATE masivo aqui: eso va en db/backfill/.

       Ejemplo:

         IF COL_LENGTH('dbo.TB_MIGRANTE_TRABAJADOR', 'CORREO_NOTIFICACION') IS NULL
             ALTER TABLE dbo.TB_MIGRANTE_TRABAJADOR
                 ADD CORREO_NOTIFICACION VARCHAR(150) NULL;
    ============================================================ */



    /* ============================================================
       CAMBIO — termina aqui
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
