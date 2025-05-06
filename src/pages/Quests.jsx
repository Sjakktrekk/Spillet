import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import useAchievementTracker from '../hooks/useAchievementTracker'
import backgroundImage from '../assets/background.jpg'
import toast from 'react-hot-toast'
import useCharacter from '../hooks/useCharacter'
import useSkills from '../hooks/useSkills'

export default function Quests() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { questId } = useParams()
  const [activeQuests, setActiveQuests] = useState([])
  const [availableQuests, setAvailableQuests] = useState([])
  const [completedQuests, setCompletedQuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('alle')
  const [currentQuest, setCurrentQuest] = useState(null)
  const achievementTracker = useAchievementTracker()
  const { character, addCoins, addExperience } = useCharacter()
  const { increaseSkillProgress } = useSkills()

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Henter oppdrag for brukeren fra databasen
  useEffect(() => {
    async function loadQuests() {
      if (!user) return

      try {
        // Hvis vi har et spesifikt quest ID, hent det oppdraget
        if (questId) {
          const { data: questData, error: questError } = await supabase
            .from('quests')
            .select('*')
            .eq('id', questId)
            .single()

          if (questError) throw questError
          setCurrentQuest(questData)
        }

        // Hent aktive oppdrag for brukeren
        const { data: activeData, error: activeError } = await supabase
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

        if (activeError) throw activeError
        
        // I en virkelig app ville vi hente oppdrag fra en quests-tabell
        // For nå bruker vi tomme lister for tilgjengelige oppdrag
        
        // Tom liste for tilgjengelige oppdrag
        const availableQuestsData = []
        
        // Tom liste for fullførte oppdrag
        const completedQuestsData = []

        // Formater aktive oppdrag
        const formattedActiveQuests = activeData?.map(item => ({
          id: item.id,
          quest: item.quests,
          progress: item.progress || 0,
          startedAt: item.started_at
        })) || [];

        // Fjernet dummy-data her
        
        setActiveQuests(formattedActiveQuests)
        setAvailableQuests(availableQuestsData)
        setCompletedQuests(completedQuestsData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading quests:', error)
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadQuests()
    }
  }, [user, authLoading, questId])

  const handleAcceptQuest = async () => {
    if (!currentQuest) return;

    try {
      // Sjekk om brukeren allerede har dette oppdraget
      const { data: existingQuest, error: checkError } = await supabase
        .from('player_quests')
        .select('id')
        .eq('user_id', user.id)
        .eq('quest_id', currentQuest.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingQuest) {
        toast.error('Du har allerede dette oppdraget');
        return;
      }

      // Legg til oppdraget i player_quests
      const { error: insertError } = await supabase
        .from('player_quests')
        .insert([{
          user_id: user.id,
          quest_id: currentQuest.id,
          status: 'active',
          progress: 0
        }]);

      if (insertError) throw insertError;

      toast.success('Oppdrag akseptert!');
      navigate('/quests'); // Gå tilbake til oppdragsoversikten
    } catch (error) {
      console.error('Error accepting quest:', error);
      toast.error('Kunne ikke akseptere oppdraget');
    }
  };

  const handleAbandonQuest = async (questId) => {
    if (!window.confirm('Er du sikker på at du vil avbryte dette oppdraget?')) return;

    try {
      const { error } = await supabase
        .from('player_quests')
        .delete()
        .eq('id', questId);

      if (error) throw error;

      setActiveQuests(prev => prev.filter(q => q.id !== questId));
      toast.success('Oppdrag avbrutt');
    } catch (error) {
      console.error('Error abandoning quest:', error);
      toast.error('Kunne ikke avbryte oppdraget');
    }
  };

  const getQuestTypeIcon = (type) => {
    switch (type) {
      case 'utforskning': return '🗺️'
      case 'jakt': return '🏹'
      case 'eskorte': return '🛡️'
      case 'forsvar': return '⚔️'
      case 'hjelpe': return '❤️'
      default: return '📜'
    }
  }

  const getQuestTypeText = (type) => {
    switch (type) {
      case 'utforskning': return 'Utforskning'
      case 'jakt': return 'Jakt'
      case 'eskorte': return 'Eskorte'
      case 'forsvar': return 'Forsvar'
      case 'hjelpe': return 'Hjelpeoppgave'
      default: return 'Oppdrag'
    }
  }

  const handleQuestComplete = async (quest) => {
    try {
      // Oppdater player_quests til completed
      const { error: updateError } = await supabase
        .from('player_quests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100
        })
        .eq('id', quest.id);

      if (updateError) {
        console.error('Error updating quest status:', updateError);
        toast.error('Kunne ikke fullføre oppdraget');
        return;
      }

      // Opprett en quest submission for admin å godkjenne
      const { error: submissionError } = await supabase
        .from('quest_submissions')
        .insert([{
          quest_id: quest.quest.id,
          user_id: user.id,
          status: 'pending',
          progress: 100
        }]);

      if (submissionError) {
        console.error('Error creating submission:', submissionError);
        toast.error('Kunne ikke sende inn oppdraget for godkjenning');
        return;
      }

      // Oppdater lokalt state
      setActiveQuests(prev => prev.filter(q => q.id !== quest.id));
      setCompletedQuests(prev => [...prev, { 
        ...quest, 
        completed_date: new Date().toISOString() 
      }]);
      
      // Vis melding om at oppdraget er sendt til godkjenning
      toast.success('Oppdrag sendt til godkjenning!');
      
      // Spor fullføring av oppdraget for achievements
      achievementTracker.completeQuest();
      
      // Spor gullet som vil bli tjent for achievements (når godkjent)
      const goldReward = quest.quest?.reward_gold || 50;
      achievementTracker.earnGold(goldReward);

      // Gi direkte fordeler til spilleren (XP og gull)
      addExperience(quest.quest?.reward_xp || 100);
      addCoins(quest.quest?.reward_gold || 50);

      // Håndtere ferdighetsbelønning hvis tilgjengelig
      if (quest.quest?.reward_skill && 
          quest.quest.reward_skill.skill_name && 
          quest.quest.reward_skill.amount) {
        
        const skillName = quest.quest.reward_skill.skill_name;
        const amount = quest.quest.reward_skill.amount;
        
        // Øk ferdighetspoeng
        const result = await increaseSkillProgress(skillName, amount);
        
        if (result && result.success) {
          if (result.leveledUp) {
            toast.success(`Du fikk +${amount} poeng i ${skillName} og gikk opp til nivå ${result.newLevel}!`);
          } else {
            toast.success(`Du fikk +${amount} poeng i ${skillName}!`);
          }
        }
      }
      
    } catch (error) {
      console.error('Error completing quest:', error);
      toast.error('Kunne ikke fullføre oppdraget');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster oppdrag...</div>
        </div>
      </div>
    )
  }

  // Vis individuelt oppdrag hvis questId er spesifisert
  if (questId && currentQuest) {
    return (
      <div 
        className="min-h-screen text-white p-6"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-4xl mx-auto bg-gray-900 bg-opacity-90 rounded-lg shadow-xl p-6">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-yellow-500">{currentQuest.title}</h1>
            <button 
              onClick={() => navigate('/quests')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
            >
              Tilbake til oppdrag
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{getQuestTypeIcon(currentQuest.quest_type)}</span>
              <div>
                <div className="text-sm text-gray-400">Type</div>
                <div className="font-medium">{getQuestTypeText(currentQuest.quest_type)}</div>
              </div>
            </div>

            <p className="text-gray-300 mb-6">{currentQuest.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Nivåkrav</div>
                <div className="text-xl font-bold text-white">{currentQuest.level}</div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Lokasjon</div>
                <div className="text-xl font-bold text-white">{currentQuest.location}</div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Belønninger</h3>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-2">🪙</span>
                  <span>{currentQuest.reward_gold} gull</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-500 mr-2">✨</span>
                  <span>{currentQuest.reward_xp} XP</span>
                </div>
                {currentQuest.reward_skill && currentQuest.reward_skill.skill_name && (
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">🔄</span>
                    <span>+{currentQuest.reward_skill.amount} {currentQuest.reward_skill.skill_name}-poeng</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAcceptQuest}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Ta oppdraget
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter oppdrag basert på type
  const filteredAvailableQuests = activeFilter === 'alle' 
    ? availableQuests 
    : availableQuests.filter(quest => quest.quest_type === activeFilter)

  return (
    <div 
      className="min-h-screen text-white p-6"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="bg-gray-900 bg-opacity-90 rounded-lg shadow-xl p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-500 mb-6 border-b border-gray-700 pb-3">Oppdrag</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Aktive oppdrag</h2>
          
          {activeQuests.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-4 text-gray-400">
              Du har ingen aktive oppdrag. Utforsk verden for å finne nye oppdrag!
            </div>
          ) : (
            <div className="space-y-4">
              {activeQuests.map(questItem => (
                <div key={questItem.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between">
                    <h3 className="text-xl font-bold text-white">{questItem.quest.title}</h3>
                    <div>
                      <button 
                        onClick={() => handleAbandonQuest(questItem.id)}
                        className="px-3 py-1 text-sm bg-red-900 hover:bg-red-800 text-white rounded"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mt-2">{questItem.quest.description}</p>
                  
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Type: </span>
                      <span className="text-white">{getQuestTypeIcon(questItem.quest.quest_type)} {getQuestTypeText(questItem.quest.quest_type)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Nivå: </span>
                      <span className="text-white">{questItem.quest.level}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Lokasjon: </span>
                      <span className="text-white">{questItem.quest.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tidsfrist: </span>
                      <span className="text-white">{questItem.quest.time_limit || 'Ingen'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">Fremgang</span>
                      <span className="text-sm text-gray-400">{questItem.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{width: `${questItem.progress}%`}}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-400">Belønning: </span>
                      <span className="text-yellow-400">{questItem.quest.reward_gold} gull</span>
                      <span className="text-gray-500 mx-1">|</span>
                      <span className="text-blue-400">{questItem.quest.reward_xp} XP</span>
                      {questItem.quest.reward_items && (
                        <>
                          <span className="text-gray-500 mx-1">|</span>
                          <span className="text-green-400">{questItem.quest.reward_items}</span>
                        </>
                      )}
                      {questItem.quest.reward_skill && questItem.quest.reward_skill.skill_name && (
                        <>
                          <span className="text-gray-500 mx-1">|</span>
                          <span className="text-green-400">+{questItem.quest.reward_skill.amount} {questItem.quest.reward_skill.skill_name}</span>
                        </>
                      )}
                    </div>
                    
                    {questItem.progress >= 100 && (
                      <button 
                        onClick={() => handleQuestComplete(questItem)}
                        className="px-4 py-1 bg-green-700 hover:bg-green-600 text-white rounded"
                      >
                        Fullfør
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-yellow-400">Tilgjengelige oppdrag</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveFilter('alle')}
                className={`px-3 py-1 rounded text-sm ${activeFilter === 'alle' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Alle
              </button>
              <button 
                onClick={() => setActiveFilter('utforskning')}
                className={`px-3 py-1 rounded text-sm ${activeFilter === 'utforskning' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                🗺️ Utforskning
              </button>
              <button 
                onClick={() => setActiveFilter('jakt')}
                className={`px-3 py-1 rounded text-sm ${activeFilter === 'jakt' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                🏹 Jakt
              </button>
              <button 
                onClick={() => setActiveFilter('eskorte')}
                className={`px-3 py-1 rounded text-sm ${activeFilter === 'eskorte' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                🛡️ Eskorte
              </button>
            </div>
          </div>
          
          {filteredAvailableQuests.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-4 text-gray-400">
              Ingen tilgjengelige oppdrag av denne typen. Prøv et annet filter eller kom tilbake senere.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvailableQuests.map(quest => (
                <div key={quest.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-colors">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-bold text-white">{quest.title}</h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-400 mr-2">Nivå {quest.level}</span>
                      <span className="text-lg">{getQuestTypeIcon(quest.quest_type)}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mt-2 text-sm">{quest.description}</p>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Lokasjon: </span>
                      <span className="text-white">{quest.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tidsfrist: </span>
                      <span className="text-white">{quest.time_limit || 'Ingen'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-400">Belønning: </span>
                      <span className="text-yellow-400 text-xs">{quest.reward_gold} gull</span>
                      <span className="text-gray-500 mx-1">|</span>
                      <span className="text-blue-400 text-xs">{quest.reward_xp} XP</span>
                    </div>
                    
                    <button 
                      onClick={() => handleAcceptQuest(quest.id)}
                      className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-500 text-white rounded"
                    >
                      Aksepter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Fullførte oppdrag</h2>
          
          {completedQuests.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-4 text-gray-400">
              Du har ikke fullført noen oppdrag ennå. Fullfør oppdrag for å se historikken her.
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 text-gray-400">Oppdrag</th>
                    <th className="text-left py-2 text-gray-400">Type</th>
                    <th className="text-left py-2 text-gray-400">Nivå</th>
                    <th className="text-left py-2 text-gray-400">Belønning</th>
                    <th className="text-left py-2 text-gray-400">Fullført</th>
                  </tr>
                </thead>
                <tbody>
                  {completedQuests.map(item => (
                    <tr key={item.id} className="border-b border-gray-700">
                      <td className="py-3 font-medium text-white">{item.quest.title}</td>
                      <td className="py-3">{getQuestTypeIcon(item.quest.quest_type)} {getQuestTypeText(item.quest.quest_type)}</td>
                      <td className="py-3">{item.quest.level}</td>
                      <td className="py-3">
                        <span className="text-yellow-400">{item.quest.reward_gold} gull</span>
                        <span className="text-gray-500 mx-1">|</span>
                        <span className="text-blue-400">{item.quest.reward_xp} XP</span>
                        {item.quest.reward_skill && item.quest.reward_skill.skill_name && (
                          <>
                            <span className="text-gray-500 mx-1">|</span>
                            <span className="text-green-400">+{item.quest.reward_skill.amount} {item.quest.reward_skill.skill_name}</span>
                          </>
                        )}
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(item.completed_date || item.quest.completed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 