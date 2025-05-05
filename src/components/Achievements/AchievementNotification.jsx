import { useState, useEffect, useRef } from 'react'

export default function AchievementNotification({ achievement, onClose }) {
  const [visible, setVisible] = useState(true)
  const [closing, setClosing] = useState(false)
  const closeTimeoutRef = useRef(null);
  const closeHandledRef = useRef(false);

  useEffect(() => {
    // Start timer for automatisk lukking
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => {
      clearTimeout(timer);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    }
  }, [])

  const handleClose = () => {
    // Forhindre flere kall til handleClose
    if (closeHandledRef.current || closing) return;
    
    closeHandledRef.current = true;
    setClosing(true)
    
    // Animasjon varer i 500ms
    closeTimeoutRef.current = setTimeout(() => {
      setVisible(false)
      if (onClose) onClose()
    }, 500)
  }

  if (!visible) return null

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'lett': return 'border-green-500'
      case 'medium': return 'border-blue-500'
      case 'hard': return 'border-purple-500'
      case 'legendarisk': return 'border-yellow-500'
      default: return 'border-gray-500'
    }
  }
  
  // Sjekk om reward-teksten inneholder en tittel
  const hasTitleReward = achievement.reward && achievement.reward.toLowerCase().includes('tittel:');
  
  // Trekk ut tittelnavnet fra reward-teksten hvis den finnes
  let titleName = '';
  if (hasTitleReward) {
    const titleMatch = achievement.reward.match(/tittel:\s*([^,\.]+)/i);
    if (titleMatch && titleMatch[1]) {
      titleName = titleMatch[1].trim();
    }
  }

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg bg-gray-800 border-l-4 ${getDifficultyColor(achievement.difficulty)} shadow-2xl flex items-start max-w-md transition-all duration-500 ${
        closing 
          ? 'opacity-0 translate-x-32' 
          : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="bg-gray-700 p-3 rounded-full mr-3">
        <div className="text-2xl">{achievement.icon}</div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-yellow-500 font-bold text-sm uppercase tracking-wider mb-1">Prestasjon låst opp!</div>
            <h3 className="text-white font-bold text-lg">{achievement.name}</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-300 text-sm my-1">{achievement.description}</p>
        <div className="mt-2">
          <div className="flex items-center text-xs text-gray-400">
            <span className="mr-2">Belønning:</span>
            <span className="text-yellow-400">{achievement.reward}</span>
          </div>
          
          {/* Vis tittel-informasjon hvis prestasjonen låser opp en tittel */}
          {hasTitleReward && titleName && (
            <div className="mt-2 bg-gray-700 p-2 rounded border border-yellow-600">
              <div className="text-xs text-yellow-500 font-bold mb-1">NY TITTEL LÅST OPP!</div>
              <div className="flex items-center">
                <div className="bg-yellow-800 rounded-full w-6 h-6 flex items-center justify-center mr-2">👑</div>
                <span className="text-white font-bold">{titleName}</span>
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Gå til karakter-siden for å aktivere din nye tittel
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 