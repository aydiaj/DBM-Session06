# Session 06 — Code explained

## Three projects, one application

| File/project | Responsibility |
|---|---|
| `EF10_InventoryModels/Item.cs` | Entity and mapping. `Id` is an identity key; Name is required, max length 100; UnitPrice maps to decimal(10,2). |
| `EF10_InventoryDBLibrary/InventoryDBContext.cs` | Context, constructor accepting typed options, and `DbSet<Item>` query/operation entry point. |
| `EF10_InventoryManager/appsettings.json` | Local server/database connection settings. |
| `EF10_InventoryManager/Program.cs` | Reads settings, verifies database name, chooses the SQL Server provider and runs the menu. |
| `EF10_InventoryManager/Inputs.cs` | Validates IDs, names, price and stock before database operations. |
| `EF10_InventoryManager/ConsoleReport.cs` | Prints loaded objects; does not query the database. |
| `EF10_InventoryManager/CrudTasks.cs` | Six focused TODOs: read, tracking scope, create, price update with save checkpoints, confirmed delete, and stock challenge. |
| `EF10_InventoryManager/TrackingExperiment.cs` | Supplied tracking experiment; changes to seed data are never saved. |

`Microsoft.EntityFrameworkCore.SqlServer` is the provider package; `UseSqlServer(connection)` selects/configures it and builds options. The provider uses SQL Server's driver, `Microsoft.Data.SqlClient`. Options and a context do not immediately open a database connection. EF uses the connection when it executes a query or saves changes and normally closes a connection it opened.

`using var db = new InventoryDbContext(options);` scopes the context to one menu action. It is a unit of work. Disposal releases resources and tracking; it does not call SaveChanges.

Option 8 creates the same configured context with a supplied additional logging option: `LogTo(Console.WriteLine, new[] { RelationalEventId.CommandExecuted })`. This displays executed SQL commands only during this learning experiment. The log does not enable sensitive-data logging. It is prepared infrastructure; no new logging package or configuration exercise is needed.

## CRUD patterns

| Operation | What you do in C# | What happens in the database |
|---|---|---|
| Read to display | `await db.Items.AsNoTracking().SingleOrDefaultAsync(i => i.Id == id)` | Returns an untracked Item or null. For a display, use Select if only certain fields are needed. |
| Read to change / delete by key | `await db.Items.FindAsync(id)` | Returns tracked object (may reuse an already tracked entity); otherwise executes a key lookup. Missing row → null. A normal LINQ entity query also tracks by default. |
| Create | `new Item` then `db.Items.Add(item)` | Add tracks the object as Added; saving sends INSERT. SQL Server supplies the generated ID. |
| Update | Find, null check, assign property | Property changes in memory. Saving detects changes and sends UPDATE for changed mapped values. No explicit Update necessary. |
| Delete | Find, confirm, `db.Items.Remove(item)` | Existing entity is marked Deleted; saving sends DELETE. |

`await` waits asynchronously for the operation to finish. `Task` represents unfinished or completed work; `Task.CompletedTask` in the starter is just a placeholder. Replace it in the TODO.

`var` lets the compiler infer the type. `Item?` means the value may be null; a null check stops an operation if the requested entity does not exist. `new List<Item> { item }` makes a one-element list for the supplied report helper. `new Item { ... }` uses an object initializer. `DateTime.Now` records the application computer's current local time. `m` denotes a decimal literal in C#.

`int.TryParse` / `decimal.TryParse` return a Boolean and assign the converted value to an `out` parameter. Invalid input cancels the operation safely. `||` and `&&` combine conditions. `Console.ReadLine()` may return null; `?.Trim()` safely handles it. `using` and `try/catch` scope resources and report errors. A failed SaveChanges must not be reported as successful.

## Tracking and the save boundary

The Change Tracker belongs to the current context. A tracked entity has original and current values. With ordinary snapshot tracking, assigning a property may leave the state Unchanged until detection. `DetectChanges()` compares values. `SaveChangesAsync()` normally calls detection automatically. `db.Entry(item)` and `ChangeTracker.Entries()` can also detect changes, so do not use them to claim the state was unchanged immediately after editing unless detection is controlled.

### Choose the read before choosing the method

Use a no-tracking entity query to display rows, and a tracked entity query to prepare a change in the same context. `FindAsync` is a convenient primary-key lookup when you need a tracked entity. For an extra condition or projection, compose LINQ. Use `SingleOrDefaultAsync` if at most one match is expected; use `FirstOrDefaultAsync` to choose one of possibly many matches. A projection of values only does not materialise an entity to track.

In a usual ASP.NET Core web application, the display request and the later save request have different short-lived contexts. The save request loads the entity by ID again with tracking, validates and applies permitted changes, then saves. The Console menu's fresh context per action helps prepare you for that pattern. Gorman Ch. 6, Listings 6-3–6-4; Smith Ch. 2, §2.3.4 and Ch. 3, §3.3.1 (Figure 3.2).

### First retrieve, then track (TODO 01B)

An empty context does not track the database or table. `FindAsync(1)` checks tracked entities in this context by primary key before it queries SQL Server. When it finds an existing stored row for the first time, it returns a tracked entity. Repeating Find for the same key returns the same object, so the count stays at one and no new SQL command is needed. `ReferenceEquals(first, again)` compares object references, not database values. A normal LINQ query may still execute SQL and reuse a tracked object; FindAsync is special because it can skip the SQL query entirely. A missing key returns null. For a non-key predicate or a no-tracking key lookup, use LINQ. `Entries().Count()` counts tracked entity instances, not rows in the table; `Entries<Item>()` limits entries to Item types. Read ID 2 without tracking then find ID 3: expected counts 0 → 1 → 1 → 1 → 2, assuming the supplied seed IDs exist.

### Observe the actual save boundary (TODO 03)

The update task prints the object's new price and state after `Entry()` inspection, then queries an untracked copy from SQL Server to show the stored price before saving. Use the same context for the tracked update; the separate no-tracking query won't replace its tracked object. Calling Find again could return the edited memory object rather than the stored value. `SaveChangesAsync()` persists the tracked difference. A second no-tracking query verifies the price after successful saving. An unchanged price may result in zero written entries. Verify separately in SSMS as well.

| State | Meaning when saving |
|---|---|
| Detached | No tracked entry; no automatic write for this object. |
| Added | New entity; INSERT. |
| Unchanged | No updates needed. |
| Modified | Changed tracked entity; UPDATE. |
| Deleted | Existing row scheduled for DELETE. |

After a normal successful save, Added/Modified become Unchanged, and Deleted becomes Detached. The return value of `SaveChangesAsync()` is a count of state entries written, not a guaranteed exact SQL row count. A zero result can be valid if the value was unchanged. `Update()` explicitly marks an entity for updating (often more properties); it is unnecessary when editing a normally tracked entity. Removing a newly Added object cancels its pending insertion.

`AsNoTracking()` queries still create objects in memory, but do not automatically track them in this context. Edits to those objects alone are not saved. The tracking experiment deliberately disables automatic detection briefly, calls DetectChanges explicitly, restores the setting in finally, reads a separate untracked copy, clears pending tracking without saving, then demonstrates that an untracked edit alone writes zero entries. This is not a pattern to copy into every CRUD method.

Changing data through SaveChanges is not changing the database schema. Schema migrations are a separate topic.

## Book quick references

Gorman, *Practical Entity Framework Core 10*, Ch. 6: pp. 209–214, Activity 6-1 Listings 6-3, 6-14, 6-19, 6-26–28. The current exercises adapt Category/Genre/related-data operations to the single Item entity. Smith, *Entity Framework Core in Action*, Ch. 3 §3.1–3.3, §3.5.
