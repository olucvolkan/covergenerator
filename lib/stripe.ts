import { loadStripe } from '@stripe/stripe-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

export type PlanId = 'starter' | 'basic' | 'premium' | 'unlimited';

export interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  savings: string;
  stripe_price_id: string;
  popular?: boolean;
}

export const CREDIT_PLANS: Record<PlanId, CreditPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    price: 10,
    pricePerCredit: 2.00,
    savings: '0%',
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'price_1R9Ays09K2M4O1H8CtFYXcwQ',
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    credits: 15,
    price: 25,
    pricePerCredit: 1.67,
    savings: '17%',
    popular: true,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || 'price_1R9B0009K2M4O1H8aw4Wvf7w',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    credits: 35,
    price: 50,
    pricePerCredit: 1.43,
    savings: '29%',
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || 'price_1R9B0t09K2M4O1H83v9KK97c',
  },
  unlimited: {
    id: 'unlimited',
    name: 'Enterprise',
    credits: 100,
    price: 120,
    pricePerCredit: 1.20,
    savings: '40%',
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || 'price_1R9B1c09K2M4O1H8e0MuOQYo',
  }
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
export const createCheckoutSession = async (planId: PlanId, stripePriceId?: string) => {
  try {
    const plan = CREDIT_PLANS[planId];
    const supabase = createClientComponentClient();
    
    // Get current user and session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session found');
    }

    console.log('Creating checkout session for plan:', planId);
    console.log('Using price ID:', stripePriceId || plan.stripe_price_id);
    console.log(session);
    // Call updated Edge Function endpoint
    const response = await fetch('https://fniqovomddsjdsodaxbh.supabase.co/functions/v1/credits-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        price_id: stripePriceId || plan.stripe_price_id,
        user_id: session.user.id,
        success_url: `${window.location.origin}/success?credits=${plan.credits}`,
        cancel_url: `${window.location.origin}/pricing`,
        metadata: {
          plan_id: planId,
          credits: plan.credits
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from server:', errorText);
      throw new Error(`Failed to create checkout session: ${errorText}`);
    }

    const data = await response.json();
    console.log('Checkout session response:', data);

    if (data.url) {
      // Direct redirect to Stripe checkout page
      window.location.href = data.url;
      return true;
    } else if (data.sessionId) {
      // Redirect using Stripe.js
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw new Error(error.message || 'Failed to redirect to checkout');
      }
      
      return true;
    } else {
      throw new Error('No checkout URL or session ID returned');
    }
  } catch (error: any) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

// Check if a user has credits
export const checkUserCredits = async (user: User) => {
  try {
    if (!user) {
      throw new Error('User ID is required to check credits');
    }
    
    const supabase = createClientComponentClient();
    // Check credits in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credits, generated_cover_letters')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking user credits:', error);
      return { credits: 0, error };
    }
    
    return { 
      credits: profile?.credits || 0, 
      used: profile?.generated_cover_letters || 0,
      error: null 
    };
    
  } catch (error) {
    console.error('Error checking user credits:', error);
    return { credits: 0, used: 0, error };
  }
};

// Update user's credits after successful payment
export const updateUserCredits = async (userId: string, credits: number) => {
  try {
    const supabase = createClientComponentClient();
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    const currentCredits = profile?.credits || 0;
    const newCredits = currentCredits + credits;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        credits: newCredits
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true, credits: newCredits };
  } catch (error) {
    console.error('Error updating user credits:', error);
    return { success: false, error };
  }
}; 

// Decrement user's credits after generating a cover letter
export const useCredit = async (userId: string) => {
  try {
    const supabase = createClientComponentClient();
    
    // First get current credits and usage count
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits, generated_cover_letters')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      throw fetchError;
    }
    
    const currentCredits = profile?.credits || 0;
    const currentUsage = profile?.generated_cover_letters || 0;
    
    if (currentCredits <= 0) {
      return { success: false, error: 'No credits available' };
    }
    
    // Update credits and increment usage counter
    const { error } = await supabase
      .from('profiles')
      .update({ 
        credits: currentCredits - 1,
        generated_cover_letters: currentUsage + 1
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { 
      success: true, 
      remainingCredits: currentCredits - 1,
      usageCount: currentUsage + 1
    };
  } catch (error) {
    console.error('Error using credit:', error);
    return { success: false, error };
  }
};