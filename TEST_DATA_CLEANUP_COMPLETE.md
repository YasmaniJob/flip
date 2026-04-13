# Test Data Cleanup - Complete

## Summary
Successfully created and executed comprehensive deletion scripts that remove test users, orphan institutions, and ALL their related data from the database.

## Scripts Created

### 1. `apps/web/scripts/delete-test-users.ts`
Deletes specific test users and all their related data.

### 2. `apps/web/scripts/clean-orphan-institutions.ts`
Deletes institutions without users and all their related data.

### 3. `apps/web/scripts/check-institution-categories.ts`
Utility script to verify institutions and their categories.

## Execution Results

### Test Users Cleanup
✅ All test users were already cleaned up in previous run

### Orphan Institutions Cleanup
✅ Successfully deleted:
- 1 orphan institution (GRAN UNIDAD ESCOLAR SAN CARLOS duplicate with ID: 9003ef21-2e92-43d1-82e8-21bdbe2bf812)
- 5 categories (Mobiliario, Periféricos, Displays y Multimedia, Almacenamiento, Equipos Portátiles)
- 9 resource templates
- 0 resources (already cleaned)

### Final Database State
✅ Clean database with:
- 1 active institution (GRAN UNIDAD ESCOLAR SAN CARLOS with 5 users)
- 0 orphan categories
- 0 orphan institutions

## What Gets Deleted

### Complete Data Cascade (in correct order)

1. **Diagnostic Module**
   - diagnosticResponses (individual answers)
   - diagnosticSessions (teacher diagnostic sessions)

2. **Reservations**
   - reservationSlots (date + pedagogical hour slots)
   - reservationAttendance (workshop attendance)
   - reservationTasks (workshop agreements)
   - classroomReservations (main reservations)

3. **Meetings**
   - meetingAttendance (meeting attendance records)
   - meetingTasks (meeting agreements)
   - meetings (main meeting records)

4. **Loans**
   - loanResources (many-to-many loan-resource relations)
   - loans (main loan records)

5. **Inventory** (IMPORTANT: Order matters!)
   - resources (inventory items)
   - resourceTemplates (MUST be deleted before categories)
   - categorySequences (atomic ID generation)
   - categories (inventory categories)

6. **Staff**
   - staff (personnel records)

7. **Academic Structure**
   - pedagogicalHours (class periods)
   - classrooms (physical spaces - AIP, labs)
   - sections (class sections)
   - grades (grade levels)
   - curricularAreas (subject areas)

8. **Subscription**
   - subscriptionHistory (subscription change log)

9. **Institutions**
   - institutions (the institutions themselves)

10. **User Data** (for delete-test-users.ts only)
    - accounts (OAuth accounts)
    - sessions (user sessions)
    - users (user records)

## Execution Commands

### Delete Test Users
```bash
npx dotenv -e .env.local -- npx tsx scripts/delete-test-users.ts
```

### Clean Orphan Institutions
```bash
npx dotenv -e .env.local -- npx tsx scripts/clean-orphan-institutions.ts
```

### Check Institutions
```bash
npx dotenv -e .env.local -- npx tsx scripts/check-institution-categories.ts
```

## Key Features

1. **Structural Solution**: Not a patch - deletes ALL related data in the correct order
2. **Foreign Key Safe**: Respects database constraints by deleting in dependency order
3. **Comprehensive**: Covers all 30+ tables in the schema
4. **Informative**: Provides detailed console output showing what was deleted
5. **Reusable**: Can be run again with different email lists or to clean new orphan institutions

## Technical Details

- Uses Drizzle ORM for type-safe database operations
- Loads environment variables using dotenv-cli
- Handles foreign key constraints by deleting children before parents
- Uses `inArray()` for efficient batch operations
- Returns deleted records for accurate counting
- Critical fix: resourceTemplates must be deleted BEFORE categories

## Verification

Drizzle Studio is running at https://local.drizzle.studio to verify the cleanup.

## Problem Solved

The orphan categories shown in the screenshot belonged to a duplicate institution "GRAN UNIDAD ESCOLAR SAN CARLOS" that had:
- 0 users (orphan institution)
- 5 categories
- 9 resource templates

This institution was successfully identified and removed along with all its data, preventing future conflicts.

## Files Created/Modified

- `apps/web/scripts/delete-test-users.ts` - Complete rewrite with full cascade deletion
- `apps/web/scripts/clean-orphan-institutions.ts` - NEW: Cleans institutions without users
- `apps/web/scripts/check-institution-categories.ts` - NEW: Utility to verify database state
- `apps/web/scripts/clean-orphan-categories.ts` - Created but not needed (categories had institutions)
- `apps/web/scripts/clean-dangling-categories.ts` - Created but not needed (no dangling references)
