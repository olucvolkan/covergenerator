# Automatic CV File ID Implementation

This branch modifies the cover letter generation process to automatically use the most recently uploaded CV file when no file_id is provided.

## Files Changed

1. `app/api/generate-cover-letter/route.ts` - Enhanced to find the most recent CV file for a user when no file_id is provided
2. `components/CoverLetterGenerator.tsx.part` - Updated to work with the new backend behavior

## For CoverLetterGenerator.tsx

Update the `handleGenerateCoverLetter` function based on the code in `components/CoverLetterGenerator.tsx.part`. The key change is that we no longer require `uploadedFileId` to be set - the backend will handle finding the most recent file.

## How It Works

1. When a cover letter generation request is made without a file_id, the backend API will:
   - Query the database for the most recent file uploaded by the user
   - Use that file_id for the cover letter generation
   - Return an appropriate error if no files are found

2. This approach means that even if a file was uploaded in a previous session, the system will still be able to generate a cover letter without requiring a new upload.

## Testing

1. Login with a user who has previously uploaded at least one CV
2. Try generating a cover letter without uploading a new CV
3. The system should automatically use the most recently uploaded CV