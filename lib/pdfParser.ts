import { supabase } from './auth'

export const uploadPDF = async (file: File, userId: string) => {
  if (!file || !userId) {
    throw new Error('File and user ID are required');
  }

  console.log(`Uploading PDF: ${file.name} for user: ${userId}`);

  try {
    // Generate a unique filename to avoid collisions
    const timestamp = Date.now();
    const uniquePath = `${userId}/${timestamp}_${file.name}`;
    
    // Upload file to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('resumes')
      .upload(uniquePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) {
      console.error('Storage error during PDF upload:', storageError);
      throw new Error(`Failed to upload file: ${storageError.message}`);
    }

    if (!storageData || !storageData.path) {
      console.error('No storage data returned from upload');
      throw new Error('Upload failed: No storage data returned');
    }

    console.log('File uploaded to storage:', storageData.path);

    // Insert record into user_files table
    const fileRecord = {
      user_id: userId,
      file_path: storageData.path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_bucket: 'resumes'
    };
    
    console.log('Creating database record with data:', fileRecord);
    
    const { data: fileData, error: insertError } = await supabase
      .from('user_files')
      .insert([fileRecord])
      .select('id, file_path, file_name')
      .single();

    if (insertError) {
      console.error('Database error during file record creation:', insertError);
      // If there's an error inserting into the database, we should still return the storage path
      // but include a warning about the database insertion failure
      return {
        path: storageData.path,
        warning: `File uploaded but database record creation failed: ${insertError.message}`
      };
    }

    if (!fileData || !fileData.id) {
      console.error('No file data returned from database insert');
      return {
        path: storageData.path,
        warning: 'File uploaded but database record ID is missing'
      };
    }

    console.log('File record created in database with ID:', fileData.id);

    // Return both the storage path and the database record ID
    return {
      path: storageData.path,
      id: fileData.id,
      name: fileData.file_name
    };
  } catch (error) {
    console.error('Error in uploadPDF:', error);
    throw error;
  }
};