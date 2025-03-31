import { supabase } from '@/lib/supabaseClient';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log("Initializing Supabase client with URL:", supabaseUrl);
// İkinci bir client oluşturmuyoruz - shared client kullanıyoruz
// export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection
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
const createProfile = async (userId: string, email: string) => {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (existingProfile) {
      console.log("Profile already exists for user:", userId);
      return;
    }
    
    // Create profile record
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        has_paid: false,
        generated_cover_letters: 0
      });
    
    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw profileError;
    }
    
    console.log("Profile created successfully for user:", userId);
  } catch (error) {
    console.error("Error in createProfile:", error);
    // We don't want to fail the registration if profile creation fails
    // The user can still use the app, but some features might not work
  }
};

// User authentication functions
export async function signUp(email: string, password: string, fullName: string) {
  try {
    // Basic validation
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    // Email format validation
    if (!validateEmail(email)) {
      throw new Error("Please enter a valid email address.");
    }

    // Password strength validation
    if (!validatePassword(password)) {
      throw new Error("Password must be at least 6 characters long.");
    }
    
    // First check if user already exists in auth system
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    
    if (existingUsers) {
      throw new Error("This email is already registered. Please use a different email or sign in.");
    }
    
    // Register the user with Supabase
      // If the email doesn't exist in profiles, proceed with signup
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            email: email,
            first_name: email,
            last_name: ''
          }
        }
      });
      
    if (error) {
      console.error('Error during sign up:', error);
      return { data: null, error };
    }
    
    console.log('Sign up successful, created user:', data.user?.id);
    
    // Create profile for the new user
    if (data.user) {
      await createProfile(data.user.id, email);
    }
    
    // If email confirmation is disabled, this will already be a confirmed user
    // with an active session
    if (data.session) {
      console.log("Email confirmation appears to be disabled, session already available");
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Exception during sign up:', err);
    return { data: null, error: err as Error };
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log('Attempting to sign in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
    
    console.log('Sign in successful for user:', data.user.id);
    return { data, error: null };
  } catch (err) {
    console.error('Exception during sign in:', err);
    return { data: null, error: err as Error };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  try {
    // Check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting auth session:', sessionError);
      return null;
    }
    
    if (!session) {
      console.log('No active session found');
      return null;
    }
    
    console.log('Session found, user ID:', session.user.id);
    
    // Get the user with their profile data
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user data:', userError);
      return session.user; // Return basic session user if we can't get full profile
    }
    
    if (!user) {
      console.log('User data not found, returning session user');
      return session.user;
    }
    
    console.log('Full user data retrieved:', user.user.email);
    
    // Check if we have additional user data in the users table
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();
    
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    }

    console.log(userProfile);
    // Return combined user data (auth user + profile data if available)
    return {
      ...user.user,
      profile: userProfile || null
    };
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}