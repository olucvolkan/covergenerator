"use client";

import { createCheckoutSession, Plan, PLANS } from '@/lib/stripe';
import React, { useState } from 'react';

interface PlanSelectorProps {
  onSelectFreePlan: () => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ onSelectFreePlan }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    setError(null);
    
    if (plan === 'free') {
      onSelectFreePlan();
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createCheckoutSession(plan);
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'There was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">Choose Your Plan</h1>
      <p className="text-gray-600 text-center mb-8">
        Select a plan to start generating cover letters tailored to your resume
      </p>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(PLANS).map(([planId, plan]) => (
          <div 
            key={planId}
            className={`p-6 rounded-lg border-2 ${
              planId === 'premium' 
                ? 'border-primary shadow-lg bg-white' 
                : 'border-gray-200 bg-white'
            }`}
          >
            {planId === 'premium' && (
              <div className="bg-primary text-white py-1 px-3 rounded-full text-sm font-medium w-fit mb-4">
                Recommended
              </div>
            )}
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            
            <div className="mb-6">
              <span className="text-3xl font-bold">€{plan.price}</span>
              {plan.price > 0 && <span className="text-gray-500 ml-1">/month</span>}
            </div>
            
            <ul className="mb-8 space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleSelectPlan(planId as Plan)}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                planId === 'premium'
                  ? 'bg-primary text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading && planId === 'premium' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : planId === 'free' ? (
                'Select Free Plan'
              ) : (
                'Start Premium Subscription'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanSelector; 