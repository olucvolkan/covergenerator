import { createBrowserClient } from '@supabase/ssr'

export const uploadPDF = async (file: File, userId: string) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Upload file to storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('resumes')
    .upload(`${userId}/${file.name}`, file)

  if (storageError) {
    throw storageError
  }

  // Insert record into user_files table
  const { data: fileData, error: insertError } = await supabase
    .from('user_files')
    .insert([
      {
        user_id: userId,
        file_path: storageData.path,
        file_name: file.name,
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