import { loadStripe } from '@stripe/stripe-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

export type Plan = 'free' | 'premium';

export interface PlanDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  stripe_price_id: string;
}

export const PLANS: Record<Plan, PlanDetails> = {
  free: {
    id: 'prod_S23ZKWzz8Filuy',
    name: 'Free Plan',
    description: 'Get started with basic features',
    price: 0,
    features: [
      '5 cover letter generations',
      'PDF downloads',
      'Basic templates',
    ],
    stripe_price_id: 'price_1R7zS2CvudmTjOfSj6POCeDG',
  },
  premium: {
    id: 'prod_S23YEjO0HutG3z',
    name: 'Premium Plan',
    description: 'Unlimited cover letters and advanced features',
    price: 3, // €3 per month
    features: [
      'Unlimited cover letter generations',
      'Store all your resumes and cover letters',
      'Advanced customization options',
      'Premium templates',
      'Priority support',
    ],
    stripe_price_id: 'price_1R7zRqCvudmTjOfSh1zsolo3',
  },
};

// Initialize Stripe
export const getStripe = async () => {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
    
    if (!publishableKey) {
      throw new Error('Stripe publishable key is missing. Please check your environment variables.');
    }
    
    return await loadStripe(publishableKey);
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    throw error;
  }
};

// Create Stripe checkout session using Supabase Edge Function
export const createCheckoutSession = async (planId: Plan) => {
  try {
    if (planId === 'free') {
      throw new Error('Cannot create checkout session for free plan');
    }

    const plan = PLANS[planId];
    const supabase = createClientComponentClient();
    
    // Get current user and session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    console.log('Creating checkout session for plan:', planId);
    console.log('Using price ID:', plan.stripe_price_id);

    // Call Edge Function
    const response = await fetch('https://fniqovomddsjdsodaxbh.supabase.co/functions/v1/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    const responseText = await response.text();
    console.log('Response text:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error(`Invalid response from server: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to create checkout session');
    }

    if (!responseData.url) {
      throw new Error('No checkout URL returned');
    }

    // Redirect to Stripe Checkout
    window.location.href = responseData.url;

  } catch (error: any) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

// Check if a user has a premium plan using profiles table
export const checkUserPremiumAccess = async (user: User) => {
  try {
    if (!user) {
      throw new Error('User ID is required to check premium access');
    }
    
    const supabase = createClientComponentClient();
    // Check has_paid status in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('has_paid, generated_cover_letters')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
    
    // If user has paid, they have premium access
    return profile?.has_paid || false;
    
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
};

// Update user's premium status after successful payment
export const updateUserPremiumStatus = async (userId: string, stripeCustomerId: string) => {
  try {
    const supabase = createClientComponentClient();
    const { error } = await supabase
      .from('profiles')
      .update({ 
        has_paid: true,
        stripe_customer_id: stripeCustomerId 
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating premium status:', error);
    return false;
  }
}; 