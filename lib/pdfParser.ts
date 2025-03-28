import { supabase } from './auth';

// Function to upload PDF to Supabase Storage
export async function uploadPDF(file: File, userId: string) {
  try {
    if (!file) throw new Error('No file provided');
    
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload file to Supabase bucket
    const { data, error } = await supabase
      .storage
      .from('resumes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL for the file
    const { data: { publicUrl } } = supabase
      .storage
      .from('resumes')
      .getPublicUrl(filePath);
    
    // Store file reference in database
    const { error: dbError } = await supabase
      .from('user_files')
      .insert({
        user_id: userId,
        file_path: filePath,
        file_type: 'resume',
        file_name: file.name,
        file_size: file.size,
        public_url: publicUrl
      });
    
    if (dbError) throw dbError;
    
    return { path: filePath, url: publicUrl };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
} 