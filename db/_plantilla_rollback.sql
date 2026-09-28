/*
    NNN_descripcion_rollback.sql
    ------------------------------------------------------------------
    PBI          : RUTEC-XXXX
    Revierte     : db/migrations/NNN_descripcion.sql
    Perdida de datos : SI / NO  <-- declararlo siempre
    ------------------------------------------------------------------
    Al revertir se borra la fila de CONTROL_MIGRACION del script de avance,
    para que pueda volver a aplicarse, y se registra el rollback con su
    propio TIPO. Asi queda el rastro de que se revirtio y cuando.

    Si el cambio no es reversible sin perdida (se borraron datos, se
    redujo el tamano de una columna), este archivo NO debe intentar
    adivinar: documenta que respaldo hace falta y termina con RAISERROR
    para que nadie lo ejecute por inercia.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @Nombre         VARCHAR(200) = 'NNN_descripcion_rollback.sql',
        @NombreAvance   VARCHAR(200) = 'NNN_descripcion.sql',
        @Numero         CHAR(3)      = 'NNN',
        @Pbi            VARCHAR(50)  = 'RUTEC-XXXX',
        @Descripcion    VARCHAR(500) = 'revierte <que>';

IF NOT EXISTS (SELECT 1 FROM dbo.CONTROL_MIGRACION WHERE NOMBRE = @NombreAvance AND TIPO = 'MIGRACION')
BEGIN
    PRINT @NombreAvance + ' no esta aplicado en esta instancia. No hay nada que revertir.';
    RETURN;
END

DECLARE @Inicio DATETIME2(3) = SYSDATETIME();

BEGIN TRY
    BEGIN TRANSACTION;

    /* ============================================================
       REVERSA — empieza aqui. Idempotente igual que el avance.

       Ejemplo:

         IF COL_LENGTH('dbo.TB_MIGRANTE_TRABAJADOR', 'CORREO_NOTIFICACION') IS NOT NULL
             ALTER TABLE dbo.TB_MIGRANTE_TRABAJADOR
                 DROP COLUMN CORREO_NOTIFICACION;
    ============================================================ */



    /* ============================================================
       REVERSA — termina aqui
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
