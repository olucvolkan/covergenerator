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
    price: 12,
    pricePerCredit: 2.40,
    savings: '0%',
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'price_1R9Ays09K2M4O1H8CtFYXcwQ',
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    credits: 15,
    price: 30,
    pricePerCredit: 2.00,
    savings: '17%',
    popular: true,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || 'price_1R9B0009K2M4O1H8aw4Wvf7w',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    credits: 35,
    price: 60,
    pricePerCredit: 1.71,
    savings: '29%',
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || 'price_1R9B0t09K2M4O1H83v9KK97c',
  },
  unlimited: {
    id: 'unlimited',
    name: 'Enterprise',
    credits: 100,
    price: 150,
    pricePerCredit: 1.50,
    savings: '38%',
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? 'price_1R9B1c09K2M4O1H8e0MuOQYo',
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
    
    // CLIENT_REDIRECT değişkenini oku
    const clientRedirect = process.env.NEXT_PUBLIC_CLIENT_REDIRECT || 'https://cvtoletter.com';
    
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
        success_url: `${clientRedirect}/success?credits=${plan.credits}`,
        cancel_url: `${clientRedirect}/pricing`,
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

    // Her iki yöntemi de deneyelim ve ilk başaranı kullanalım
    try {
      if (data.url) {
        // 1. Yöntem: Direct redirect to Stripe checkout page
        window.location.assign(data.url); // location.href yerine assign kullanarak
        return true;
      } 
      
      if (data.sessionId) {
        // 2. Yöntem: Stripe.js ile redirectToCheckout
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error('Failed to initialize Stripe');
        }

        await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        return true;
      }
    } catch (redirectError) {
      console.error('Redirect error:', redirectError);
      // Yönlendirme hatası varsa, alternatif iframe yöntemini deneyelim
      if (data.url) {
        const checkoutFrame = document.createElement('iframe');
        checkoutFrame.src = data.url;
        checkoutFrame.style.width = '100%';
        checkoutFrame.style.height = '100%';
        checkoutFrame.style.position = 'fixed';
        checkoutFrame.style.top = '0';
        checkoutFrame.style.left = '0';
        checkoutFrame.style.zIndex = '9999';
        checkoutFrame.style.border = 'none';
        
        document.body.appendChild(checkoutFrame);
      return true;
    } else {
      throw new Error('No checkout URL or session ID returned');
    }
    }
    
    // Hiçbir yöntem başarılı olmadıysa hata fırlat
    throw new Error('No checkout URL or session ID returned, or all redirect methods failed');
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