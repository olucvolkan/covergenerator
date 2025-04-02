import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a singleton Supabase client to be used across the application
export const supabase = createClientComponentClient();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log("Initializing Supabase client with URL:", supabaseUrl);

// Stored session state
let currentSession: any = null;
let sessionInitialized = false;

// Initialize and get the current session
export const initSession = async () => {
  try {
    if (!sessionInitialized) {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error initializing session:', error);
        return null;
      }
      
      currentSession = data.session;
      sessionInitialized = true;
      console.log('Session initialized:', currentSession ? 'active' : 'none');
    }
    
    return currentSession;
  } catch (error) {
    console.error('Error in initSession:', error);
    return null;
  }
};

// Get and possibly refresh the current session
export const getSession = async () => {
  try {
    // If we have a session already, return it
    if (sessionInitialized && currentSession) {
      return currentSession;
    }
    
    // Otherwise initialize it
    return await initSession();
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
};

// Update the session when it changes
export const updateSession = (session: any) => {
  currentSession = session;
  sessionInitialized = true;
};

// Set up auth state change listener to keep session updated
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    updateSession(session);
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

// Sign Out with session cleanup
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear session state
    updateSession(null);
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { error };
  }
};

// Get Current User
export const getCurrentUser = async () => {
  try {
    // First check if we have a valid session
    const session = await getSession();
    
    if (!session) {
      console.log('No active session found in getCurrentUser');
      return { data: null, error: new Error('No active session') };
    }
    
    // Get user data
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return { data: null, error: userError };
    }
    
    if (!user) {
      return { data: null, error: new Error('User not found') };
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Create profile if it doesn't exist (for Google login users)
    if (!profile) {
      console.log('Profile does not exist for user:', user.id);
      try {
        // Get email from user object
        const email = user.email;
        // Get full name from metadata
        const fullName = user.user_metadata?.full_name || 
                        (user.user_metadata?.name) || 
                        user.email?.split('@')[0] || 
                        'User';
                        
        console.log('Creating profile for Google login user:', { userId: user.id, email, fullName });
        
        await createProfile(user.id, email as string, fullName);
        
        // Fetch the newly created profile
        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (newProfileError) {
          console.error('Error fetching new profile:', newProfileError);
          return { data: { user, profile: null }, error: newProfileError };
        }
        
        return { data: { user, profile: newProfile }, error: null };
      } catch (profileCreationError) {
        console.error('Error creating profile for Google user:', profileCreationError);
        return { data: { user, profile: null }, error: profileCreationError };
      }
    }

    return { data: { user, profile }, error: null };
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return { data: null, error };
  }
};