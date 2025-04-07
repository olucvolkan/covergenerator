# CvtoLetter - AI Cover Letter Generator

## Update Required for Extensions

If you're using the extension with Google authentication, you need to add an `external_id` column to your `profiles` table:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS external_id TEXT;
```

Then, populate the column for existing users by running a script or manually entering the Google ID for each user.
