import PropTypes from 'prop-types'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import useCharacter from '../../hooks/useCharacter'
import useSkills from '../../hooks/useSkills'
import { useAuth } from '../../hooks/useAuth'

const CombatResults = ({ results, character, damageTaken, onContinue }) => {
  const { updateCharacter } = useCharacter()
  const { increaseSkillProgress } = useSkills()
  const { user } = useAuth()
  const [processingRewards, setProcessingRewards] = useState(true)
  const [rewards, setRewards] = useState({
    xp: 0,
    gold: 0,
    skill: 0,
    energyLost: 0
  })
  const [animateRewards, setAnimateRewards] = useState(false)
  
  useEffect(() => {
    // Forhindre gjentatte prosesseringer
    let isMounted = true;
    // Registrer at vi har prosessert resultater for å unngå gjentatte oppdateringer
    const hasProcessed = useRef(false);
    
    const processResults = async () => {
      // Avbryt hvis komponenten er unmounted eller vi allerede har prosessert resultater
      if (!results || !character || !isMounted || hasProcessed.current) return;
      
      // Marker at vi har startet prosessering
      hasProcessed.current = true;
      
      // Oppdater belønninger bare én gang
      if (isMounted) {
        setRewards({
          xp: results.rewards.xp,
          gold: results.rewards.gold || 0,
          skill: results.rewards.skillProgress || 0,
          energyLost: results.result === 'retreat' ? Math.floor(character.max_energy * 0.5) : 0
        });
      }
      
      try {
        // Oppdater kampferdighet (bare ved seier eller nederlag)
        if (results.result !== 'retreat' && results.rewards.skillProgress > 0) {
          await increaseSkillProgress('Kamp', results.rewards.skillProgress);
        }
        
        // Oppdater achievement statistics for beseirede monstre (bare ved seier)
        if (results.result === 'victory' && user) {
          try {
            const { error } = await supabase.rpc('increment_user_stat', {
              user_id_param: user.id,
              stat_key: 'monsters_killed',
              increment_amount: 1
            });
            
            if (error) {
              console.error('Error updating achievements:', error);
            }
          } catch (err) {
            console.error('Failed to call increment_user_stat:', err);
          }
        }
        
        // Vent litt før vi viser animasjonen
        if (isMounted) {
          // Bruk en enkelt timeout som ikke gjør flere state-oppdateringer hvis komponenten unmountes
          const timer = setTimeout(() => {
            if (isMounted) {
              setAnimateRewards(true);
              setProcessingRewards(false);
            }
          }, 500);
          
          // Legg til en cleanup funksjon for denne timeouten
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error('Error processing combat rewards:', err);
        if (isMounted) {
          setProcessingRewards(false);
        }
      }
    };
    
    // Kjør prosessering bare én gang
    processResults();
    
    // Cleanup funksjon for å forhindre oppdateringer etter umounting
    return () => {
      isMounted = false;
    };
  }, [results, character, user, increaseSkillProgress]);
  
  if (!results) return null
  
  // Funksjon for å få monster-emoji basert på nivå
  const getMonsterEmoji = () => {
    const monsters = ['👾', '👹', '👺', '👻', '💀', '👽', '🤖', '🐲', '🐉', '👿']
    return monsters[(results.monster?.level || 1) - 1] || '👹'
  }
  
  // Funksjon for å få tekst basert på kamputfall
  const getResultText = () => {
    if (results.result === 'victory') {
      return 'Seier! Du beseirer monsteret!'
    } else if (results.result === 'defeat') {
      return 'Nederlag. Monsteret beseiret deg.'
    } else if (results.result === 'retreat') {
      return 'Retrett. Du trakk deg fra kampen.'
    }
  }
  
  // Funksjon for å få tekstfarge basert på kamputfall
  const getResultColor = () => {
    if (results.result === 'victory') return 'text-green-400';
    if (results.result === 'defeat') return 'text-red-400';
    return 'text-yellow-400'; // retrett
  }
  
  // Funksjon for å bestemme fargekode basert på skadeprosent
  const getDamageColor = () => {
    const damagePercent = (damageTaken / character.max_health) * 100;
    if (damagePercent < 20) return 'text-green-400'; // Mindre enn 20% skade
    if (damagePercent < 50) return 'text-yellow-400'; // Mellom 20% og 50% skade
    return 'text-red-400'; // Over 50% skade
  }
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-medieval mb-2 ${getResultColor()}`}>
          {getResultText()}
        </h2>
        <p className="text-gray-300">
          {results.result === 'victory' 
            ? 'Gratulerer! Du har beseiret monsteret og fått belønninger.' 
            : results.result === 'defeat'
              ? 'Du ble beseiret denne gangen, men du lærte noe av erfaringen.'
              : 'Du bestemte deg for å trekke deg fra kampen. Dette kostet deg energi og helse.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Battle Summary */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-medieval text-yellow-400 mb-4">Kampsammendrag</h3>
          
          <div className="flex items-center mb-6">
            <div className="text-5xl mr-4">
              {getMonsterEmoji()}
            </div>
            <div>
              <div className="text-white font-semibold">
                {results.monster?.name || `Nivå ${results.monster?.level || 1} Monster`}
              </div>
              <div className="text-gray-400 text-sm">
                Nivå {results.monster?.level || 1}
              </div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Kamputfall:</span>
              <span className={`font-semibold ${getResultColor()}`}>
                {results.result === 'victory' ? 'Seier' : 
                 results.result === 'defeat' ? 'Nederlag' : 'Retrett'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Monster nivå:</span>
              <span className="text-yellow-400">{results.monster?.level || 1}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Skade tatt:</span>
              <span className={getDamageColor()}>
                {damageTaken} ({Math.round((damageTaken / character.max_health) * 100)}%)
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-300">Gjenværende helse:</span>
              <span className={`${
                results.stats.playerHealthRemaining > 50 ? 'text-green-400' :
                results.stats.playerHealthRemaining > 20 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {results.stats.playerHealthRemaining}/{character?.max_health || 100}
              </span>
            </div>
            
            {results.result === 'retreat' && (
              <div className="flex justify-between">
                <span className="text-gray-300">Energi tapt:</span>
                <span className="text-yellow-400">
                  {rewards.energyLost} ({Math.round((rewards.energyLost / character.max_energy * 100))}%)
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 border border-gray-600 rounded-lg bg-gray-800">
            <h4 className="text-yellow-400 text-sm font-semibold mb-2">Helseoppdatering</h4>
            <div className="flex items-center">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-red-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.max(0, 100 - (damageTaken / character.max_health * 100))}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-red-400">-{damageTaken} HP</span>
              <span className="text-gray-300">{Math.max(0, character.health - damageTaken)}/{character.max_health} gjenstående</span>
            </div>
          </div>
          
          {results.result === 'retreat' && (
            <div className="mt-4 p-3 border border-gray-600 rounded-lg bg-gray-800">
              <h4 className="text-yellow-400 text-sm font-semibold mb-2">Energioppdatering</h4>
              <div className="flex items-center">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.max(0, 100 - (rewards.energyLost / character.max_energy * 100))}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-yellow-400">-{rewards.energyLost} Energi</span>
                <span className="text-gray-300">{Math.max(0, character.energy - rewards.energyLost)}/{character.max_energy} gjenstående</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Rewards */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-medieval text-yellow-400 mb-4">Belønninger</h3>
          
          {processingRewards ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <div className="text-yellow-500">Beregner belønninger...</div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`flex items-center ${animateRewards ? 'animate-bounce-once' : ''}`}>
                <div className="text-4xl mr-4">⭐</div>
                <div className="flex-grow">
                  <div className="text-white mb-1">Erfaringspoeng</div>
                  <div className="bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${rewards.xp ? '100%' : '0%'}` }}
                    ></div>
                  </div>
                </div>
                <div className="text-2xl font-medieval text-blue-400">+{rewards.xp}</div>
              </div>
              
              {rewards.gold > 0 && (
                <div className={`flex items-center ${animateRewards ? 'animate-bounce-once delay-150' : ''}`}>
                  <div className="text-4xl mr-4">💰</div>
                  <div className="flex-grow">
                    <div className="text-white mb-1">Gull</div>
                    <div className="bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-2xl font-medieval text-yellow-400">+{rewards.gold}</div>
                </div>
              )}
              
              {rewards.skill > 0 ? (
                <div className={`flex items-center ${animateRewards ? 'animate-bounce-once delay-300' : ''}`}>
                  <div className="text-4xl mr-4">⚔️</div>
                  <div className="flex-grow">
                    <div className="text-white mb-1">Kampferdighet</div>
                    <div className="bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-2xl font-medieval text-red-400">+{rewards.skill}</div>
                </div>
              ) : results.result === 'retreat' && (
                <div className="bg-gray-800 rounded-lg p-3 mt-4">
                  <div className="flex items-center text-gray-500">
                    <div className="text-2xl mr-3">⚔️</div>
                    <div>
                      <div className="font-medium">Ingen kampferdighetspoeng</div>
                      <div className="text-xs">Ved retrett får du ikke fremgang i kampferdigheten</div>
                    </div>
                  </div>
                </div>
              )}
              
              {results.result === 'retreat' && (
                <div className="bg-gray-800 rounded-lg p-3 mt-4">
                  <div className="flex items-center text-red-400">
                    <div className="text-2xl mr-3">⚠️</div>
                    <div>
                      <div className="font-medium">Kostnader for retrett</div>
                      <div className="text-xs text-gray-300">Du har mistet {rewards.energyLost} energi og {damageTaken} helse</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-8 text-center">
            <button
              onClick={onContinue}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medieval"
            >
              Fortsett
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

CombatResults.propTypes = {
  results: PropTypes.object,
  character: PropTypes.object,
  damageTaken: PropTypes.number,
  onContinue: PropTypes.func.isRequired
}

export default CombatResults 