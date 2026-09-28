/*
    000_control_migracion.sql
    ------------------------------------------------------------------
    Tabla de control de scripts aplicados.

    RUTEC no usa EF Core Migrations (el contexto es database-first sobre
    tablas legadas), asi que no existe __EFMigrationsHistory. Esta tabla
    cumple esa funcion: saber que scripts ya corrieron en una instancia.

    Se ejecuta UNA sola vez por instancia, antes de cualquier migracion.
    Es idempotente: correrla de nuevo no hace nada.

    Uso:
      sqlcmd -S <servidor> -d RUTEC -C -i db/_control/000_control_migracion.sql
    ------------------------------------------------------------------
*/

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID('dbo.CONTROL_MIGRACION', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CONTROL_MIGRACION
    (
        ID              INT IDENTITY(1,1)   NOT NULL,
        NUMERO          CHAR(3)             NOT NULL,  -- el NNN del nombre del archivo
        NOMBRE          VARCHAR(200)        NOT NULL,  -- nombre del archivo, sin ruta
        TIPO            VARCHAR(20)         NOT NULL,  -- MIGRACION | BACKFILL | ROLLBACK
        DESCRIPCION     VARCHAR(500)        NULL,
        PBI             VARCHAR(50)         NULL,      -- historia de DevOps que lo motiva
        FECHA_APLICADO  DATETIME2(0)        NOT NULL
            CONSTRAINT DF_CONTROL_MIGRACION_FECHA DEFAULT (SYSDATETIME()),
        APLICADO_POR    NVARCHAR(128)       NOT NULL
            CONSTRAINT DF_CONTROL_MIGRACION_USUARIO DEFAULT (SUSER_SNAME()),
        SERVIDOR        NVARCHAR(128)       NOT NULL
            CONSTRAINT DF_CONTROL_MIGRACION_SERVIDOR DEFAULT (@@SERVERNAME),
        DURACION_MS     INT                 NULL,
        CONSTRAINT PK_CONTROL_MIGRACION PRIMARY KEY CLUSTERED (ID)
    );

    PRINT 'dbo.CONTROL_MIGRACION creada.';
END
ELSE
BEGIN
    PRINT 'dbo.CONTROL_MIGRACION ya existe.';
END
GO

/*
    Un avance se aplica UNA sola vez: ahi el unico tiene que morder.
    Un rollback no: aplicar -> revertir -> aplicar -> revertir es una
    secuencia legitima, y cada reversa es un hecho distinto que vale la
    pena conservar. Por eso el indice excluye las filas ROLLBACK en vez
    de cubrir la tabla entera.
*/
IF OBJECT_ID('dbo.CONTROL_MIGRACION', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes
                   WHERE name = 'UX_CONTROL_MIGRACION_NOMBRE'
                     AND object_id = OBJECT_ID('dbo.CONTROL_MIGRACION'))
BEGIN
    CREATE UNIQUE INDEX UX_CONTROL_MIGRACION_NOMBRE
        ON dbo.CONTROL_MIGRACION (NOMBRE, TIPO)
        WHERE TIPO <> 'ROLLBACK';

    PRINT 'UX_CONTROL_MIGRACION_NOMBRE creado.';
END
GO

/*
    Vista de consulta rapida: que hay aplicado y en que orden.
*/
CREATE OR ALTER VIEW dbo.VW_CONTROL_MIGRACION
AS
SELECT  NUMERO,
        NOMBRE,
        TIPO,
        PBI,
        DESCRIPCION,
        FECHA_APLICADO,
        APLICADO_POR,
        DURACION_MS
FROM    dbo.CONTROL_MIGRACION;
GO

SELECT NUMERO, NOMBRE, TIPO, FECHA_APLICADO, APLICADO_POR
FROM   dbo.CONTROL_MIGRACION
ORDER  BY NUMERO, ID;
GO
