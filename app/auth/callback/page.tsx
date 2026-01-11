'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient' 

export default function AuthCallback() {
  const [status, setStatus] = useState('Checking credentials...')

  useEffect(() => {
    const handleAuth = async () => {
      // 1. URL එකේ තියෙන Hash එක ගන්න
      const hash = window.location.hash
      
      // Hash එකක් තියෙනවා නම් ඒක අරගෙන Session එක හදන්න ට්‍රයි කරනවා
      if (hash && hash.includes('access_token')) {
        setStatus('Setting up session...')
        try {
          const params = new URLSearchParams(hash.substring(1)) // '#' අයින් කරනවා
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')

          if (access_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token || '',
            })

            if (error) {
              console.error('Error setting session:', error)
              setStatus('Login failed. Please try again.')
            } else if (data.session) {
              setStatus('Success! Redirecting...')
              // 🔥 වැදගත්ම වෙනස: router.push වෙනුවට මේක පාවිච්චි කරන්න
              // මේකෙන් Page එක සම්පූර්ණයෙන්ම Reload වෙලා Dashboard එකට යනව
              window.location.href = '/dashboard'
              return
            }
          }
        } catch (e) {
          console.error("Manual parsing failed", e)
        }
      }

      // 2. Hash එකෙන් වැඩේ වුනේ නැත්නම්, සාමාන්‍ය විදියට Session එක බලන්න
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/dashboard'
      } else {
        // තවමත් Session නැත්නම් Listener එකක් දාන්න
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            window.location.href = '/dashboard'
          }
        })
        return () => subscription.unsubscribe()
      }
    }

    handleAuth()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center p-6 bg-gray-900 rounded-xl border border-gray-800">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500 mb-4"></div>
        <h1 className="text-xl font-bold mb-2">Verifying Login...</h1>
        <p className="text-gray-400 text-sm">{status}</p>
      </div>
    </div>
  )
}