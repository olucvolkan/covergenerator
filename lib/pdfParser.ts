import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  path: string;
  url: string;
  warning?: string;
}

export async function uploadPDF(file: File, userId: string): Promise<UploadResult> {
  try {
    console.log("Starting file upload to Supabase Storage");

    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error("You must be logged in to upload files. User authentication is required by storage policies.");
    }

    // Check if the bucket exists by trying to list files
    try {
      await supabase.storage.from('resumes').list();
      console.log("The 'resumes' bucket exists");
    } catch (bucketError: any) {
      console.error("Error checking 'resumes' bucket:", bucketError);
      throw new Error(
        "Storage bucket 'resumes' does not exist. Please create it in the Supabase dashboard: " +
        "Storage > Create new bucket > Name: 'resumes' > Set to public."
      );
    }

    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError);
      
      // Check for auth-related errors
      if (uploadError.message.includes('auth') || 
          uploadError.message.includes('permission') || 
          uploadError.message.includes('not allowed')) {
        throw new Error(`Authentication error: ${uploadError.message}. Make sure the bucket has a policy allowing authenticated users to upload.`);
      }
      
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    if (!uploadData) {
      throw new Error('File upload returned no data');
    }

    console.log("File uploaded successfully to Supabase Storage:", uploadData.path);

    // Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(uploadData.path);

    if (!urlData || !urlData.publicUrl) {
      console.warn("Couldn't get public URL, but file was uploaded");
    }

    const publicUrl = urlData?.publicUrl || '';

    // Store the file reference in the database
    let warning: string | undefined = undefined;
    
    try {
      // Insert file info into the user_files table
      const { data: insertData, error: insertError } = await supabase
        .from('user_files')
        .insert({
          user_id: userId,
          file_path: uploadData.path,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_bucket: 'resumes',
          public_url: publicUrl
        })
        .select('id')
        .single();

      if (insertError) {
        console.warn("Error inserting file record into database:", insertError);
        
        // Check if it's an RLS error
        if (insertError.message.includes('policy') || insertError.message.includes('permission') || 
            insertError.message.includes('security') || insertError.message.includes('violates')) {
          warning = `File uploaded successfully, but couldn't save to database: new row violates row-level security policy. You need to create an INSERT policy for the 'user_files' table.`;
        } else {
          warning = `File uploaded successfully, but couldn't save to database: ${insertError.message}`;
        }
        
        console.log("Warning will be returned:", warning);
      } else {
        console.log("File reference saved to database with ID:", insertData?.id);
      }
    } catch (dbError: any) {
      console.warn("Exception during database insert:", dbError);
      warning = `File uploaded successfully, but couldn't save metadata to database: ${dbError.message || 'Unknown database error'}`;
    }

    // Return the file path, public URL, and any warning
    return {
      path: uploadData.path,
      url: publicUrl,
      warning
    };
  } catch (error: any) {
    console.error("Error in uploadPDF function:", error);
    throw error;
  }
} 