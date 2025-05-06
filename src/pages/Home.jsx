import { useAuth } from '../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MapView from '../components/Map/MapView'
import ChatBox from '../components/Chat/ChatBox'
import { useAchievements } from '../components/Achievements/AchievementContext'
import { supabase } from '../lib/supabase'
import { updatePlayerLocation } from '../lib/travel'
import useCharacter from '../hooks/useCharacter'
import useAchievementTracker from '../hooks/useAchievementTracker.jsx'
import { getRaceById, getClassById } from '../lib/characterData'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const { character, loading: characterLoading, addCoins, addExperience, calculateExperienceForLevel, calculateTotalDefense } = useCharacter()
  const navigate = useNavigate()
  const { showAchievement } = useAchievements()
  const [showDemo, setShowDemo] = useState(false)
  const [playerLocation, setPlayerLocation] = useState(null)
  const [raceInfo, setRaceInfo] = useState(null)
  const [classInfo, setClassInfo] = useState(null)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const achievementTracker = useAchievementTracker()
  const activeTitle = achievementTracker.getActiveTitle()
  const [activeQuests, setActiveQuests] = useState([])
  const [loading, setLoading] = useState(true)

  // Sjekk brukerens autentisering
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])
  
  // Sjekk om brukeren har en karakter, omdirigér til karakteropprettelse hvis ikke
  useEffect(() => {
    if (!authLoading && !characterLoading && user && !character) {
      // Sjekk om det er en dummykarakter først
      const cachedCharacter = localStorage.getItem(`character_${user.id}`);
      if (cachedCharacter) {
        try {
          const parsedCharacter = JSON.parse(cachedCharacter);
          // Hvis dette er en ekte karakter fra databasen (ikke dummy-id), ikke omdiriger
          if (parsedCharacter && parsedCharacter.id !== 'dummy-id') {
            return;
          }
        } catch (e) {
          console.error('Feil ved parsing av cachet karakter', e);
        }
      }
      
      // Sjekk om bruker har en karakter i databasen
      async function checkForCharacter() {
        try {
          const { data, error } = await supabase
            .from('characters')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Feil ved sjekk av karakter:', error);
            // Hvis en feil oppstår, sjekk likevel om vi skal omdirigere
            if (error.code !== 'PGRST116') { // Ikke omdiriger for "ingen resultater"-feil
              navigate('/character-creation');
            }
          } else if (!data) {
            console.log('Ingen karakter funnet, omdirigerer til karakteropprettelse');
            navigate('/character-creation');
          }
        } catch (err) {
          console.error('Feil ved sjekk av karakter:', err);
        }
      }
      
      checkForCharacter();
    }
  }, [user, character, authLoading, characterLoading, navigate]);
  
  // Hent rase- og klasseinformasjon
  useEffect(() => {
    async function fetchRaceAndClass() {
      if (!character) return;
      
      try {
        const [raceData, classData] = await Promise.all([
          getRaceById(character.race_id),
          getClassById(character.class_id)
        ]);
        
        setRaceInfo(raceData);
        setClassInfo(classData);
      } catch (error) {
        console.error('Feil ved henting av rase/klasse:', error);
      }
    }
    
    if (character) {
      fetchRaceAndClass();
    }
  }, [character]);
  
  // Last spillerens nåværende plassering
  useEffect(() => {
    async function loadPlayerData() {
      if (!user) return

      try {
        // Hent spillerens lokasjon
        const { data: locationData, error: locationError } = await supabase
          .from('player_locations')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (locationError) throw locationError

        // Hent byinformasjon
        if (locationData?.city_id) {
          const { data: cityData, error: cityError } = await supabase
            .from('cities')
            .select('*')
            .eq('id', locationData.city_id)
            .single()

          if (cityError) throw cityError
          setPlayerLocation(cityData)
        }

        // Hent aktive oppdrag
        const { data: questsData, error: questsError } = await supabase
          .from('player_quests')
          .select(`
            id,
            status,
            progress,
            started_at,
            quests (
              id,
              title,
              description,
              level,
              reward_gold,
              reward_xp,
              reward_items,
              location,
              time_limit,
              quest_type
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (questsError) throw questsError

        setActiveQuests(questsData || [])
        setLoading(false)
      } catch (error) {
        console.error('Error loading player data:', error)
        setLoading(false)
      }
    }

    loadPlayerData()
  }, [user])

  // Demonstrer achievement-notifikasjon når du besøker hjemmesiden
  useEffect(() => {
    if (user && !authLoading) {
      // Sjekk om denne achievementen allerede er vist i dag
      const lastShown = localStorage.getItem('eventyrlysten_vist')
      const today = new Date().toDateString()
      
      // Vis kun hvis den ikke er vist i dag
      if (lastShown !== today) {
        // Simpler demo achievement ved første last
        const demoAchievement = {
          id: 'demo1',
          name: 'Eventyrlysten',
          description: 'Besøk hjemmesiden 1 gang',
          category: 'generelt',
          icon: '🏆',
          reward: '25 XP',
          difficulty: 'lett',
          progress: 1,
          total: 1
        }
        
        // Vis en demo-achievement etter 3 sekunder
        const timer = setTimeout(() => {
          showAchievement(demoAchievement)
          // Lagre at vi har vist den i dag
          localStorage.setItem('eventyrlysten_vist', today)
        }, 3000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [user, authLoading, showAchievement])

  // For demo-formål: viser flere achievements
  const handleShowDemoAchievements = () => {
    if (showDemo) return // Unngå gjentatte klikk
    
    setShowDemo(true)
    
    const achievements = [
      {
        id: 'demo2',
        name: 'Utforsker',
        description: 'Klikk på "Vis achievements" knappen',
        category: 'utforskning',
        icon: '🔍',
        reward: '10 XP',
        difficulty: 'lett',
        progress: 1,
        total: 1
      },
      {
        id: 'demo3',
        name: 'Mester Samleren',
        description: 'Samle 10 sjeldne gjenstander',
        category: 'inventar',
        icon: '💎',
        reward: '500 XP, Legendarisk kiste',
        difficulty: 'hard',
        progress: 10,
        total: 10
      }
    ]
    
    // Vis flere achievements med forsinkelse
    setTimeout(() => {
      showAchievement(achievements[0])
      
      setTimeout(() => {
        showAchievement(achievements[1])
      }, 2000)
    }, 1000)
  }

  // Handler for å legge til gull
  const handleAddGold = () => {
    if (character) {
      addCoins(100);
    }
  }
  
  // Handler for å legge til erfaringspoeng
  const handleAddExperience = async () => {
    if (character) {
      // Legg til erfaringspoeng
      await addExperience(100);
      // Vi trenger ikke lenger alert-boksen siden vi har level-up modal
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 text-white grid grid-cols-[250px_1fr] grid-rows-[1fr_200px]">
      {/* Venstre NAV-kolonne */}
      <div className="bg-gray-800 border-r border-gray-700 row-span-2 p-4">
        <div className="mb-6">
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            {/* Navn og tittel */}
            <div className="text-center mb-3">
              <div className="font-medium text-lg">{character?.name || user?.email?.split('@')[0]}</div>
              {activeTitle && (
                <div className="text-xs text-yellow-400 mb-1">&laquo;{activeTitle}&raquo;</div>
              )}
              <div className="text-sm text-gray-400">
                Nivå {character?.level || 1} {raceInfo?.name || 'Ukjent rase'} {classInfo?.name || 'Ukjent klasse'}
              </div>
            </div>
            
            {/* Avatar - større og sentrert */}
            <div className="flex justify-center mb-3">
              {character?.avatar_url ? (
                <div 
                  className="w-48 h-48 rounded-full flex items-center justify-center border-2 border-yellow-500 overflow-hidden cursor-pointer hover:border-yellow-400 transition-colors"
                  onClick={() => setShowAvatarModal(true)}
                  title="Klikk for å se i full størrelse"
                >
                  <img 
                    src={character.avatar_url} 
                    alt={`${character?.name || user?.email?.split('@')[0]} avatar`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-full bg-yellow-700 flex items-center justify-center text-4xl font-bold text-yellow-300 border-2 border-yellow-500">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Statistikk */}
            <div className="mt-3 text-sm">
              <div className="flex justify-between mb-1">
                <span>Erfaring</span>
                <span>{character?.experience || 0}/{calculateExperienceForLevel(character?.level || 1)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((character?.experience || 0) / (calculateExperienceForLevel(character?.level || 1))) * 100)}%` }}></div>
              </div>
              
              <div className="flex justify-between mb-1">
                <span>Helse</span>
                <span>{character?.health || 0}/{character?.max_health || 100}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((character?.health || 0) / (character?.max_health || 100)) * 100)}%` }}></div>
              </div>
              
              <div className="flex justify-between mb-1">
                <span>Energi</span>
                <span>{character?.energy || 0}/{character?.max_energy || 100}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((character?.energy || 0) / (character?.max_energy || 100)) * 100)}%` }}></div>
              </div>
              
              <div className="flex justify-between mb-1 mt-3">
                <span>Forsvar</span>
                <span>{character?.defense || calculateTotalDefense(character?.equipment) || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((character?.defense || 0) / 100) * 100)}%` }}></div>
              </div>
              <div className="text-xs text-gray-400 text-right mt-1">
                Skadereduksjon: {Math.min(50, Math.round(character?.defense || 0))}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Din plassering */}
        {playerLocation && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-yellow-500 mb-2">Din plassering</h2>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center mb-3">
                <span className="text-xl mr-2">🏙️</span>
                <div>
                  <div className="font-medium">{playerLocation.name}</div>
                  <div className="text-xs text-gray-400">{playerLocation.race}s hjemby</div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate(`/city/${playerLocation.id}`)}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors text-sm flex items-center justify-center"
              >
                <span className="mr-2">🚪</span>
                <span>Gå inn i byen</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-bold text-yellow-500 mb-2">Aktive oppdrag</h2>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            {activeQuests.length > 0 ? (
              <div className="text-sm space-y-2">
                {activeQuests.map(quest => (
                  <div key={quest.id} className="flex items-start">
                    <span className="text-yellow-500 mr-2">📜</span>
                    <div>
                      <div className="font-medium">{quest.quests.title}</div>
                      <div className="text-xs text-gray-400">{quest.quests.description}</div>
                      <div className="flex items-center mt-1">
                        <div className="w-24 bg-gray-700 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-yellow-500 h-1.5 rounded-full" 
                            style={{ width: `${quest.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">{quest.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-2">
                Ingen aktive oppdrag
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-bold text-yellow-500 mb-2">Ressurser</h2>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-yellow-500 mr-2">🪙</span>
                <span>Gull</span>
              </div>
              <span>{character?.coins || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Tallenes Tårn */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-yellow-500 mb-2">Utfordringer</h2>
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="text-2xl">🧮</div>
              <div className="flex-grow">
                <div className="font-semibold">Tallenes Tårn</div>
                <div className="text-xs text-gray-400">Test dine matematikkunnskaper i kamp mot tallmonstre!</div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/combat')}
              className="w-full py-2 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors text-sm flex items-center justify-center"
            >
              <span className="mr-2">⚔️</span>
              <span>Start utfordringen</span>
            </button>
          </div>
        </div>
        
        {/* Dev-knapper for testing */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddGold}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-md transition-colors text-sm"
            >
              +100 Gull
            </button>
            
            <button
              onClick={handleAddExperience}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
            >
              +100 XP
            </button>
          </div>
        </div>
      </div>
      
      {/* Kart-visning (hovedinnhold) */}
      <div className="relative">
        <MapView />
      </div>
      
      {/* Chat-boks under kartet */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <ChatBox />
      </div>

      {/* Modal for å vise avatar i full størrelse */}
      {showAvatarModal && character?.avatar_url && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setShowAvatarModal(false)}>
          <div className="relative max-w-4xl w-full mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-800 rounded-lg border-2 border-yellow-600 overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className="text-xl font-bold text-yellow-500">{character?.name || user?.email?.split('@')[0]} - Avatar</h3>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowAvatarModal(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <img 
                  src={character.avatar_url} 
                  alt={`${character?.name || user?.email?.split('@')[0]} avatar`} 
                  className="max-w-full max-h-[70vh] mx-auto rounded"
                />
              </div>
              <div className="p-4 border-t border-gray-700 flex justify-between">
                <div className="text-gray-300">
                  <span className="font-semibold text-yellow-500 mr-2">Rase:</span> {raceInfo?.name || 'Ukjent'}
                </div>
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                  onClick={() => setShowAvatarModal(false)}
                >
                  Lukk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 