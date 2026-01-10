'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../supabaseClient' // Path එක හරිද බලන්න

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuth = async () => {
      // 1. URL එකේ Hash එක තියෙනවද බලන්න (#access_token...)
      // Supabase එක මේක ඉබේම අරගෙන LocalStorage එකට දාගන්න ටිකක් වෙලා යනවා.
      
      // 2. කෙලින්ම Session එක ඉල්ලන්න
      const { data: { session }, error } = await supabase.auth.getSession()

      if (session) {
        // Session එක තියෙනවා නම් Dashboard යන්න
        router.push('/dashboard')
      } else {
        // Session එක තාම නැත්නම්, Listener එකක් දාලා බලන් ඉන්න
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            router.push('/dashboard')
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-2xl animate-pulse font-bold mb-2">Verifying Login...</h1>
        <p className="text-gray-400 text-sm">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}