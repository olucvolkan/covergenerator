'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const sessionId = searchParams?.get('session_id')

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setStatus('error')
          setMessage('No active session found. Please log in.')
          return
        }

        // Get the most recent pending checkout session for this user
        const { data: checkoutSession, error: sessionError } = await supabase
          .from('checkout_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (sessionError || !checkoutSession) {
          throw new Error('Failed to fetch checkout session')
        }

        console.log('Processing payment for session:', checkoutSession.session_id)

        // Try to process the payment manually if it's still pending
        if (checkoutSession.status === 'pending') {
          // Call our webhook endpoint manually
          const response = await fetch('/api/process-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: checkoutSession.session_id,
              user_id: session.user.id
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            const errorText = errorData?.error || await response.text()
            
            // Check if the error is due to payment not being completed yet
            if (errorText.includes('Payment not completed')) {
              setStatus('loading')
              setMessage('Your payment is being processed. Please wait a moment...')
              // Try again in 3 seconds
              setTimeout(processPayment, 3000)
              return
            }
            
            throw new Error(`Failed to process payment: ${errorText}`)
          }
        }

        // Get user's profile to check credits
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          throw new Error('Failed to fetch profile')
        }

        if (profile) {
          setStatus('success')
          setMessage(`Payment successful! ${checkoutSession.credits} credits have been added to your account. Your current balance is ${profile.credits} credits.`)
          
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }

      } catch (error) {
        console.error('Error processing payment:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'An error occurred')
      }
    }

    processPayment()
  }, [router, searchParams, sessionId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Processing Payment</h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Successful!</h2>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Error</h2>
            </>
          )}
          
          <p className="mt-2 text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  )
} 