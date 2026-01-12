'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// ඔයාගේ ෆයිල් එකේ හැටියට මේ path එක හරියන්න ඕනේ
import { supabase } from '../supabaseClient'

// වීඩියෝ එකක හැඩය (Type) අර්ථ දැක්වීම
interface Video {
  id: string
  video_url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [videos, setVideos] = useState<Video[]>([]) // වීඩියෝ ලිස්ට් එක
  const [userEmail, setUserEmail] = useState('')

  // 1. මුලින්ම ලෝඩ් වෙද්දී User ව සහ වීඩියෝ ලිස්ට් එක ගන්න
  useEffect(() => {
    const getUserAndVideos = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setUserEmail(session.user.email || '')
      fetchVideos(session.user.id)
      
      // 🔥 Realtime Magic: Database එකේ වෙනස්කම් බලාගෙන ඉන්නවා
      const channel = supabase
        .channel('realtime_videos')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'videos',
          filter: `user_id=eq.${session.user.id}` 
        }, (payload) => {
          // වෙනසක් වුනාම ලිස්ට් එක ඉබේම අප්ඩේට් වෙනවා!
          fetchVideos(session.user.id)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
    getUserAndVideos()
  }, [router])

  // වීඩියෝ ලිස්ට් එක Database එකෙන් ඉල්ලගැනීම
  const fetchVideos = async (userId: string) => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) // අලුත් ඒවා උඩින්
    
    if (data) setVideos(data as Video[])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSubmit = async () => {
    if (!url) return
    setLoading(true)
    setMessage('Adding to queue...')

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // 2. Insert into Supabase
      const { error } = await supabase
        .from('videos')
        .insert({
           user_id: user.id,
           video_url: url,
           status: 'pending' // මුලින්ම Pending
        })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Video added to queue 🚀')
        setUrl('') // Input box එක හිස් කරනවා
        fetchVideos(user.id) // ලිස්ට් එක refresh කරනවා
      }
    }
    setLoading(false)
  }

  // Status එක අනුව පාට තෝරන Function එක
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse' // ගැහෙන Effect එක
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50'
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          AutoShorts Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{userEmail}</span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm border border-gray-700 rounded-lg hover:bg-gray-900 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Upload Section */}
        <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-800 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🚀 New Request
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Upload your raw video to Google Drive, change access to "Anyone with the link", and paste it here.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Google Drive Link</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-4 rounded-lg font-bold transition-all transform hover:scale-[1.01] ${
                loading 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {loading ? 'Adding to Queue...' : 'Auto Edit & Upload'}
            </button>
            
            {message && (
              <p className={`text-center text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* History Section */}
        <div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            🗂️ History
          </h2>
          
          <div className="grid gap-4">
            {videos.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800 border-dashed">
                No videos yet. Start by adding one above!
              </div>
            ) : (
              videos.map((video) => (
                <div 
                  key={video.id} 
                  className="group flex items-center justify-between p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    {/* Icon based on status */}
                    <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-xl">
                      {video.status === 'completed' ? '✅' : video.status === 'failed' ? '❌' : '🎬'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-300 truncate max-w-xs md:max-w-md">{video.video_url}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(video.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge with Dynamic Color */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(video.status)}`}>
                    {video.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  )
}