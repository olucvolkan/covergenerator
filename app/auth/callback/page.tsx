'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/auth';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session) {
        router.push('/');
      } else {
        console.error('No session:', error);
      }
    };

    getSession();
  }, []);

  return <p>Logging in...</p>;
}