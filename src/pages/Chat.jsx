import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import ChatBox from '../components/Chat/ChatBox'

export default function Chat() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [activeChannel, setActiveChannel] = useState('global')
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Kobler til chat...</div>
        </div>
      </div>
    )
  }
  
  const channels = [
    { id: 'global', name: 'Global', description: 'Chat med alle spillere i verdenen', color: 'blue' },
    { id: 'handel', name: 'Handel', description: 'Kjøp og selg gjenstander med andre spillere', color: 'green' },
    { id: 'hjelp', name: 'Hjelp', description: 'Få hjelp med spillet fra andre spillere', color: 'yellow' },
    { id: 'grupper', name: 'Gruppe-søk', description: 'Finn andre spillere å spille med', color: 'purple' }
  ]
  
  const getChannelColor = (color) => {
    switch (color) {
      case 'blue': return 'bg-blue-900 border-blue-700 text-blue-200'
      case 'green': return 'bg-green-900 border-green-700 text-green-200'
      case 'yellow': return 'bg-yellow-900 border-yellow-700 text-yellow-200'
      case 'purple': return 'bg-purple-900 border-purple-700 text-purple-200'
      default: return 'bg-gray-800 border-gray-700 text-gray-200'
    }
  }
  
  // For demo formål, vi simulerer antall påloggede spillere
  const onlineUsers = 42
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Side panel med kanaler og påloggede brukere */}
          <div className="lg:w-64 space-y-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">Chat-kanaler</h2>
              <div className="space-y-2">
                {channels.map(channel => (
                  <button
                    key={channel.id}
                    className={`w-full text-left p-2 rounded border ${
                      activeChannel === channel.id 
                        ? `${getChannelColor(channel.color)} font-medium`
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setActiveChannel(channel.id)}
                  >
                    <div className="font-medium">{channel.name}</div>
                    {activeChannel === channel.id && (
                      <div className="text-xs mt-1 opacity-80">{channel.description}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg">
              <h2 className="text-lg font-bold text-yellow-500 mb-3">Pålogget nå</h2>
              <div className="flex items-center justify-between mb-3 text-sm">
                <span className="text-gray-300">Spillere online:</span>
                <span className="bg-green-900 text-green-200 px-2 py-0.5 rounded-full text-xs">
                  {onlineUsers}
                </span>
              </div>
              
              <div className="space-y-2">
                {/* Dette ville vanligvis være en liste over faktiske påloggede brukere */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-300">DragonSlayer92</span>
                  </div>
                  <span className="text-xs text-gray-400">Nivå 15</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-300">MagicMaster</span>
                  </div>
                  <span className="text-xs text-gray-400">Nivå 8</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-300">ShadowHunter</span>
                  </div>
                  <span className="text-xs text-gray-400">Nivå 12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-gray-300">ElfArcher443</span>
                  </div>
                  <span className="text-xs text-gray-400">Nivå 6</span>
                </div>
                
                <div className="pt-2 text-center">
                  <button className="text-xs text-gray-400 hover:text-gray-300">
                    Vis alle spillere...
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Hovedchat-området */}
          <div className="flex-grow">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg h-[calc(100vh-100px)]">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-bold text-yellow-500">
                  {channels.find(c => c.id === activeChannel)?.name || 'Chat'}
                </h2>
                <span className="text-sm text-gray-400 ml-3">
                  {channels.find(c => c.id === activeChannel)?.description}
                </span>
              </div>
              
              <ChatBox className="h-[calc(100%-3rem)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 