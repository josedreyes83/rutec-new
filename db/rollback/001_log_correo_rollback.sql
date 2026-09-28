/*
    001_log_correo_rollback.sql
    ------------------------------------------------------------------
    PBI              : RUTEC-2027 / Oleada 0.5 — IEmailService
    Revierte         : db/migrations/001_log_correo.sql
    Perdida de datos : SI — se borra la bitacora de correos enviados.
                       La tabla es de auditoria: una vez revertida no se
                       puede reconstruir desde ningun otro lado. Respaldar
                       antes si la instancia ya tiene envios registrados.
    ------------------------------------------------------------------
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @Nombre       VARCHAR(200) = '001_log_correo_rollback.sql',
        @NombreAvance VARCHAR(200) = '001_log_correo.sql',
        @Numero       CHAR(3)      = '001',
        @Pbi          VARCHAR(50)  = 'RUTEC-2027-O0.5',
        @Descripcion  VARCHAR(500) = 'Elimina dbo.TB_LOG_CORREO';

IF NOT EXISTS (SELECT 1 FROM dbo.CONTROL_MIGRACION WHERE NOMBRE = @NombreAvance AND TIPO = 'MIGRACION')
BEGIN
    PRINT @NombreAvance + ' no esta aplicado en esta instancia. No hay nada que revertir.';
    RETURN;
END

DECLARE @Filas BIGINT = 0;
IF OBJECT_ID('dbo.TB_LOG_CORREO', 'U') IS NOT NULL
    SELECT @Filas = COUNT_BIG(*) FROM dbo.TB_LOG_CORREO;

IF @Filas > 0
BEGIN
    -- Cortar en seco en vez de borrar auditoria sin que nadie lo note.
    -- Para forzar: respaldar la tabla y comentar este bloque.
    DECLARE @Aviso NVARCHAR(500) =
        'dbo.TB_LOG_CORREO tiene ' + CAST(@Filas AS VARCHAR(20)) +
        ' registros de auditoria. Respalde antes de revertir.';
    RAISERROR(@Aviso, 16, 1);
    RETURN;
END

DECLARE @Inicio DATETIME2(3) = SYSDATETIME();

BEGIN TRY
    BEGIN TRANSACTION;

    /* ============================================================
       REVERSA
    ============================================================ */

    IF OBJECT_ID('dbo.TB_LOG_CORREO', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.TB_LOG_CORREO;   -- los indices caen con la tabla
        PRINT '  dbo.TB_LOG_CORREO eliminada.';
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
