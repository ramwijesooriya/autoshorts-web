'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient' 

export default function AuthCallback() {
  const [status, setStatus] = useState('Checking credentials...')

  useEffect(() => {
    const handleAuth = async () => {
      // 1. URL Hash එක චෙක් කිරීම
      const hash = window.location.hash
      
      // Hash එකෙන් Manual Session හදන්න උත්සාහ කිරීම
      if (hash && hash.includes('access_token')) {
        setStatus('Setting up session...')
        try {
          const params = new URLSearchParams(hash.substring(1))
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
              // ✅ Session එක හරිගිය ගමන් Database එක Update කරන්න
              await saveUserToDatabase(data.session)
              
              setStatus('Success! Redirecting...')
              window.location.href = '/dashboard'
              return
            }
          }
        } catch (e) {
          console.error("Manual parsing failed", e)
        }
      }

      // 2. දැනටමත් Session එකක් තියෙනවද බලන්න
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // ✅ Session තිබුණොත් Database එක Update කරන්න
        await saveUserToDatabase(session)
        window.location.href = '/dashboard'
      } else {
        // Listener එකක් දාන්න
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            // ✅ අලුත් Session එකක් ආවම Database එක Update කරන්න
            await saveUserToDatabase(session)
            window.location.href = '/dashboard'
          }
        })
        return () => subscription.unsubscribe()
      }
    }

    handleAuth()
  }, [])

  // 🔥 Database එකට User Save කරන විශේෂ Function එක
  const saveUserToDatabase = async (session: any) => {
    if (!session || !session.user) return

    setStatus('Saving user data...')
    
    // Supabase එකෙන් Google Refresh Token එක ගන්න
    const { provider_refresh_token } = session
    
    // Refresh token එකක් තියෙනවා නම් විතරක් Database එක update කරන්න
    if (provider_refresh_token) {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          refresh_token: provider_refresh_token, // මේක තමයි Backend එකට ඕන යතුර!
        })

      if (error) {
        console.error('Error saving user to DB:', error)
      } else {
        console.log('User saved successfully!')
      }
    }
  }

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