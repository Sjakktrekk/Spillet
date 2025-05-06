import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import MathProblemGenerator from './MathProblemGenerator'
import { calculateDamageReduction } from '../../utils/skillHelpers'

const BattleArena = ({ character, monster, combatSkillLevel, onCombatEnd, onCancel, onPlayerDamage }) => {
  // Monsterets helse basert på nivå
  const baseMonsterHealth = 50 + (monster?.level * 20)
  const basePlayerDamage = 10 + Math.floor(combatSkillLevel * 1.5)
  
  // Beregn total defense fra utstyr
  const calculateTotalDefense = () => {
    if (!character || !character.equipment) return 0;
    
    let totalDefense = 0;
    
    // Gjennomgå alle utstyrte gjenstander
    Object.values(character.equipment).forEach(item => {
      if (item && item.defense) {
        totalDefense += item.defense;
      }
    });
    
    return totalDefense;
  };
  
  const playerDefense = calculateTotalDefense();
  
  const [monsterHealth, setMonsterHealth] = useState(baseMonsterHealth)
  const [playerHealth, setPlayerHealth] = useState(character?.health || 100)
  const [currentProblem, setCurrentProblem] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [startTime, setStartTime] = useState(null)
  const [gameStatus, setGameStatus] = useState('playing') // playing, victory, defeat, retreat
  const [battleLog, setBattleLog] = useState([])
  const [animateMonster, setAnimateMonster] = useState(false)
  const [animatePlayer, setAnimatePlayer] = useState(false)
  const [showRetreatConfirm, setShowRetreatConfirm] = useState(false)
  const [totalPlayerDamage, setTotalPlayerDamage] = useState(0)
  const [totalDamageBlocked, setTotalDamageBlocked] = useState(0)
  
  const answerInputRef = useRef(null)
  const battleLogRef = useRef(null)
  
  // Generate a new math problem
  const generateNewProblem = () => {
    // Juster vanskelighetsgraden basert på monsternivå
    const maxFactor = Math.min(10, 4 + monster?.level)
    const newProblem = MathProblemGenerator.generateMultiplicationProblem(maxFactor)
    setCurrentProblem(newProblem)
    setUserAnswer('')
    setFeedback(null)
    setStartTime(Date.now())
    
    // Sett tidsbegrensning basert på monsternivå (7 sekunder for nivå 1, 5 sekunder for nivå 10)
    const timeLimit = Math.max(3, Math.floor(8 - (monster?.level * 0.3)))
    setTimeRemaining(timeLimit)
    
    // Fokuser på inputfeltet
    setTimeout(() => {
      if (answerInputRef.current) {
        answerInputRef.current.focus()
      }
    }, 100)
  }
  
  // Start battle with first problem
  useEffect(() => {
    if (monster) {
      generateNewProblem()
      addToBattleLog('info', `Kampen mot ${monster.name || 'monsteret'} har begynt!`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monster])
  
  // Timer for time remaining
  useEffect(() => {
    if (timeRemaining === null || gameStatus !== 'playing') return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          handleTimeOut()
          return 0
        }
        return prev - 0.1
      })
    }, 100)
    
    return () => clearInterval(timer)
  }, [timeRemaining, gameStatus])
  
  // Scroll battle log to bottom when new messages are added
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight
    }
  }, [battleLog])
  
  // Handle timeout (player didn't answer in time)
  const handleTimeOut = () => {
    if (currentProblem) {
      addToBattleLog('error', `Tiden er ute! Riktig svar var ${currentProblem.answer}.`)
      setFeedback({
        correct: false,
        message: `Tiden er ute! Riktig svar var ${currentProblem.answer}.`
      })
      
      // Monster hits player
      const damage = 5 + Math.floor(monster.level * 1.5)
      playerTakeDamage(damage)
      
      // Setup next round after short delay
      setTimeout(() => {
        if (gameStatus === 'playing') {
          generateNewProblem()
        }
      }, 1500)
    }
  }
  
  // Handle player submitting an answer
  const handleSubmitAnswer = (e) => {
    e.preventDefault()
    
    if (gameStatus !== 'playing' || !currentProblem) return
    
    const numAnswer = parseInt(userAnswer, 10)
    const isCorrect = numAnswer === currentProblem.answer
    const timeTaken = (Date.now() - startTime) / 1000
    
    if (isCorrect) {
      // Beregn skadepoeng basert på responstid og kampferdighetsnivå
      // Raskere svar = mer skade
      const timeBonus = Math.max(0, 1 - (timeTaken / timeRemaining))
      const damageMultiplier = 1 + (timeBonus * 0.5) + (combatSkillLevel * 0.08)
      const damage = Math.floor(basePlayerDamage * damageMultiplier)
      
      // Vis feedback
      setFeedback({
        correct: true,
        message: `Riktig! Du gjorde ${damage} skade.${timeBonus > 0.3 ? ' Rask respons!' : ''}`,
        damage: damage
      })
      
      addToBattleLog('success', `Du svarte riktig på ${currentProblem.factor1} × ${currentProblem.factor2} = ${currentProblem.answer} og gjorde ${damage} skade!`)
      
      // Bruk animasjon for monsteret som tar skade
      setAnimateMonster(true)
      setTimeout(() => setAnimateMonster(false), 500)
      
      // Oppdater monsterets helse
      const newMonsterHealth = monsterHealth - damage
      setMonsterHealth(Math.max(0, newMonsterHealth))
      
      // Sjekk om monsteret er beseiret
      if (newMonsterHealth <= 0) {
        handleVictory()
        return
      }
    } else {
      // Feil svar
      setFeedback({
        correct: false,
        message: `Feil! Riktig svar er ${currentProblem.answer}.`
      })
      
      addToBattleLog('error', `Du svarte feil på ${currentProblem.factor1} × ${currentProblem.factor2}. Riktig svar er ${currentProblem.answer}.`)
      
      // Monster angriper spilleren
      const damage = 5 + Math.floor(monster.level * 1.5)
      playerTakeDamage(damage)
    }
    
    // Setup next round after short delay
    setTimeout(() => {
      if (gameStatus === 'playing') {
        generateNewProblem()
      }
    }, 1500)
  }
  
  // Håndterer at spilleren tar skade
  const playerTakeDamage = (damage) => {
    // Bruk forsvarsverdien for å redusere skaden
    const damageResult = calculateDamageReduction(damage, playerDefense);
    
    // Log skaden og forsvarsbonusen
    if (damageResult.damageBlocked > 0) {
      addToBattleLog('info', `Forsvaret ditt blokkerte ${damageResult.damageBlocked} skade (${damageResult.defensePercentage}% reduksjon)`);
    }
    
    addToBattleLog('warning', `${monster.name || 'Monsteret'} angriper og gjør ${damageResult.reducedDamage} skade!`);
    
    // Animer spilleren som tar skade
    setAnimatePlayer(true);
    setTimeout(() => setAnimatePlayer(false), 500);
    
    // Oppdater spillerens helse i kampmodusen
    const newPlayerHealth = playerHealth - damageResult.reducedDamage;
    setPlayerHealth(Math.max(0, newPlayerHealth));
    
    // Meld fra om skaden til parent-komponenten for å påvirke karakterens helse permanent
    if (onPlayerDamage) {
      onPlayerDamage(damageResult.reducedDamage);
    }
    
    // Hold styr på total skade tatt og blokkert
    setTotalPlayerDamage(prev => prev + damageResult.reducedDamage);
    setTotalDamageBlocked(prev => prev + damageResult.damageBlocked);
    
    // Sjekk om spilleren er beseiret
    if (newPlayerHealth <= 0) {
      handleDefeat();
    }
  };
  
  // Legg til en ny melding i kamploggen
  const addToBattleLog = (type, message) => {
    setBattleLog(prev => [...prev, { type, message, timestamp: new Date() }])
  }
  
  // Håndterer seier
  const handleVictory = () => {
    setGameStatus('victory')
    addToBattleLog('success', `Du har beseiret ${monster.name || 'monsteret'}!`)
    
    // Beregn belønninger basert på monsternivå
    const xpReward = 10 * monster.level * monster.level
    const goldReward = 5 * monster.level + Math.floor(Math.random() * (10 * monster.level))
    
    // Send resultater til parent-komponenten
    onCombatEnd({
      result: 'victory',
      monster: monster,
      rewards: {
        xp: xpReward,
        gold: goldReward,
        skillProgress: monster.level // Fremgang i Kamp-ferdigheten
      },
      stats: {
        playerHealthRemaining: playerHealth,
        monsterLevel: monster.level,
        totalDamageTaken: character.health - playerHealth
      }
    })
  }
  
  // Håndterer nederlag
  const handleDefeat = () => {
    setGameStatus('defeat')
    addToBattleLog('error', `Du har blitt beseiret av ${monster.name || 'monsteret'}!`)
    
    // Send resultater til parent-komponenten
    onCombatEnd({
      result: 'defeat',
      monster: monster,
      rewards: {
        xp: Math.floor(5 * monster.level), // Litt XP selv ved tap
        gold: 0,
        skillProgress: Math.ceil(monster.level / 2) // Noe fremgang i Kamp-ferdigheten
      },
      stats: {
        playerHealthRemaining: 0,
        monsterLevel: monster.level,
        totalDamageTaken: character.health
      }
    })
  }
  
  // Håndterer retrett
  const handleRetreatConfirm = () => {
    setGameStatus('retreat')
    addToBattleLog('warning', `Du trekker deg fra kampen mot ${monster.name || 'monsteret'}!`)
    
    // Send resultater til parent-komponenten
    onCombatEnd({
      result: 'retreat',
      monster: monster,
      rewards: {
        xp: Math.floor(2 * monster.level), // Svært lite XP ved retrett
        gold: 0,
        skillProgress: 0, // Ingen fremgang i Kamp-ferdigheten ved retrett
        energyPenalty: 50 // 50% av total energi går tapt
      },
      stats: {
        playerHealthRemaining: playerHealth,
        monsterLevel: monster.level,
        totalDamageTaken: totalPlayerDamage
      }
    })
  }
  
  // Viser retrett-bekreftelse
  const showRetreatConfirmation = () => {
    setShowRetreatConfirm(true);
  }
  
  // Skjuler retrett-bekreftelse
  const hideRetreatConfirmation = () => {
    setShowRetreatConfirm(false);
  }
  
  // Funksjon for å gi fargekode basert på helseprosent
  const getHealthColor = (current, max) => {
    const percentage = (current / max) * 100
    if (percentage > 60) return 'bg-green-500'
    if (percentage > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }
  
  // Funksjon for å få monster-emoji basert på nivå
  const getMonsterEmoji = () => {
    const monsters = ['👾', '👹', '👺', '👻', '💀', '👽', '🤖', '🐲', '🐉', '👿']
    return monsters[(monster?.level || 1) - 1] || '👹'
  }
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg relative">
      {/* Retrett bekreftelsesdialog */}
      {showRetreatConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-70 z-20 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-red-600 max-w-md">
            <h3 className="text-xl font-medieval text-red-400 mb-3">Bekreft retrett</h3>
            <p className="text-gray-300 mb-4">
              Er du sikker på at du vil trekke deg fra kampen? Dette vil koste deg:
            </p>
            <ul className="mb-4 text-sm space-y-1 bg-gray-700 p-3 rounded-lg">
              <li className="flex items-center text-yellow-400">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>50% av din totale energi</span>
              </li>
              <li className="flex items-center text-red-400">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>All helse du har tapt i kampen så langt ({totalPlayerDamage} HP)</span>
              </li>
              <li className="flex items-center text-gray-400">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span>Minimal erfaring og ingen kampferdighetspoeng</span>
              </li>
            </ul>
            <div className="flex space-x-3 justify-end">
              <button 
                onClick={hideRetreatConfirmation}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
              >
                Avbryt
              </button>
              <button 
                onClick={handleRetreatConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Trekk meg!
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-medieval text-yellow-400 mb-2">
          Kamp mot {monster?.name || 'Monsteret'}
        </h2>
        <p className="text-gray-300">
          Løs mattestykkene for å angripe monsteret. Svar riktig for å gjøre skade!
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Battle Arena - Left Side */}
        <div className="lg:col-span-3 bg-gray-700 rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-around mb-8">
            {/* Player */}
            <div className="text-center">
              <div className={`text-6xl mb-2 ${animatePlayer ? 'animate-bounce text-red-500' : ''}`}>
                🧙
              </div>
              <div className="text-yellow-400 font-semibold mb-1">{character?.name || 'Spiller'}</div>
              
              {/* Health Bar */}
              <div className="w-48 bg-gray-800 rounded-full h-4 mb-1">
                <div 
                  className={`h-4 rounded-full ${getHealthColor(playerHealth, character?.max_health || 100)}`}
                  style={{ width: `${(playerHealth / (character?.max_health || 100)) * 100}%` }}
                ></div>
              </div>
              <div className="text-gray-300 text-sm">{playerHealth}/{character?.max_health || 100} HP</div>
            </div>
            
            {/* Combat Indicator */}
            <div className="text-red-500 text-3xl animate-pulse">⚔️</div>
            
            {/* Monster */}
            <div className="text-center">
              <div className={`text-7xl mb-2 ${animateMonster ? 'animate-bounce text-red-500' : ''}`}>
                {getMonsterEmoji()}
              </div>
              <div className="text-yellow-400 font-semibold mb-1">{monster?.name || `Nivå ${monster?.level || 1} Monster`}</div>
              
              {/* Health Bar */}
              <div className="w-48 bg-gray-800 rounded-full h-4 mb-1">
                <div 
                  className={`h-4 rounded-full ${getHealthColor(monsterHealth, baseMonsterHealth)}`}
                  style={{ width: `${(monsterHealth / baseMonsterHealth) * 100}%` }}
                ></div>
              </div>
              <div className="text-gray-300 text-sm">{monsterHealth}/{baseMonsterHealth} HP</div>
            </div>
          </div>
          
          {/* Math Problem Area */}
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            {gameStatus === 'playing' && currentProblem && (
              <>
                <div className="text-2xl text-white mb-4 font-semibold">
                  {currentProblem.factor1} × {currentProblem.factor2} = ?
                </div>
                
                <div className="mb-4">
                  <div 
                    className="bg-gray-700 h-2 rounded-full overflow-hidden"
                  >
                    <div 
                      className={`h-full ${timeRemaining < 2 ? 'bg-red-500' : 'bg-blue-500'}`} 
                      style={{ 
                        width: `${(timeRemaining / (8 - (monster?.level * 0.3))) * 100}%`,
                        transition: 'width 100ms linear'
                      }}
                    ></div>
                  </div>
                </div>
                
                <form onSubmit={handleSubmitAnswer} className="flex justify-center">
                  <input
                    ref={answerInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="bg-gray-700 text-white px-4 py-2 rounded-l-lg text-xl w-24 text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Svar"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-r-lg font-semibold"
                  >
                    Svar
                  </button>
                </form>
                
                {feedback && (
                  <div 
                    className={`mt-4 text-xl ${feedback.correct ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {feedback.message}
                  </div>
                )}
                
                <div className="mt-6">
                  <button 
                    onClick={showRetreatConfirmation}
                    className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center mx-auto"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Trekk deg (50% energitap)
                  </button>
                </div>
              </>
            )}
            
            {gameStatus === 'victory' && (
              <div className="text-green-400 text-2xl font-medieval animate-pulse">
                Seier! Du beseiret monsteret!
              </div>
            )}
            
            {gameStatus === 'defeat' && (
              <div className="text-red-400 text-2xl font-medieval">
                Nederlag! Du ble beseiret av monsteret.
              </div>
            )}
            
            {gameStatus === 'retreat' && (
              <div className="text-yellow-400 text-2xl font-medieval">
                Du trakk deg fra kampen!
              </div>
            )}
          </div>
        </div>
        
        {/* Battle Log - Right Side */}
        <div className="lg:col-span-2 bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-medieval text-yellow-400 mb-2">Kamploggen</h3>
          
          <div 
            ref={battleLogRef}
            className="bg-gray-800 rounded-lg p-3 h-96 overflow-y-auto text-sm"
          >
            {battleLog.map((log, index) => (
              <div 
                key={index} 
                className={`mb-2 ${
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                <span className="text-gray-500 mr-1">
                  {`[${log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]`}
                </span>
                {log.message}
              </div>
            ))}
            
            {battleLog.length === 0 && (
              <div className="text-gray-500 italic text-center mt-4">
                Kamploggen er tom...
              </div>
            )}
          </div>
          
          <div className="mt-4 bg-gray-800 rounded-lg p-3">
            <h4 className="font-medieval text-yellow-400 mb-1">Bonuser</h4>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Kampferdighet:</span>
                <span className="text-blue-400">Nivå {combatSkillLevel} (+{Math.floor(combatSkillLevel * 8)}% skade)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Basisskade:</span>
                <span className="text-red-400">{basePlayerDamage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Monster vanskelighetsgrad:</span>
                <span className="text-yellow-400">Nivå {monster?.level || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Forsvar:</span>
                <span className="text-blue-400">{playerDefense} ({playerDefense > 0 ? Math.min(50, Math.round(playerDefense)) : 0}% reduksjon)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Skade tatt:</span>
                <span className="text-red-400">{totalPlayerDamage}</span>
              </div>
              {totalDamageBlocked > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Skade blokkert:</span>
                  <span className="text-green-400">{totalDamageBlocked}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

BattleArena.propTypes = {
  character: PropTypes.object.isRequired,
  monster: PropTypes.object.isRequired,
  combatSkillLevel: PropTypes.number.isRequired,
  onCombatEnd: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onPlayerDamage: PropTypes.func
}

export default BattleArena 