import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * API endpoint to map an external provider ID to a Supabase user ID
 * This is useful for extensions or external services that only have the provider ID
 */
export async function POST(request: Request) {
  try {
    const { external_id } = await request.json();

    if (!external_id) {
      return NextResponse.json({ error: 'External ID is required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Try different methods to find the user
    
    // Method 1: Check profiles table for external_id field
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('external_id', external_id)
      .single();

    if (!profileError && profileData) {
      return NextResponse.json({ 
        user_id: profileData.id,
        source: 'profiles'
      });
    }

    // Method 2: Query auth.users or other authentication tables (requires higher permissions)
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && users) {
        // Look for a user with a matching identity
        const matchedUser = users.users.find(user => 
          user.identities?.some(identity => 
            identity.provider === external_id || 
            identity.identity_data?.sub === external_id
          )
        );

        if (matchedUser) {
          return NextResponse.json({ 
            user_id: matchedUser.id,
            source: 'auth.users'
          });
        }
      }
    } catch (adminError) {
      console.error('Error accessing admin API:', adminError);
      // Continue to other methods
    }

    // No matching user found
    return NextResponse.json({ 
      error: 'No user found with the provided external ID',
      external_id
    }, { status: 404 });

  } catch (error) {
    console.error('Error in auth mapping:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

/**
 * GET endpoint to test if the user mapping service is working
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'User ID mapping service is running',
    usage: 'POST to this endpoint with {"external_id": "your-external-id"} to get the corresponding Supabase user ID'
  });
}