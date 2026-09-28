/*
    002_log_correo_cuerpo_rollback.sql
    ------------------------------------------------------------------
    PBI              : RUTEC-2027 / Oleada 0.5 — IEmailService
    Revierte         : db/migrations/002_log_correo_cuerpo.sql
    Perdida de datos : SI — se pierde el cuerpo de los correos registrados.
                       Los que esten en PENDIENTE o FALLIDO dejan de ser
                       reenviables: la fila queda, el contenido no.
    ------------------------------------------------------------------
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @Nombre       VARCHAR(200) = '002_log_correo_cuerpo_rollback.sql',
        @NombreAvance VARCHAR(200) = '002_log_correo_cuerpo.sql',
        @Numero       CHAR(3)      = '002',
        @Pbi          VARCHAR(50)  = 'RUTEC-2027-O0.5',
        @Descripcion  VARCHAR(500) = 'Elimina CUERPO y ES_HTML de dbo.TB_LOG_CORREO';

IF NOT EXISTS (SELECT 1 FROM dbo.CONTROL_MIGRACION WHERE NOMBRE = @NombreAvance AND TIPO = 'MIGRACION')
BEGIN
    PRINT @NombreAvance + ' no esta aplicado en esta instancia. No hay nada que revertir.';
    RETURN;
END

-- Mismo criterio que en 001: no se borra en silencio lo que no se puede
-- reconstruir. Aqui solo importan los que todavia esperan salir.
DECLARE @Pendientes BIGINT = 0;
IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.TB_LOG_CORREO') AND name = 'CUERPO')
    SELECT @Pendientes = COUNT_BIG(*)
    FROM   dbo.TB_LOG_CORREO
    WHERE  ESTADO <> 'ENVIADO' AND CUERPO IS NOT NULL;

IF @Pendientes > 0
BEGIN
    DECLARE @Aviso NVARCHAR(500) =
        'dbo.TB_LOG_CORREO tiene ' + CAST(@Pendientes AS VARCHAR(20)) +
        ' correos sin enviar cuyo cuerpo se perderia. Despachelos o respalde antes de revertir.';
    RAISERROR(@Aviso, 16, 1);
    RETURN;
END

DECLARE @Inicio DATETIME2(3) = SYSDATETIME();

BEGIN TRY
    BEGIN TRANSACTION;

    /* ============================================================
       REVERSA
    ============================================================ */

    IF EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.TB_LOG_CORREO') AND name = 'ES_HTML')
    BEGIN
        ALTER TABLE dbo.TB_LOG_CORREO DROP COLUMN ES_HTML;
        PRINT '  ES_HTML eliminada.';
    END

    IF EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.TB_LOG_CORREO') AND name = 'CUERPO')
    BEGIN
        ALTER TABLE dbo.TB_LOG_CORREO DROP COLUMN CUERPO;
        PRINT '  CUERPO eliminada.';
    END

    /* ============================================================
       FIN DE LA REVERSA
    ============================================================ */

    DELETE FROM dbo.CONTROL_MIGRACION
    WHERE  NOMBRE = @NombreAvance AND TIPO IN ('MIGRACION', 'BACKFILL');

    INSERT INTO dbo.CONTROL_MIGRACION (NUMERO, NOMBRE, TIPO, DESCRIPCION, PBI, DURACION_MS)
    VALUES (@Numero, @Nombre, 'ROLLBACK', @Descripcion, @Pbi,
            DATEDIFF(MILLISECOND, @Inicio, SYSDATETIME()));

    COMMIT TRANSACTION;
    PRINT @Nombre + ' revertido correctamente.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;

    DECLARE @Msg NVARCHAR(2048) = 'Fallo ' + @Nombre + ': ' + ERROR_MESSAGE();
    RAISERROR(@Msg, 16, 1);
END CATCH
GO
