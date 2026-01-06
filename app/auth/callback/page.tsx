'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { supabase } from '@/supabaseClient' // Note: Make sure path matches your file
import { supabase } from '../../supabaseClient'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Check if we have a session
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/')
      }
    })
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <h1 className="text-2xl animate-pulse">Authenticating... Please wait.</h1>
    </div>
  )
}