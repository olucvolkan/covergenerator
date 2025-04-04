"use client";

import { getCurrentUser } from '@/lib/auth';
import { CREDIT_PLANS, PlanId, createCheckoutSession } from '@/lib/stripe';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import LoginModal from './LoginModal';

export default function Pricing() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<PlanId | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSelectPlan = async (planId: PlanId) => {
    try {
      setIsLoading(planId);
      setError(null);

      // First check if user is already logged in
      const user = await getCurrentUser();
      
      if (!user || !user.data?.user) {
        // Only show login modal if user is not logged in
        setShowLoginModal(true);
        return;
      }
      
      // User is already logged in, proceed directly with checkout
      await createCheckoutSession(planId);
      
    } catch (err: any) {
      console.error('Error selecting plan:', err);
      setError(err.message || 'Failed to create checkout session');
    } finally {
      setIsLoading(null);
    }
  };

  const handleLoginModalClose = () => {
    setShowLoginModal(false);
  };

  const handleLoginSuccess = async () => {
    try {
      // Verify user is actually logged in
      const { data, error } = await getCurrentUser();
      
      if (error || !data?.user) {
        console.error('Login was not successful', error);
        return;
      }
      
      // Close the login modal since we're now logged in
      setShowLoginModal(false);
      
      // User has successfully logged in, proceed with the selected plan
      if (isLoading) {
        try {
          console.log('Creating checkout session for plan:', isLoading);
          await createCheckoutSession(isLoading);
        } catch (err: any) {
          console.error('Error creating checkout after login:', err);
          setError(err.message || 'Failed to create checkout session');
        }
      } else {
        console.error('No plan selected');
        setError('No plan was selected. Please select a plan.');
      }
    } catch (err: any) {
      console.error('Error in login success handler:', err);
      setError(err.message || 'An error occurred after login');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600">
            Get instant access to AI-powered cover letter generation with our flexible pricing options.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {Object.values(CREDIT_PLANS).map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-lg shadow-lg overflow-hidden border transform transition-transform duration-300 hover:scale-105 ${
                plan.popular ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-transparent'
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                
                <div className="flex items-baseline mt-4 mb-6">
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${plan.price}</span>
                  <span className="ml-1 text-xl text-gray-500">/one-time</span>
                </div>
                
                <p className="text-gray-600 mb-6">
                  <span className="font-bold text-gray-900">{plan.credits}</span> cover letter credits
                </p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">${plan.pricePerCredit} per letter</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">{plan.savings} savings</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">Unlimited revisions</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-600">AI optimization</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => handleSelectPlan(plan.id as PlanId)}
                  disabled={isLoading !== null}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium transition-all duration-300 ${
                    isLoading === plan.id 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                        : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {isLoading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Get Started`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Plans Include</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">AI-Powered Generation</h3>
                <p className="text-gray-600">Tailored cover letters using advanced AI</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">Resume Analysis</h3>
                <p className="text-gray-600">Intelligent extraction of your skills and experience</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">Job Description Matching</h3>
                <p className="text-gray-600">Alignment with job requirements</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">Match Analysis</h3>
                <p className="text-gray-600">Detailed analysis of your fit for the role with pros and cons</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">PDF Downloads</h3>
                <p className="text-gray-600">Export your cover letters as PDF files</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Storage</h3>
                <p className="text-gray-600">Save your cover letters in your account</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">How do credits work?</h3>
              <p className="text-gray-600">
                Each credit allows you to generate one AI-powered cover letter. After purchasing a credit package, the credits will be immediately available in your account.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-2">How long do credits last?</h3>
              <p className="text-gray-600">
                Your credits never expire. Use them whenever you need them for your job applications.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Can I get a refund?</h3>
              <p className="text-gray-600">
                Due to the digital nature of our services, we cannot offer refunds once credits have been purchased. However, if you encounter any issues, please contact our support team.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-2">How do I pay?</h3>
              <p className="text-gray-600">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={handleLoginModalClose} 
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
} 
