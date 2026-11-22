# DBM Session 06 — Evidence

Name:  
Student ID:  
Group:

## Guided work

- Database name and server verification (hide any sensitive connection details):
- Screenshot of option 1 with the familiar inventory:
- Existing and missing key lookup results:
- Option 8 tracking counts and SQL output (first and repeated Find; no-tracking read):
- Created item name and actual generated ID:
- Screenshot/result proving INSERT after save:
- Memory price and state; actual stored price before and after SaveChangesAsync; Console and SSMS verification:
- Delete cancellation and confirmed deletion for your own item:
- Screenshot/result showing the item is no longer found:

## Understanding

1. What is the difference between an object in memory and a row in SQL Server?
2. Why does editing a tracked object not need Update()?
3. What does SaveChangesAsync() normally do?
4. What happens if a context is disposed before saving or the entity is untracked?
5. Why does a second FindAsync of the same key return the same tracked object? What did you observe in the SQL log?
6. Why can a table have 16 rows while the tracker has only two entries?

## Independent challenge

- New record's generated ID:
- Updated stock and IsActive before/after:
- Console and SSMS evidence (do not delete before capturing it):
- Explain the state transition and whether explicit Update was required:
- Your review quiz score:

Submit the requested project files and this evidence through Classroom. Do not submit passwords or others' work.
