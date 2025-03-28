import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase URL or Anonymous Key is missing. Make sure you have correctly set up your .env.local file with:\n" +
    "NEXT_PUBLIC_SUPABASE_URL=your-project-url\n" +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
  );
}

console.log("Initializing Supabase client with URL:", supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
export async function testSupabaseConnection() {
  try {
    // First try to check if we can connect to Supabase at all
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("Supabase authentication connection test failed:", authError);
      return { success: false, error: authError };
    }
    
    // Now try to check if our table exists
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error("Supabase database connection test failed:", error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (dbErr) {
      // If the table doesn't exist yet, let's check if we can at least list storage buckets
      try {
        const { data: buckets, error: bucketError } = await supabase
          .storage
          .listBuckets();
        
        if (bucketError) {
          console.error("Supabase storage connection test failed:", bucketError);
          return { success: false, error: bucketError };
        }
        
        // We could connect to storage but not to the database table
        return { 
          success: true, 
          warning: "Connected to Supabase, but the 'user_files' table may not exist yet." 
        };
      } catch (storageErr) {
        console.error("Supabase storage connection test failed:", storageErr);
        return { success: false, error: storageErr };
      }
    }
  } catch (err) {
    console.error("Error testing Supabase connection:", err);
    return { success: false, error: err };
  }
}

// User authentication functions
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}