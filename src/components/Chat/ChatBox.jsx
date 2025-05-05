import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import useAchievementTracker from '../../hooks/useAchievementTracker'

export default function ChatBox({ className }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [channel, setChannel] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const achievementTracker = useAchievementTracker()
  
  // Demo meldinger som alltid brukes hvis vi ikke kan hente fra databasen
  const getDemoMessages = () => [
    { 
      id: 1, 
      content: 'Velkommen til Spillet!', 
      user_id: 'system', 
      created_at: new Date(Date.now() - 180000).toISOString(),
      type: 'system',
      profiles: { username: 'System', avatar_url: null }
    },
    { 
      id: 2, 
      content: 'Dette er et chatsystem. Du kan chatte med andre spillere her.', 
      user_id: 'system', 
      created_at: new Date(Date.now() - 120000).toISOString(),
      type: 'system',
      profiles: { username: 'System', avatar_url: null }
    },
    { 
      id: 3, 
      content: 'Hei, velkommen til spillverdenen!', 
      user_id: 'guide', 
      created_at: new Date(Date.now() - 60000).toISOString(),
      type: 'npc',
      profiles: { username: 'Spillguide', avatar_url: null }
    }
  ]
  
  // Hent historiske meldinger ved første last
  useEffect(() => {
    async function fetchMessages() {
      try {
        // For demo, bruker vi bare dummy-meldinger
        // Vi kommenterer ut supabase-koden for å unngå feil
        
        /*
        const { data, error } = await supabase
          .from('messages')
          .select('*, profiles(username, avatar_url)')
          .order('created_at', { ascending: true })
          .limit(50)
        
        if (error) throw error
        
        if (!data || data.length === 0) {
          setMessages(getDemoMessages())
        } else {
          setMessages(data)
        }
        */
        
        // For demo formål, bruker vi alltid demodata
        setMessages(getDemoMessages())
        setLoading(false)
      } catch (error) {
        console.error('Feil ved henting av meldinger:', error)
        // Hvis det er feil, bruk demo-meldinger
        setMessages(getDemoMessages())
        setLoading(false)
      }
    }
    
    fetchMessages()
  }, [])
  
  // Sett opp sanntids abonnement på nye meldinger
  useEffect(() => {
    // For demo, setter vi opp en simulert kanal
    const simulatedChannel = {
      unsubscribe: () => console.log('Unsubscribed from chat channel')
    }
    
    setChannel(simulatedChannel)
    
    return () => {
      if (simulatedChannel) simulatedChannel.unsubscribe()
    }
  }, [])
  
  // Rull ned til bunn når meldinger endres
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !user) return
    
    try {
      const messageToAdd = {
        id: Date.now(),
        content: newMessage,
        user_id: user.id,
        created_at: new Date().toISOString(),
        type: 'user',
        profiles: { 
          username: user.email?.split('@')[0] || 'Spiller', 
          avatar_url: null 
        }
      }
      
      // Simulerer sending av melding
      setMessages(prev => [...prev, messageToAdd])
      
      // Sporer chat-meldingen for achievements
      achievementTracker.sendMessage()
      
      // Simulerer et svar fra NPC
      setTimeout(() => {
        const responses = [
          'Interessant! Fortell meg mer.',
          'Har du besøkt de nye byene på kartet ennå?',
          'Lykke til på reisen din!',
          'Husk å sjekke oppdragstavlen for nye oppdrag.',
          'Har du funnet noen sjeldne gjenstander i det siste?'
        ]
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        
        const npcResponse = {
          id: Date.now() + 1,
          content: randomResponse,
          user_id: 'guide',
          created_at: new Date().toISOString(),
          type: 'npc',
          profiles: { username: 'Spillguide', avatar_url: null }
        }
        
        setMessages(prev => [...prev, npcResponse])
      }, 1000)
      
      setNewMessage('')
    } catch (error) {
      console.error('Feil ved sending av melding:', error)
    }
  }
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  const getMessageClasses = (message) => {
    if (message.type === 'system') {
      return 'bg-gray-800 text-yellow-400 border-yellow-800'
    } else if (message.type === 'npc') {
      return 'bg-blue-900 text-blue-200 border-blue-800'
    } else if (message.user_id === user?.id) {
      return 'bg-green-900 text-green-200 border-green-800 ml-auto'
    } else {
      return 'bg-gray-700 text-gray-200 border-gray-600'
    }
  }
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-yellow-500">Chat</h2>
        {/* Send til fanen basert på aktiv chat-kanal */}
        <div className="flex space-x-1">
          <button className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">Global</button>
          <button className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">By</button>
          <button className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600">Gruppe</button>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto mb-2 bg-gray-900 rounded p-3 space-y-2 h-[200px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {loading ? (
          <div className="text-center text-gray-400 py-4">Laster meldinger...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-4">Ingen meldinger ennå</div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`p-2 rounded-lg border max-w-[80%] ${getMessageClasses(message)}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">
                  {message.profiles?.username || 'Ukjent spiller'}
                </span>
                <span className="text-xs opacity-70">{formatTime(message.created_at)}</span>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="flex">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv en melding..." 
          className="flex-grow bg-gray-800 border border-gray-700 rounded-l p-2 text-sm focus:outline-none focus:border-yellow-500"
          disabled={!user}
        />
        <button 
          type="submit"
          disabled={!user || !newMessage.trim()}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 rounded-r border border-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
} 