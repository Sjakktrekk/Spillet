import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import achievementsBackground from '../assets/achievements.jpg'
import useAchievementTracker from '../hooks/useAchievementTracker'

export default function Achievements() {
  const { user } = useAuth()
  const { trackedStats } = useAchievementTracker()
  const [activeCategory, setActiveCategory] = useState('alle')
  const [achievements, setAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Kategorier for filtrering
  const categories = [
    { id: 'alle', name: 'Alle' },
    { id: 'generelt', name: 'Generelt' },
    { id: 'utforskning', name: 'Utforskning' },
    { id: 'oppdrag', name: 'Oppdrag' },
    { id: 'sosialt', name: 'Sosialt' },
    { id: 'kamp', name: 'Kamp' },
    { id: 'inventar', name: 'Inventar' },
    { id: 'handel', name: 'Handel' }
  ]
  
  const fetchAchievements = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Hent alle achievement-definisjoner
      const { data: allAchievements, error: definitionsError } = await supabase
        .from('achievements')
        .select('*')
        .order('id')
      
      if (definitionsError) {
        console.error('Feil ved henting av achievements:', definitionsError)
        return
      }
      
      // Hent brukerens achievements
      const { data: userCompletedAchievements, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
      
      if (userAchievementsError) {
        console.error('Feil ved henting av brukerens achievements:', userAchievementsError)
        return
      }
      
      // Kombiner dataene for å lage fullstendig achievement-liste
      const combinedAchievements = allAchievements.map(achievement => {
        const userAchievement = userCompletedAchievements?.find(ua => 
          ua.achievement_id === achievement.id
        ) || null
        
        return {
          ...achievement,
          completed: !!userAchievement?.completed,
          progress: userAchievement?.progress || 0,
          date_completed: userAchievement?.date_completed || null
        }
      })
      
      setAchievements(combinedAchievements)
      setUserAchievements(combinedAchievements.filter(a => a.completed))
    } catch (error) {
      console.error('Feil ved lasting av achievements:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Last achievements ved første render
  useEffect(() => {
    fetchAchievements()
  }, [user])
  
  // Oppdater achievements når trackedStats endres
  useEffect(() => {
    if (user) {
      fetchAchievements()
    }
  }, [trackedStats])
  
  // Hjelpefunksjoner for UI
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'lett': return 'bg-green-700'
      case 'medium': return 'bg-yellow-700'
      case 'hard': return 'bg-red-700'
      default: return 'bg-gray-700'
    }
  }
  
  // Filtrer achievements basert på valgt kategori
  const filteredAchievements = activeCategory === 'alle'
    ? achievements
    : achievements.filter(a => a.category === activeCategory)
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Laster achievements...</div>
      </div>
    )
  }
  
  return (
    <div 
      className="text-white min-h-screen p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${achievementsBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-6xl mx-auto pt-16">
        {/* Header med statistikk */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Achievements</h1>
          <div className="flex justify-center items-center gap-8 bg-gray-800 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Fullført</div>
              <div className="text-2xl font-bold">{userAchievements.length}/{achievements.length}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Total poengsum</div>
              <div className="text-2xl font-bold">
                {userAchievements.reduce((total, a) => {
                  // Mock poeng basert på vanskelighetsgrad
                  const points = a.difficulty === 'lett' ? 10 : a.difficulty === 'medium' ? 25 : 50
                  return total + points
                }, 0)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Kategorifilter */}
        <div className="relative overflow-x-auto mb-8">
          <div className="flex items-center justify-between">
            <button 
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 focus:outline-none"
              onClick={() => {
                const container = document.getElementById('categories-container')
                container.scrollLeft -= 200
              }}
            >
              &larr;
            </button>
            
            <div 
              id="categories-container"
              className="flex overflow-x-auto space-x-2 py-2 px-4 scrollbar-hide no-scrollbar"
              style={{ scrollBehavior: 'smooth' }}
            >
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${
                    activeCategory === category.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <button 
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 focus:outline-none"
              onClick={() => {
                const container = document.getElementById('categories-container')
                container.scrollLeft += 200
              }}
            >
              &rarr;
            </button>
          </div>
        </div>
        
        {/* Achievement grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.length > 0 ? (
            filteredAchievements.map(achievement => (
              <div
                key={achievement.id}
                className={`bg-gray-800 rounded-lg border ${achievement.completed ? 'border-yellow-600' : 'border-gray-700'} p-4 hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${achievement.completed ? 'bg-yellow-700' : 'bg-gray-700'} mr-3`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold ${achievement.completed ? 'text-yellow-400' : 'text-white'}`}>
                      {achievement.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(achievement.difficulty)}`}>
                      {achievement.difficulty && achievement.difficulty.charAt(0).toUpperCase() + achievement.difficulty.slice(1) || 'Ukjent'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 my-1">{achievement.description}</p>
                
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Fremgang: {achievement.progress || 0}/{achievement.total || 1}</span>
                    <span>{Math.round(((achievement.progress || 0) / (achievement.total || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${achievement.completed ? 'bg-yellow-500' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(100, Math.round(((achievement.progress || 0) / (achievement.total || 1)) * 100))}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Reward */}
                <div className="mt-2 text-xs text-gray-400">
                  <span className="block">Belønning: </span>
                  {achievement.reward || 'Ingen belønning'}
                </div>
                
                {/* Completion date */}
                {achievement.completed && (
                  <div className="mt-2 text-xs text-green-400">
                    Oppnådd: {new Date(achievement.date_completed).toLocaleDateString('no-NO')}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-400">
              Ingen achievements funnet i denne kategorien.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 