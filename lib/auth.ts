import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a singleton Supabase client to be used across the application
export const supabase = createClientComponentClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Get and possibly refresh the current session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
};

// Get current user with profile data
export const getCurrentUser = async () => {
  try {
    const session = await getSession();
    
    if (!session?.user) {
      return { data: { user: null, profile: null }, error: new Error('No active session') };
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return { data: { user: session.user, profile: null }, error: profileError };
    }

    // Create profile if it doesn't exist (for Google login users)
    if (!profile) {
      const email = session.user.email;
      const fullName = session.user.user_metadata?.full_name || 
                      `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim();

      if (!email) {
        return { data: { user: session.user, profile: null }, error: new Error('Email is required for profile creation') };
      }
      
      try {
        await createProfile(session.user.id, email, fullName);
        
        // Fetch the newly created profile
        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (newProfileError) {
          console.error('Error fetching new profile:', newProfileError);
          return { data: { user: session.user, profile: null }, error: newProfileError };
        }

        return { data: { user: session.user, profile: newProfile }, error: null };
      } catch (profileCreationError) {
        console.error('Error creating profile for Google user:', profileCreationError);
        return { data: { user: session.user, profile: null }, error: profileCreationError };
      }
    }

    return { data: { user: session.user, profile }, error: null };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return { data: { user: null, profile: null }, error };
  }
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
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw checkError;
    }

    if (existingProfile) {
      return existingProfile;
    }

    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email,
          full_name: fullName,
          credits: 0,
          generated_cover_letters: 0,
          has_paid: false
        }
      ]);

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }
  } catch (error) {
    console.error("Error in createProfile:", error);
    throw error;
  }
};

// Set up auth state change listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      // Clear any cached data
      window.location.href = '/';
    }
  });
}

export async function testSupabaseConnection() {
  try {
    
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
    let databaseWarning = null;
    
    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('Database access error:', error);
        databaseWarning = `Database issue: ${error.message}`;
      }
    } catch (dbError) {
      console.warn('Exception during database access:', dbError);
      databaseWarning = `Database exception: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
    }
    
    // Check if we can access the Storage bucket
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

// Sign Out with session cleanup
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear session state
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { error };
  }
};