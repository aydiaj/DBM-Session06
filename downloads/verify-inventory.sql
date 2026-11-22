-- Read-only verification; change NULL to the generated ID printed by your app.
USE [DBM_Session06_Inventory];
GO
IF DB_NAME() <> N'DBM_Session06_Inventory'
    THROW 50000, 'Wrong database. Stop.', 1;

DECLARE @ItemId int = NULL; -- Example: paste your actual generated ID here.

SELECT DB_NAME() AS CurrentDatabase,
       COLUMNPROPERTY(OBJECT_ID(N'dbo.Items'), N'Id', 'IsIdentity') AS IdIsIdentity;

SELECT Id, Name, UnitPrice, Stock, IsActive, AddedAt
FROM dbo.Items
ORDER BY Id;

IF @ItemId IS NOT NULL
BEGIN
    SELECT Id, Name, UnitPrice, Stock, IsActive, AddedAt
    FROM dbo.Items WHERE Id = @ItemId;
    SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.Items WHERE Id = @ItemId)
        THEN 'Found' ELSE 'Not found' END AS ItemStatus;
END
