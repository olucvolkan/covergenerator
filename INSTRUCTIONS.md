# Fix User ID Mapping for Extension

## Problem

The extension is using Google's user ID (e.g., `116884556676482662951`) instead of the Supabase user ID, causing `file_id` lookup failures.

## Changes Made

1. **Enhanced User ID Mapping in API:**
   - Modified `app/api/generate-cover-letter/route.ts` to detect Google IDs and map them to Supabase user IDs
   - Attempts multiple lookup strategies to find the correct user

2. **Added External ID Storage:**
   - Updated `lib/auth.ts` to store external provider IDs in the profiles table
   - Added `external_id` field to the profile creation process

3. **Added User Mapping API Endpoint:**
   - Created `app/api/auth/mapping/route.ts` for external services to map IDs
   - Provides a dedicated endpoint for ID translation

## When Using Google Login

When a user logs in with Google, we now:
1. Store their Google ID in the profiles table as `external_id`
2. When the extension sends a request with a Google ID, we map it to the correct Supabase user ID
3. Use the correct user ID to find the most recent file

## Testing

1. Login with a Google account on the main site
2. Use the extension with the same Google account
3. The system should correctly map the Google ID to your Supabase user ID
4. This should resolve the "CV file_id is required" error

## Database Schema Update (Optional)

If the `external_id` column doesn't exist in the profiles table, you might need to add it:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS external_id TEXT;
```