# Session 06 — Start here

## You need

- Visual Studio with the .NET desktop development workload and .NET 10 SDK (or an editor and .NET 10 CLI).
- A working Microsoft SQL Server instance and SSMS. Make sure your Windows account can connect and create a database/table. Use your own classroom/local practice instance.
- The extracted student ZIP (do not run from inside the ZIP).

## 1. Prepare the separate database

1. Open SSMS and connect to your SQL Server instance. Copy the **server name** shown in the connection dialog or Object Explorer.
2. Open `setup-inventory.sql` in SSMS. Execute the whole script. It creates only `DBM_Session06_Inventory` and seeds its missing `dbo.Items` table once. It never drops a database or removes existing rows.
3. Run `verify-inventory.sql`. Confirm CurrentDatabase is `DBM_Session06_Inventory`, IdIsIdentity is 1 and the familiar seed rows 1–16 exist. If setup reports an unexpected schema, stop and ask your instructor; do not drop your database.

## 2. Configure and run the starter

1. Open `EF10InventoryManager.sln` in Visual Studio. Set `EF10_InventoryManager` as Startup Project.
2. Open `EF10_InventoryManager/appsettings.json`. Replace only `YOUR_SERVER` with your actual SQL Server instance name. A backslash must be escaped in JSON: for example `Server=.\\SQLEXPRESS;...`. Keep the database name exactly as supplied. Integrated Security uses your Windows credentials. Do not post passwords or private strings in Classroom.
3. Restore NuGet packages and build. Package versions are already pinned. If restore fails, report the exact error rather than changing all versions. The app uses a trusted local SQL Server certificate setting only for classroom use.
4. Start without debugging (Ctrl+F5). Option 1 lists the current inventory. The remaining TODO options display a reminder until you implement their method.

CLI alternative from the extracted solution directory:

```sh
dotnet restore EF10InventoryManager.sln
dotnet build EF10InventoryManager.sln
dotnet run --project EF10_InventoryManager
```

## 3. Complete the TODOs

All six TODOs are in `EF10_InventoryManager/CrudTasks.cs`. Replace only the temporary statements **between** the numbered START and END markers. Do not copy another full class over the starter. The codelab provides the exact snippets after you try each exercise. Complete 01B in Step 03 before creating records; it is a read-only experiment with the three existing seed IDs.

| Menu option | Method | TODO |
|---|---|---|
| 1 | List inventory (supplied) | — |
| 2 | ReadAsync | 01 |
| 8 | ReadTrackingScopeAsync | 01B |
| 3 | CreateAsync | 02 |
| 4 | UpdatePriceAsync | 03 |
| 5 | DeleteAsync | 04 |
| 6 | TrackingExperiment.RunAsync (supplied) | — |
| 7 | UpdateStockAsync (challenge) | 05 |

Use `Common Green Darner`, price `12.50`, stock `3` as your first practice item (the book's item name; classroom price/stock values). **Write down the actual generated ID.** Use it for options 2, 4 and 5. Options 4, 5 and 7 reject reserved IDs 1–16. Work only with your own created practice records; do not edit or delete seed records. Option 5 requires typing YES exactly. After each operation, verify with option 1/2 or `verify-inventory.sql` (set `@ItemId` to your generated ID, then execute the whole script).

Option 8 enables a limited SQL command log. Run after completing TODO 01B and compare tracked entries (0, 1, 1, 1, 2) and the actual SELECT messages. In option 4, compare the tracked object's price with the separately queried stored price before and after saving. Do not use FindAsync for the stored-value verification if the same key is already tracked.

## 4. Troubleshooting

- No connection: check that SQL Server is running and the server name and authentication match SSMS.
- SQL error about missing database/table: run setup on that same instance. Refresh Object Explorer.
- Encryption/certificate failure: use the supplied local practice settings and ask your instructor about secure server configuration.
- Empty or missing item: check the generated ID and target database. Run option 1; do not guess an ID.
- Save fails: check constraints and connection. The app creates a fresh context per menu operation. Verify the stored value before retrying.
- Important: the browser simulator does not connect to SQL Server. The Console project is the real implementation.
