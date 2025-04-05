import { supabase } from './auth';

export const uploadPDF = async (file: File, userId: string) => {
  // Validate userId to prevent database constraint violations
  if (!userId) {
    throw new Error("User ID is required for file upload. Please log in again.");
  }
  
  // Create a unique filename with timestamp to avoid conflicts
  const timestamp = new Date().getTime();
  const fileNameParts = file.name.split('.');
  const fileExtension = fileNameParts.pop();
  const fileNameWithoutExtension = fileNameParts.join('.');
  
  // Make the original filename unique by adding timestamp
  const uniqueFileName = `${fileNameWithoutExtension}_${timestamp}.${fileExtension}`;
  
  // Upload file to storage with unique filename
  const { data: storageData, error: storageError } = await supabase.storage
    .from('resumes')
    .upload(`${userId}/${uniqueFileName}`, file)

  if (storageError) {
    console.error('Storage error:', storageError);
    // If the error is not about existing files, throw it
    // Otherwise we shouldn't get here anymore with our timestamp approach
    throw storageError;
  }

  // Insert record into user_files table
  const { data: fileData, error: insertError } = await supabase
    .from('user_files')
    .insert([
      {
        user_id: userId,
        file_path: storageData.path,
        file_name: uniqueFileName, // Store the unique filename
        file_type: file.type,
        file_size: file.size,
        storage_bucket: 'resumes',
        public_url: storageData.fullPath
      }
    ])
    .select('id')
    .single()

  if (insertError) {
    // If there's an error inserting into the database, we should still return the storage path
    // but include a warning about the database insertion failure
    return {
      path: storageData.path,
      warning: `File uploaded but database record creation failed: ${insertError.message}`
    }
  }

  // Return both the storage path and the database record ID
  return {
    path: storageData.path,
    id: fileData.id
  }
} 