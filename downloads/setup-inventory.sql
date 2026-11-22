-- DBM Session 06 only. Safe rerun: creates and seeds only a missing table.
-- Existing Session 06 rows are never dropped, updated or deleted by setup.
USE [master];
GO
IF DB_ID(N'DBM_Session06_Inventory') IS NULL
    EXEC(N'CREATE DATABASE [DBM_Session06_Inventory];');
GO
USE [DBM_Session06_Inventory];
GO
IF DB_NAME() <> N'DBM_Session06_Inventory'
    THROW 50000, 'Wrong database. Stop and connect to Session 06.', 1;

IF OBJECT_ID(N'dbo.Items', N'U') IS NULL
BEGIN
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;
    CREATE TABLE dbo.Items
    (
        Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_S06_Items PRIMARY KEY,
        Name nvarchar(100) NOT NULL,
        UnitPrice decimal(10,2) NOT NULL,
        Stock int NOT NULL,
        IsActive bit NOT NULL,
        AddedAt datetime2 NOT NULL,
        CONSTRAINT CK_S06_Items_Price CHECK (UnitPrice >= 0),
        CONSTRAINT CK_S06_Items_Stock CHECK (Stock >= 0)
    );
    -- Preserve the familiar Session 05 seed identifiers exactly on first setup.
    SET IDENTITY_INSERT dbo.Items ON;
    INSERT INTO dbo.Items (Id, Name, UnitPrice, Stock, IsActive, AddedAt)
    VALUES
        (1, N'Top Gun', 18.00, 5, 1, '2026-10-28T10:00:00'),
        (2, N'Star Wars', 20.00, 0, 1, '2026-11-01T09:00:00'),
        (3, N'Star Trek', 12.50, 3, 1, '2026-11-02T10:00:00'),
        (4, N'The Godfather', 25.00, 2, 0, '2026-10-20T11:00:00'),
        (5, N'The Lord of the Rings: The Fellowship of the Ring', 30.00, 4, 1, '2026-11-03T12:00:00'),
        (6, N'Interstellar', 22.00, 6, 1, '2026-11-04T10:00:00'),
        (7, N'Inception', 18.00, 0, 0, '2026-11-05T10:00:00'),
        (8, N'The Matrix', 15.00, 8, 1, '2026-11-06T10:00:00'),
        (9, N'Finding Nemo', 10.00, 7, 1, '2026-11-07T10:00:00'),
        (10, N'Toy Story', 10.00, 0, 1, '2026-11-08T10:00:00'),
        (11, N'Stardust', 14.00, 4, 1, '2026-11-09T10:00:00'),
        (12, N'Starship Troopers', 26.00, 3, 1, '2026-11-10T10:00:00'),
        (13, N'Arrival', 16.00, 2, 1, '2026-11-11T10:00:00'),
        (14, N'Gladiator', 24.00, 1, 0, '2026-11-12T10:00:00'),
        (15, N'Inside Out', 11.00, 5, 1, '2026-11-30T23:59:00'),
        (16, N'The Lion King', 12.50, 9, 1, '2026-12-01T00:00:00');
    SET IDENTITY_INSERT dbo.Items OFF;
    COMMIT TRANSACTION;
    PRINT 'Session 06 table created with the 16 seed rows.';
END
ELSE
    PRINT 'Existing table and rows kept.';

IF ISNULL(COLUMNPROPERTY(OBJECT_ID(N'dbo.Items'), N'Id', 'IsIdentity'), 0) <> 1
    OR ISNULL(COL_LENGTH(N'dbo.Items', N'Name'), 0) <> 200
    OR COL_LENGTH(N'dbo.Items', N'UnitPrice') IS NULL
    OR COL_LENGTH(N'dbo.Items', N'Stock') IS NULL
    OR COL_LENGTH(N'dbo.Items', N'IsActive') IS NULL
    OR COL_LENGTH(N'dbo.Items', N'AddedAt') IS NULL
    THROW 50001, 'Unexpected Items schema. Stop and inspect the Session 06 table.', 1;

SELECT Id, Name, UnitPrice, Stock, IsActive, AddedAt FROM dbo.Items ORDER BY Id;
