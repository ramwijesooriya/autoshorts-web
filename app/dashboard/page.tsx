'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// import { supabase } from '@/supabaseClient'
import { supabase } from '../supabaseClient'

// Define the shape of our video data
type Video = {
  id: string
  video_url: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [videos, setVideos] = useState<Video[]>([])

  // 1. Check if user is logged in & Fetch data
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/') // Kick out if not logged in
        return
      }
      setUser(session.user)
      fetchVideos(session.user.id)
    }
    getUser()
  }, [router])

  // 2. Fetch existing videos from Supabase
  const fetchVideos = async (userId: string) => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) setVideos(data)
    if (error) console.error('Error fetching videos:', error)
  }

  // 3. Handle new video submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl) return alert("Please enter a Google Drive link!")
    
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('videos')
        .insert([
          { 
            user_id: user.id, 
            video_url: videoUrl,
            status: 'pending' // Default status
          }
        ])

      if (error) throw error
      
      setVideoUrl('') // Clear input
      alert('Video added to queue! 🚀')
      fetchVideos(user.id) // Refresh list
      
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return <div className="bg-black min-h-screen text-white p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
          AutoShorts Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden md:block">{user.email}</span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid gap-12 md:grid-cols-2">
        
        {/* LEFT SIDE: Input Form */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">🚀 New Request</h2>
          <p className="text-gray-400 text-sm mb-6">
            Upload your raw video to Google Drive, change access to "Anyone with the link", and paste it here.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Google Drive Link</label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full p-4 bg-black border border-gray-700 rounded-lg focus:border-red-500 focus:outline-none transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition transform active:scale-95"
            >
              {loading ? 'Adding to Queue...' : 'Auto Edit & Upload'}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: History List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">📜 History</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {videos.length === 0 ? (
              <p className="text-gray-500 italic">No videos yet.</p>
            ) : (
              videos.map((video) => (
                <div key={video.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg flex justify-between items-center">
                  <div className="overflow-hidden">
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm truncate text-gray-300 w-48">
                      {video.video_url}
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    video.status === 'completed' ? 'bg-green-900 text-green-300' :
                    video.status === 'processing' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {video.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}