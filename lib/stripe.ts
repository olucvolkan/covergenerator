import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

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
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw new Error('User authentication required');
    }

    if (!user) {
      throw new Error('Please log in to subscribe');
    }

    console.log('Creating checkout session for plan:', planId);
    console.log('Using price ID:', plan.stripe_price_id);
    console.log('User ID:', user.id);

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        price_id: plan.stripe_price_id,
        user_id: user.id,
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/`,
      }
    });

    if (error) {
      throw error;
    }

    if (!data || !data.sessionId) {
      throw new Error('Failed to create checkout session');
    }

    // Redirect to Stripe Checkout
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Failed to initialize Stripe');
    }

    const { error: redirectError } = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (redirectError) {
      throw redirectError;
    }

  } catch (error: any) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

// Check if a user has a premium plan using profiles table
export const checkUserPremiumAccess = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to check premium access');
    }
    
    // Check has_paid status in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('has_paid, generated_cover_letters')
      .eq('id', userId)
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