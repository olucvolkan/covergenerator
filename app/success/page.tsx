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
    const checkSession = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setStatus('error')
          setMessage('No active session found. Please log in.')
          return
        }

        // Get credits from URL params
        const credits = searchParams.get('credits')
        if (!credits) {
          setStatus('error')
          setMessage('No credits information found')
          return
        }

        // Add credits to user's account
        const response = await fetch('/api/add-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ credits: parseInt(credits, 10) })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add credits')
        }

        const data = await response.json()
        setStatus('success')
        setMessage(`Payment successful! ${credits} credits have been added to your account.`)

        // Redirect to home page after 3 seconds
        setTimeout(() => {
          router.push('/')
        }, 3000)

      } catch (error) {
        console.error('Error verifying session:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'An error occurred')
      }
    }

    checkSession()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        {status === 'loading' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Processing your payment...
            </h2>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Payment Successful!
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting you to the homepage...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600">{message}</p>
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