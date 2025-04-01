"use client";

import { CREDIT_PLANS, createCheckoutSession } from '@/lib/stripe';
import React, { useState } from 'react';

interface PlanSelectorProps {
  onSelectFreePlan: () => void;
  user: any;
  setShowLoginModal: (show: boolean) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ onSelectFreePlan, user, setShowLoginModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setError(null);
    setSelectedPlan(planId);
    
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }
  };

  const handleProceedToCheckout = async () => {
    if (!selectedPlan || selectedPlan === 'free' || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Find the selected plan
      const plan = Object.values(CREDIT_PLANS).find(p => p.id === selectedPlan);
      
      if (!plan) {
        throw new Error('Selected plan not found');
      }
      
      console.log("Attempting to create checkout session for plan:", plan.id);
      console.log("With price ID:", plan.stripe_price_id);
      
      // Call createCheckoutSession with the plan ID
      await createCheckoutSession(plan.id as any, plan.stripe_price_id);
      
      // If we get here, checkout process has started 
      // The redirect should have happened in createCheckoutSession
      // This is a fallback message
      setError("Checkout initiated. If you're not redirected automatically, please try again.");
      
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'There was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">Select a Credit Package</h1>
      <p className="text-gray-600 text-center mb-8">
        Purchase credits to generate high-quality, personalized cover letters for your job applications
      </p>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.values(CREDIT_PLANS).map((plan) => (
          <div 
            key={plan.id}
            className={`relative rounded-xl border-2 transition-all duration-200 ${
              selectedPlan === plan.id 
                ? 'border-primary shadow-lg scale-105 bg-white z-10' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-max px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                Most Popular
              </div>
            )}
            
            <div className="p-6">
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-500 ml-1">one-time</span>
              </div>
              
              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Credits</span>
                  <span className="font-semibold">{plan.credits}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Price Per Credit</span>
                  <span className="font-semibold">${plan.pricePerCredit.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Savings</span>
                  <span className="font-semibold text-green-600">{plan.savings}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Cover Letters</span>
                  <span className="font-semibold">{plan.credits}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-3 px-4 rounded-lg font-medium ${
                  selectedPlan === plan.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {selectedPlan && selectedPlan !== 'free' && (
        <div className="mt-10 flex flex-col items-center">
          <div className="mb-6 p-4 max-w-lg bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-blue-800 font-medium mb-1">About your selected package</p>
                <p className="text-sm text-blue-700">
                  Credits never expire and can be used anytime. Each credit generates one personalized cover letter 
                  tailored to your resume and job description.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleProceedToCheckout}
            disabled={isLoading}
            className={`py-3 px-8 text-lg font-medium rounded-lg 
              ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700'} 
              text-white transition-colors
            `}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              `Proceed to Checkout - $${Object.values(CREDIT_PLANS).find(p => p.id === selectedPlan)?.price}`
            )}
          </button>
          
          <p className="mt-3 text-sm text-gray-500">Secure payment processing by Stripe</p>
        </div>
      )}
      
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">How Credits Work</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Purchase Credits</h3>
            <p className="text-gray-600 text-sm">Choose a credit package that fits your job application needs</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Create Cover Letters</h3>
            <p className="text-gray-600 text-sm">Each credit generates one personalized cover letter</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Never Expires</h3>
            <p className="text-gray-600 text-sm">Use your credits anytime - they never expire</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelector;