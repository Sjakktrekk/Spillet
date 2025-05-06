import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useNavigate } from 'react-router-dom'
import useAchievementTracker from '../hooks/useAchievementTracker'
import useCharacter from '../hooks/useCharacter'
import useSkills, { SKILL_DATA, SKILL_RANKS } from '../hooks/useSkills'
import { getRaceById, getClassById } from '../lib/characterData'
import characterBackground from '../assets/character.jpg'
import { supabase } from '../lib/supabase'

export default function Character() {
  const { user, loading: authLoading } = useAuth()
  const { character, loading: characterLoading, useSkillPoint, calculateExperienceForLevel, calculateTotalDefense } = useCharacter()
  const { 
    skills, 
    loading: skillsLoading, 
    getSkill, 
    skillData, 
    getRequiredProgressForLevel, 
    getSkillRank, 
    getSkillRankDescription 
  } = useSkills()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('oversikt')
  const [activeTitle, setActiveTitle] = useState(null)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [characterBio, setCharacterBio] = useState(
    'En lovende eventyrer som nettopp har startet sin reise i denne verdenen. Kun tiden vil vise hvilken skjebne som venter.'
  )
  const [bioInputValue, setBioInputValue] = useState(characterBio)
  const [raceInfo, setRaceInfo] = useState(null)
  const [classInfo, setClassInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAttributeModal, setShowAttributeModal] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState(null)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  
  // Bruk achievement tracker for å hente titler
  const achievementTracker = useAchievementTracker()
  const [titles, setTitles] = useState([])
  
  const [activeQuests, setActiveQuests] = useState([])
  
  // Hent rase- og klasse-informasjon når karakteren er lastet
  useEffect(() => {
    if (character) {
      const raceInfo = getRaceById(character.race_id)
      const classInfo = getClassById(character.class_id)
      setRaceInfo(raceInfo)
      setClassInfo(classInfo)
    }
  }, [character])

  useEffect(() => {
    async function loadCharacterData() {
      if (!user) return

      try {
        // Hent karakterdata
        const { data, error: characterError } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (characterError) throw characterError

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
        console.error('Error loading character data:', error)
        setLoading(false)
      }
    }

    loadCharacterData()
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
    
    // Fjerner omdirigering til character-creation
    // if (!authLoading && !characterLoading && user && !character) {
    //   navigate('/character-creation')
    //   return;
    // }
    
    // For demo, simuler låse opp noen titler
    setTimeout(() => {
      achievementTracker.unlockTitle('Reisende')
      achievementTracker.unlockTitle('Den Sosiale')
    }, 1000)
    
    // Lytter til endringer i låste titler
    const interval = setInterval(() => {
      const unlockedTitles = achievementTracker.getUnlockedTitles()
      if (unlockedTitles && unlockedTitles.length > 0) {
        setTitles(unlockedTitles)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [user, authLoading, navigate, achievementTracker])

  // Fjerner Modal for attributtpoeng tildeling siden attributter ikke lenger brukes
  const handleAttributePointAssignment = async () => {
    if (!selectedAttribute) return;
    
    try {
      // Denne funksjonen skal ikke lenger brukes
      console.warn('Attributter er ikke lenger i bruk');
      setShowAttributeModal(false);
      setSelectedAttribute(null);
    } catch (error) {
      console.error('Feil ved tildeling av attributtpoeng:', error);
    }
  };

  // Fjern utstyrsfanen fra fanemenyen
  const tabs = [
    { id: 'oversikt', label: 'Oversikt' },
    { id: 'ferdigheter', label: 'Ferdigheter' },
    { id: 'titler', label: 'Titler' }
  ]

  if (authLoading || characterLoading || loading || skillsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster karakter...</div>
        </div>
      </div>
    )
  }
  
  // Sammensatt karakter data fra character-objektet og annen info
  const characterData = character ? {
    name: character.name || user?.email?.split('@')[0] || 'Eventyrer',
    level: character.level || 1,
    experience: character.experience || 0,
    experienceToNextLevel: calculateExperienceForLevel(character.level),
    class: classInfo?.name || 'Eventyrer',
    race: raceInfo?.name || 'Menneske',
    avatar_url: character.avatar_url || null,
    activeTitle: achievementTracker.getActiveTitle() || 'Eventyrsøkeren',
    titles: titles,
    raceInfo: {
      description: raceInfo?.description || 'Ingen informasjon tilgjengelig.',
      homeland: raceInfo?.name === 'Menneske' ? 'Nordhavn' : 
               raceInfo?.name === 'Alv' ? 'Eldoria' :
               raceInfo?.name === 'Dverg' ? 'Tanak-dun' :
               raceInfo?.name === 'Ork' ? 'Skyggeborg' : 'Ukjent'
    },
    health: character.health || 100,
    maxHealth: character.max_health || 100,
    energy: character.energy || 75,
    maxEnergy: character.max_energy || 100,
    gold: character.coins || 50,
    playTime: '2 timer',
    activeQuests: activeQuests.length,
    defense: character.defense || calculateTotalDefense(character.equipment) || 0,
    equipment: character.equipment || {
      head: null,
      chest: null,
      pants: null,
      boots: null,
      belt: null,
      gloves: null,
      bracers: null,
      shoulder: null,
      mainHand: null,
      offHand: null,
      ring: null,
      amulet: null,
      misc: null,
      pet: null
    }
  } : null;
  
  if (!characterData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Ingen karakter funnet</p>
          <button 
            onClick={() => navigate('/character-creation')}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white"
          >
            Opprett karakter
          </button>
        </div>
      </div>
    );
  }

  // Hjelpefunksjon for kvalitetsfarger
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'common': return 'text-gray-300'
      case 'uncommon': return 'text-green-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-gray-300'
    }
  }

  return (
    <div 
      className="min-h-screen text-white p-6 bg-cover bg-center bg-fixed" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${characterBackground})`,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Karaktertopp med navn og nivå */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex flex-col md:flex-row items-center mb-4 md:mb-0">
            {characterData.avatar_url ? (
              <div 
                className="w-40 h-40 rounded-full border-4 border-yellow-600 flex items-center justify-center mr-6 overflow-hidden cursor-pointer hover:border-yellow-400 transition-colors"
                onClick={() => setShowAvatarModal(true)}
                title="Klikk for å se i full størrelse"
              >
                <img 
                  src={characterData.avatar_url} 
                  alt={`${characterData.name} avatar`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-40 h-40 bg-yellow-700 rounded-full border-4 border-yellow-600 flex items-center justify-center text-5xl font-bold text-yellow-300 mr-6">
                {characterData.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-yellow-500">{characterData.name}</h1>
              
              {/* Horisontal layout med ikoner og separatorer */}
              <div className="flex flex-wrap gap-2 mt-3">
                {/* Nivå og rase/klasse med ikon */}
                <div className="flex items-center bg-gray-700 bg-opacity-50 rounded-md px-2 py-1">
                  <span className="text-yellow-500 mr-1.5">👑</span>
                  <span className="text-gray-300">Nivå {characterData.level} {characterData.race} {characterData.class}</span>
                </div>
                
                {/* Tittel med ikon */}
                {characterData.activeTitle && (
                  <div className="flex items-center bg-yellow-900 bg-opacity-40 rounded-md px-2 py-1">
                    <span className="text-yellow-500 mr-1.5">🏆</span>
                    <span className="text-yellow-400">&laquo;{characterData.activeTitle}&raquo;</span>
                  </div>
                )}
                
                {/* Aktive oppdrag med ikon */}
                <div className="flex items-center bg-gray-700 bg-opacity-50 rounded-md px-2 py-1">
                  <span className="text-yellow-500 mr-1.5">📜</span>
                  <span className="text-gray-300">Aktive oppdrag: {characterData.activeQuests}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
            <div className="flex justify-between mb-1">
              <span>Erfaring</span>
              <span>{characterData.experience}/{characterData.experienceToNextLevel}</span>
            </div>
            <div className="w-64 bg-gray-700 rounded-full h-2 mb-1">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(characterData.experience / characterData.experienceToNextLevel) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 text-right">
              {characterData.experienceToNextLevel - characterData.experience} XP til neste nivå
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id 
                  ? 'border-yellow-500 text-yellow-500' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-400'
              } flex items-center px-4 py-2 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Innhold basert på aktiv fane */}
        {activeTab === 'oversikt' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">Grunnstatistikk</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Helse</span>
                    <span>{characterData.health}/{characterData.maxHealth}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(characterData.health / characterData.maxHealth) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Energi</span>
                    <span>{characterData.energy}/{characterData.maxEnergy}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(characterData.energy / characterData.maxEnergy) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Forsvar</span>
                    <span>{characterData.defense} ({Math.min(50, Math.round(characterData.defense))}% skadereduksjon)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (characterData.defense / 100) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-yellow-400">Om karakteren</h3>
                  {isEditingBio ? (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setCharacterBio(bioInputValue);
                          setIsEditingBio(false);
                          // Her ville vi lagret til databasen i en ekte app
                        }}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                      >
                        Lagre
                      </button>
                      <button 
                        onClick={() => {
                          setBioInputValue(characterBio);
                          setIsEditingBio(false);
                        }}
                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsEditingBio(true)}
                      className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded"
                    >
                      Rediger
                    </button>
                  )}
                </div>
                
                {isEditingBio ? (
                  <textarea
                    value={bioInputValue}
                    onChange={(e) => setBioInputValue(e.target.value)}
                    className="w-full bg-gray-700 text-gray-300 rounded p-2 border border-gray-600 focus:border-yellow-500 focus:outline-none"
                    rows={4}
                    maxLength={200}
                    placeholder="Skriv litt om karakteren din..."
                  />
                ) : (
                  <p className="text-gray-300">
                    {characterBio}
                  </p>
                )}
                
                {isEditingBio && (
                  <div className="text-xs text-gray-400 text-right mt-1">
                    {bioInputValue.length}/200 tegn
                  </div>
                )}
              </div>
              
              {/* Forenklet raseinformasjon */}
              <div className="mt-6 border-t border-gray-700 pt-4">
                <h3 className="font-semibold text-yellow-400 mb-2">Rase: {characterData.race}</h3>
                <p className="text-gray-300 mb-2">
                  {characterData.raceInfo.description}
                </p>
                <div className="mt-3">
                  <span className="text-xs text-gray-400">Hjemland:</span>
                  <p className="text-gray-300">{characterData.raceInfo.homeland}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">Aktive oppdrag</h2>
              
              <div className="space-y-4">
                {activeQuests.length > 0 ? (
                  activeQuests.map(quest => (
                    <div key={quest.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-md bg-gray-600 flex items-center justify-center mr-3 text-xl">
                          <span>📜</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-yellow-400">{quest.quests.title}</h3>
                          <p className="text-sm text-gray-300">{quest.quests.description}</p>
                          <div className="flex items-center mt-2">
                            <div className="w-32 bg-gray-600 rounded-full h-2 mr-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${quest.progress}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-400">{quest.progress}% fullført</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center">
                    <p className="text-gray-300">Ingen aktive oppdrag</p>
                    <button 
                      onClick={() => navigate('/map')}
                      className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                    >
                      Finn nye oppdrag
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold text-yellow-400 mb-2">Nylige prestasjoner</h3>
                <div className="space-y-2">
                  <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-md bg-gray-600 flex items-center justify-center mr-3 text-xl">
                        <span>🏆</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-400">Reisende</h4>
                        <p className="text-xs text-gray-400">Oppnådd: {new Date().toLocaleDateString('no-NO')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-md bg-gray-600 flex items-center justify-center mr-3 text-xl">
                        <span>⚔️</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-yellow-400">Krigeren</h4>
                        <p className="text-xs text-gray-400">Oppnådd: {new Date().toLocaleDateString('no-NO')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ferdigheter' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-yellow-500">Ferdigheter</h2>
              <div className="text-sm text-gray-400">Ferdigheter økes når du bruker dem aktivt i spillet (Maks nivå: 30)</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map(skill => {
                const skillInfo = skillData[skill.skill_name];
                if (!skillInfo) return null;
                
                // Hent ranginfo for dette nivået
                const rankInfo = getSkillRank(skill.level);
                const rankDescription = getSkillRankDescription(skill.skill_name, skill.level);
                
                // Beregn nødvendig fremgang for neste nivå
                const requiredProgress = getRequiredProgressForLevel(skill.level);
                
                return (
                  <div key={skill.id} className="bg-gray-700 p-3 rounded-lg border border-gray-600 relative group">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3 text-lg">
                        {skillInfo.icon}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{skill.skill_name}</span>
                          <span className="text-sm text-gray-300">Lvl {skill.level} <span className={`text-${rankInfo.color} font-semibold`}>({rankInfo.rank})</span></span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                          <div 
                            className={`h-full bg-${skillInfo.color} rounded-full`}
                            style={{ width: `${(skill.progress / requiredProgress) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span></span>
                          <span>{skill.progress}/{requiredProgress}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tooltip med detaljert informasjon */}
                    <div className="absolute z-10 invisible group-hover:visible bg-gray-900 border border-gray-600 rounded-lg p-4 shadow-xl w-72 left-0 mt-2 text-sm">
                      <h3 className="font-bold text-lg text-white mb-2">{skill.skill_name} <span className={`text-${rankInfo.color}`}>({rankInfo.rank})</span></h3>
                      <p className="text-gray-300 mb-3">{skillInfo.description}</p>
                      
                      {rankDescription && (
                        <div className="mb-3">
                          <span className={`text-${rankInfo.color} font-semibold`}>Nåværende status:</span> 
                          <p className="text-gray-300">{rankDescription}</p>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <span className="font-semibold text-gray-200">Primæreffekt:</span>
                        <p className="text-gray-300">{skillInfo.primaryEffect}</p>
                      </div>
                      
                      {skillInfo.secondaryEffects && skillInfo.secondaryEffects.length > 0 && (
                        <div className="mb-3">
                          <span className="font-semibold text-gray-200">Sekundæreffekter:</span>
                          <ul className="list-disc pl-5 text-gray-300">
                            {skillInfo.secondaryEffects.map((effect, idx) => (
                              <li key={idx}>{effect}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-semibold text-gray-200">Øker ved:</span>
                        <p className="text-gray-300">{skillInfo.levelsUpBy}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {activeTab === 'titler' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-yellow-500">Titler</h2>
              <div className="text-sm text-gray-400">Lås opp titler ved å oppnå prestasjoner i spillet</div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Velg en tittel for å vise den ved siden av karakternavnet ditt. Titler viser dine prestasjoner og bedrifter i spillverdenen.
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              {titles.length > 0 ? (
                titles.map(title => (
                  <div 
                    key={title.name} 
                    className={`bg-gray-700 p-4 rounded-lg border ${
                      characterData.activeTitle === title.name 
                        ? 'border-yellow-500' 
                        : 'border-gray-600'
                    } cursor-pointer hover:bg-gray-600 transition-colors`}
                    onClick={() => {
                      // Bruk achievementTracker for å sette aktiv tittel
                      achievementTracker.setActiveTitle(title.name);
                      characterData.activeTitle = title.name;
                      setActiveTitle(title.name);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`font-bold text-lg ${
                          title.rarity === 'common' ? 'text-gray-200' : 
                          title.rarity === 'uncommon' ? 'text-green-400' : 
                          title.rarity === 'rare' ? 'text-blue-400' : 
                          title.rarity === 'epic' ? 'text-purple-400' : 
                          'text-yellow-400'
                        }`}>
                          {title.name}
                        </h3>
                        <div className="text-sm text-gray-400 mt-1">{title.source}</div>
                      </div>
                      
                      {characterData.activeTitle === title.name && (
                        <div className="bg-yellow-600 text-white text-xs uppercase tracking-wider px-2 py-1 rounded-full">
                          Aktiv
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-300 mt-2">{title.description}</p>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        Låst opp: {new Date(title.unlocked_at).toLocaleDateString('no-NO')}
                      </div>
                      
                      <button 
                        className={`px-4 py-1 rounded-md text-sm font-medium ${
                          characterData.activeTitle === title.name
                            ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        }`}
                        disabled={characterData.activeTitle === title.name}
                        onClick={(e) => {
                          e.stopPropagation(); // Forhindre at container-klikk også kjører
                          if (characterData.activeTitle !== title.name) {
                            achievementTracker.setActiveTitle(title.name);
                            characterData.activeTitle = title.name;
                            setActiveTitle(title.name);
                          }
                        }}
                      >
                        {characterData.activeTitle === title.name ? 'Aktiv tittel' : 'Velg tittel'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 text-center">
                  <div className="text-4xl mb-3">👑</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Ingen titler låst opp ennå</h3>
                  <p className="text-gray-400">
                    Fullfør prestasjoner og oppdag nye steder for å få tilgang til unike titler som viser dine bedrifter!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for å vise avatar i full størrelse */}
        {showAvatarModal && characterData.avatar_url && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setShowAvatarModal(false)}>
            <div className="relative max-w-4xl w-full mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 rounded-lg border-2 border-yellow-600 overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                  <h3 className="text-xl font-bold text-yellow-500">{characterData.name} - Avatar</h3>
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
                    src={characterData.avatar_url} 
                    alt={`${characterData.name} avatar`} 
                    className="max-w-full max-h-[70vh] mx-auto rounded"
                  />
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-between">
                  <div className="text-gray-300">
                    <span className="font-semibold text-yellow-500 mr-2">Rase:</span> {characterData.race}
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
    </div>
  )
} 