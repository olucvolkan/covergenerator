import { Database } from '@/types/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient<Database>();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log("Initializing Supabase client with URL:", supabaseUrl);

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // First check if we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return { 
        success: false, 
        error: sessionError 
      };
    }
    
    // Check if we can access the database
    console.log('Testing database access...');
    let databaseWarning = null;
    
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('Database access error:', error);
        databaseWarning = `Database issue: ${error.message}`;
      } else {
        console.log('Database access successful:', data ? data.length : 0, 'records');
      }
    } catch (dbError) {
      console.warn('Exception during database access:', dbError);
      databaseWarning = `Database exception: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
    }
    
    // Check if we can access the Storage bucket
    console.log('Testing Storage access...');
    let storageWarning = null;
    
    try {
      // Try to list files in the bucket instead of listing buckets (which requires special permissions)
      const { data: bucketFiles, error: bucketError } = await supabase
        .storage
        .from('resumes')
        .list('');
      
      if (bucketError) {
        console.warn('Storage bucket access error:', bucketError);
        
        if (bucketError.message && bucketError.message.includes('does not exist')) {
          storageWarning = `Bucket 'resumes' does not exist. Please create it in the Supabase dashboard.`;
        } else {
          storageWarning = `Storage issue: ${bucketError.message}`;
        }
      } else {
        console.log('Storage access successful, found', bucketFiles ? bucketFiles.length : 0, 'files');
      }
    } catch (storageError) {
      console.warn('Exception during storage access:', storageError);
      storageWarning = `Storage exception: ${storageError instanceof Error ? storageError.message : String(storageError)}`;
    }
    
    // Set up authentication status warning
    let authWarning = null;
    if (!session) {
      authWarning = 'No active session. User authentication is required for file uploads.';
    }
    
    // Combine warnings
    const warningMessages = [authWarning, databaseWarning, storageWarning]
      .filter(Boolean)
      .join('; ');
    
    return {
      success: true,
      warning: warningMessages || undefined
    };
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return {
      success: false,
      error
    };
  }
}

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Create profile function
const createProfile = async (userId: string, email: string, fullName: string) => {
  if (!userId || !email) {
    throw new Error('User ID and email are required for profile creation');
  }

  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }
    
    if (existingProfile) {
      console.log("Profile already exists for user:", userId);
      return;
    }

    // Parse full name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        has_paid: false,
        generated_cover_letters: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }

    console.log("Profile created successfully for user:", userId);
  } catch (error) {
    console.error("Error in createProfile:", error);
    throw error;
  }
};

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    return { data: null, error };
  }
};

// Sign Out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { error };
  }
};

// Get Current User
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) return { data: null, error: null };

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { data: null, error: profileError };
    }

    return { data: { user, profile }, error: null };
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return { data: null, error };
  }
};

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}