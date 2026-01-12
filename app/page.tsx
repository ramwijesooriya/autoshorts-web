'use client'
import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Home() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    
    const siteUrl = 'https://asankawijesooriya.site' 
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        // YouTube Upload සහ Drive Read අවසර ඉල්ලනවා
        scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/drive.readonly',
        // 🔥 වැදගත්ම කොටස: මේකෙන් තමයි දිගටම තියෙන Refresh Token එක ලැබෙන්නේ
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) alert(error.message)
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-xl text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          AutoShorts
        </h1>
        
        <p className="text-xl text-gray-400">
          Upload a video to Drive. We edit and post it to YouTube automatically.
          <br />
          <span className="text-sm text-gray-500">(Running on Hybrid Cloud Engine)</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300 my-8">
          <div className="p-4 border border-gray-800 rounded-lg">🤖 AI Editing</div>
          <div className="p-4 border border-gray-800 rounded-lg">📂 Drive Sync</div>
          <div className="p-4 border border-gray-800 rounded-lg">🚀 Auto Upload</div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all transform hover:scale-105"
        >
          {loading ? 'Connecting...' : 'Start with Google 🚀'}
        </button>

        <p className="text-xs text-gray-600 mt-4">
          By clicking Start, you agree to our Terms of Service.
        </p>
      </div>
    </main>
  )
}