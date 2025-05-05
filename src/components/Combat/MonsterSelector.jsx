import { useState } from 'react'
import PropTypes from 'prop-types'

const MonsterSelector = ({ onStart, selectedLevel, onLevelChange, monster, character }) => {
  const [isLoading, setIsLoading] = useState(false)
  
  // Array med vanskelighetsgrader for monstre
  const monsterLevels = [
    { level: 1, description: 'Enkel - Anbefalt for nybegynnere' },
    { level: 2, description: 'Lett - Trenger litt øvelse i gangetabellen' },
    { level: 3, description: 'Moderat - Krever god forståelse av gangetabellen' },
    { level: 4, description: 'Utfordrende - Må svare riktig og raskt' },
    { level: 5, description: 'Vanskelig - Trenger god matematikk-kunnskap' },
    { level: 6, description: 'Krevende - For de som er raske på tastaturet' },
    { level: 7, description: 'Veldig krevende - Ikke for de svakhjertede' },
    { level: 8, description: 'Ekspert - Egnet for mattegeni' },
    { level: 9, description: 'Mester - Ekstrem utfordring' },
    { level: 10, description: 'Legendær - Nesten umulig å beseire' }
  ]
  
  // Sjekk om karakteren har nok energi til å starte en kamp
  const hasEnoughEnergy = (character?.energy || 0) >= 10;
  
  // Definerer monsterets karakteristikker
  const monsterDifficulty = () => {
    if (selectedLevel <= 3) return 'For nybegynnere'
    if (selectedLevel <= 6) return 'Moderat utfordrende'
    if (selectedLevel <= 8) return 'Svært utfordrende'
    return 'Ekstremt vanskelig'
  }
  
  // Håndter klikk på start kamp-knappen
  const handleStartCombat = () => {
    if (!hasEnoughEnergy) return;
    setIsLoading(true);
    // Kort forsinkelse for å simulere lasting
    setTimeout(() => {
      onStart();
    }, 500);
  };
  
  // Genererer en visuell representasjon av styrke basert på nivå
  const strengthBar = (level) => {
    const bars = []
    for (let i = 0; i < 5; i++) {
      const filled = i < Math.ceil(level / 2)
      bars.push(
        <div 
          key={i}
          className={`h-2 w-6 rounded-full mx-0.5 ${
            filled 
              ? level <= 3 
                ? 'bg-green-500' 
                : level <= 6 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              : 'bg-gray-600'
          }`}
        ></div>
      )
    }
    return bars
  }
  
  // Genererer monster-avatar basert på nivå
  const getMonsterEmoji = (level) => {
    const monsters = ['👾', '👹', '👺', '👻', '💀', '👽', '🤖', '🐲', '🐉', '👿']
    return monsters[level - 1] || '👹'
  }
  
  // Sjekker om karakteren er klar for denne kampen
  const isRecommended = () => {
    const combatSkill = character?.skills?.find(s => s.skill_name === 'Kamp')?.level || 1
    return combatSkill >= Math.ceil(selectedLevel / 2)
  }
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-medieval text-yellow-400 mb-4">Velg monster</h2>
        <p className="text-gray-300 mb-6">
          Velg vanskelighetsgrad for monsteret du vil kjempe mot. 
          Høyere nivå gir bedre belønninger, men er vanskeligere å beseire.
        </p>
        
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <div className="flex items-center text-yellow-500 mb-2">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="font-semibold">Viktig å vite før kamp</span>
          </div>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Det koster <span className="text-yellow-400 font-semibold">10 energi</span> å starte en kamp</li>
            <li>All skade du tar under kampen vil redusere din karakters helse permanent</li>
            <li>Pass på at du har nok helse før du starter en kamp mot vanskelige monstre</li>
          </ul>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monster Preview */}
        <div className="bg-gray-700 rounded-lg p-6 flex flex-col items-center">
          <div className="text-8xl mb-4 animate-pulse">
            {getMonsterEmoji(selectedLevel)}
          </div>
          
          <h3 className="text-xl font-medieval text-yellow-400 mb-2">
            {monster?.name || `Nivå ${selectedLevel} Monster`}
          </h3>
          
          <div className="flex items-center mb-4">
            <span className="text-gray-400 mr-2">Styrke:</span>
            <div className="flex">{strengthBar(selectedLevel)}</div>
          </div>
          
          <div className="bg-gray-800 p-3 rounded-lg mb-4 w-full">
            <p className="text-gray-300 text-center">
              {monster?.description || `Dette er et nivå ${selectedLevel} monster. ${monsterDifficulty()}`}
            </p>
          </div>
          
          <div className="mt-auto w-full">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-300">Energikostnad:</span>
              </div>
              <span className={`text-sm ${hasEnoughEnergy ? 'text-green-400' : 'text-red-400'}`}>
                10 / {character?.energy || 0}
              </span>
            </div>
            
            {!isRecommended() && (
              <div className="text-red-400 text-sm mb-4 text-center">
                <span className="mr-1">⚠️</span> 
                Dette monsteret kan være for vanskelig for din karakter. Vurder å øke din kampferdighet først.
              </div>
            )}
            
            {!hasEnoughEnergy && (
              <div className="text-red-400 text-sm mb-4 text-center">
                <span className="mr-1">⚠️</span> 
                Du har ikke nok energi til å starte en kamp. Du trenger minst 10 energi.
              </div>
            )}
            
            <button
              onClick={handleStartCombat}
              disabled={isLoading || !hasEnoughEnergy}
              className={`w-full px-6 py-3 rounded-lg font-medieval text-white transition-all
                ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 
                  !hasEnoughEnergy ? 'bg-gray-600 cursor-not-allowed' : 
                  'bg-red-600 hover:bg-red-700 animate-pulse'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Forbereder kamp...
                </span>
              ) : !hasEnoughEnergy ? (
                <>Ikke nok energi</>
              ) : (
                <>Start kamp (10 energi)</>
              )}
            </button>
          </div>
        </div>
        
        {/* Monster Level Selection */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-medieval text-yellow-400 mb-4">Velg vanskelighetsgrad</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {monsterLevels.map((monster) => (
              <div 
                key={monster.level}
                onClick={() => onLevelChange(monster.level)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all
                  ${selectedLevel === monster.level 
                    ? 'bg-yellow-900 border border-yellow-500' 
                    : 'bg-gray-800 hover:bg-gray-750 border border-transparent'}
                `}
              >
                <div className="flex items-center">
                  <div className="text-3xl mr-3">
                    {getMonsterEmoji(monster.level)}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Nivå {monster.level}</h4>
                    <p className="text-gray-400 text-sm">{monster.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

MonsterSelector.propTypes = {
  onStart: PropTypes.func.isRequired,
  selectedLevel: PropTypes.number.isRequired,
  onLevelChange: PropTypes.func.isRequired,
  monster: PropTypes.object,
  character: PropTypes.object
}

export default MonsterSelector 