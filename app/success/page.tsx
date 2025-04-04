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

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setStatus('error')
          setMessage('No active session found. Please log in.')
          return
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
          setMessage(`Payment successful! Your current credit balance is ${profile.credits}.`)
          
          // Redirect to home page after 3 seconds
          setTimeout(() => {
            router.push('/')
          }, 3000)
        }

      } catch (error) {
        console.error('Error checking payment status:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'An error occurred')
      }
    }

    checkPaymentStatus()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-teal-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verifying your payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your credit purchase</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to homepage in 3 seconds...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Return to Homepage
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 