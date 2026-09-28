/*
    NNN_descripcion.sql   (backfill)
    ------------------------------------------------------------------
    PBI          : RUTEC-XXXX
    Descripcion  : rellena <columna> de <tabla>
    Depende de   : db/migrations/NNN_descripcion.sql
    Probado en   : <instancia local / fecha>
    ------------------------------------------------------------------
    Por que por lotes: TB_MIGRANTE_TRABAJADOR tiene ~165 mil filas y
    TB_MIGRANTE_TRABAJADOR_CONTRATO ~250 mil. Un UPDATE de una sola pasada
    escala el bloqueo a nivel de tabla y mantiene la transaccion abierta
    hasta el final, inflando el log. Con lotes el bloqueo dura lo que dura
    el lote y el log se puede truncar entre uno y otro.

    Reanudable: el WHERE filtra las filas que aun no se han tocado, asi que
    si el proceso se corta se vuelve a ejecutar y continua donde iba.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @Nombre      VARCHAR(200) = 'NNN_descripcion.sql',
        @Numero      CHAR(3)      = 'NNN',
        @Tipo        VARCHAR(20)  = 'BACKFILL',
        @Pbi         VARCHAR(50)  = 'RUTEC-XXXX',
        @Descripcion VARCHAR(500) = '<que rellena>';

DECLARE @Lote        INT = 5000,      -- filas por pasada
        @EsperaMs    CHAR(8) = '00:00:00.250',  -- respiro entre lotes
        @Filas       INT = 1,
        @Total       BIGINT = 0,
        @Inicio      DATETIME2(3) = SYSDATETIME();

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

/* ============================================================
   LOTE — cada pasada es su propia transaccion implicita.
   No envolver el WHILE en BEGIN TRANSACTION: eso anula el
   proposito de lotear.

   Ejemplo:

     WHILE @Filas > 0
     BEGIN
         UPDATE TOP (@Lote) t
         SET    t.CORREO_NOTIFICACION = t.CORREO
         FROM   dbo.TB_MIGRANTE_TRABAJADOR t
         WHERE  t.CORREO_NOTIFICACION IS NULL
           AND  t.CORREO IS NOT NULL;

         SET @Filas = @@ROWCOUNT;
         SET @Total += @Filas;

         IF @Filas > 0
         BEGIN
             RAISERROR('  %I64d filas actualizadas...', 0, 1, @Total) WITH NOWAIT;
             WAITFOR DELAY @EsperaMs;
         END
     END
============================================================ */

SET @Filas = 0;   -- quitar al escribir el WHILE real



/* ============================================================
   FIN DEL LOTE
============================================================ */

INSERT INTO dbo.CONTROL_MIGRACION (NUMERO, NOMBRE, TIPO, DESCRIPCION, PBI, DURACION_MS)
VALUES (@Numero, @Nombre, @Tipo,
        @Descripcion + ' (' + CAST(@Total AS VARCHAR(20)) + ' filas)',
        @Pbi, DATEDIFF(MILLISECOND, @Inicio, SYSDATETIME()));

PRINT @Nombre + ' terminado. Filas actualizadas: ' + CAST(@Total AS VARCHAR(20));
GO
