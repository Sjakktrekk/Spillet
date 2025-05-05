import { useEffect, useState } from 'react';
import useLevelUpModal from '../hooks/useLevelUpModal';
import { SKILL_DATA } from '../hooks/useSkills';

export default function LevelUpModal() {
  const { showModal, levelUpData, hideLevelUpModal, getQuoteForLevel, getUnlocksForLevel } = useLevelUpModal();
  const [animationClass, setAnimationClass] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    if (showModal) {
      // Lag en liten forsinkelse før animasjonen starter
      setTimeout(() => {
        setAnimationClass('animate-in');
      }, 100);
    } else {
      setAnimationClass('');
    }
  }, [showModal]);

  if (!showModal || !levelUpData) return null;

  const unlocks = getUnlocksForLevel(levelUpData.newLevel);
  const quote = getQuoteForLevel(levelUpData.newLevel);

  // Velg en tilfeldig ferdighet som anbefales å forbedre
  const getRandomSkill = () => {
    if (!selectedSkill) {
      const skillNames = Object.keys(SKILL_DATA);
      const randomIndex = Math.floor(Math.random() * skillNames.length);
      return SKILL_DATA[skillNames[randomIndex]];
    }
    return selectedSkill;
  };

  const recommendedSkill = getRandomSkill();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Bakgrunnen med partikler */}
      <div className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm">
        {/* Animerte partikler */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full opacity-70 animate-float"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 7}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Modal-innhold */}
      <div 
        className={`relative max-w-2xl w-full mx-auto bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden border-2 border-yellow-600 shadow-[0_0_15px_5px_rgba(234,179,8,0.3)] ${animationClass}`}
      >
        {/* Topp-banner med dekorativ ramme */}
        <div className="relative bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 p-6 border-b-2 border-yellow-600">
          <div className="absolute top-0 left-0 w-16 h-16">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-yellow-300 opacity-80"></div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-yellow-300 opacity-80"></div>
          </div>

          <h2 className="text-center font-medieval text-4xl text-white tracking-wider text-shadow-lg font-bold py-2">
            <span className="animate-pulse-gold">NIVÅ OPP!</span>
          </h2>
          <div className="text-center text-white text-2xl font-semibold">
            Nivå {levelUpData.newLevel}
          </div>
        </div>

        {/* Hovedinnhold */}
        <div className="p-6 text-white">
          <div className="flex flex-col md:flex-row items-center">
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 mb-6 md:mb-0 md:mr-6 relative">
              {levelUpData.avatar ? (
                <img 
                  src={levelUpData.avatar} 
                  alt="Karakter avatar" 
                  className="w-full h-full object-cover rounded-full border-4 border-yellow-600 animate-glow"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-yellow-700 border-4 border-yellow-600 flex items-center justify-center text-4xl font-bold text-yellow-300 animate-glow">
                  {levelUpData.name?.charAt(0).toUpperCase() || "A"}
                </div>
              )}
              <div className="absolute -top-3 -right-3 bg-yellow-500 text-gray-900 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold border-2 border-yellow-300 animate-bounce">
                {levelUpData.newLevel}
              </div>
            </div>

            {/* Informasjon */}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">{levelUpData.name}</h3>
              
              <div className="mb-5 space-y-2">
                <div className="flex items-center text-lg">
                  <span className="text-yellow-300 mr-3">✨</span> 
                  <span className="font-semibold">Du har oppnådd nivå {levelUpData.newLevel}!</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-yellow-300 mr-3">❤️</span>
                  <span>+{levelUpData.bonusHealth} Maksimal helse</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-yellow-300 mr-3">⚡</span>
                  <span>+{levelUpData.bonusEnergy} Maksimal energi</span>
                </div>
              </div>

              {/* Anbefalt ferdighet å fokusere på */}
              <div className="mb-4 py-3 px-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
                <div className="flex items-center text-lg mb-2">
                  <span className="text-yellow-300 mr-2">{recommendedSkill.icon}</span>
                  <span className="font-semibold">Anbefalt ferdighet:</span>
                </div>
                <div className="ml-7">
                  <div className="text-yellow-200 font-medium">{recommendedSkill.name}</div>
                  <p className="text-gray-300 text-sm mt-1">{recommendedSkill.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Øker ved: {recommendedSkill.levelsUpBy}</p>
                </div>
              </div>

              {/* Opplåste funksjoner */}
              {unlocks && (
                <div className="mb-4 py-3 px-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
                  <div className="flex items-center text-lg mb-2">
                    <span className="text-yellow-300 mr-2">🔓</span>
                    <span className="font-semibold">Låst opp:</span>
                  </div>
                  <div className="ml-7 text-yellow-200">{unlocks.text}</div>
                </div>
              )}
            </div>
          </div>

          {/* Informasjon om ferdigheter */}
          <div className="mt-6 border-t border-gray-700 pt-4">
            <p className="text-center text-gray-300">
              Forbedre ferdighetene dine ved å bruke dem aktivt i spillet. Utforsk, kjemp, 
              handel og bruk magi for å se ferdighetsnivåene dine stige!
            </p>
          </div>

          {/* Sitat */}
          <div className="mt-4 border-t border-gray-700 pt-4 text-center">
            <blockquote className="italic text-gray-300">
              "{quote}"
            </blockquote>
          </div>
        </div>

        {/* Knapp for å lukke */}
        <div className="p-4 border-t border-gray-700 flex justify-center">
          <button 
            onClick={hideLevelUpModal}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors shadow-md"
          >
            Fortsett eventyret
          </button>
        </div>
      </div>
    </div>
  );
}

// CSS-klasser som skal legges til i index.css
/*
.animate-in {
  animation: modalFadeIn 0.5s forwards;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-float {
  animation-name: float;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
  100% {
    transform: translateY(0) rotate(360deg);
  }
}

.text-shadow-lg {
  text-shadow: 0 0 10px rgba(234, 179, 8, 0.7),
               0 0 20px rgba(234, 179, 8, 0.5);
}

.animate-pulse-gold {
  animation: pulse-gold 2s infinite;
}

@keyframes pulse-gold {
  0% {
    text-shadow: 0 0 10px rgba(234, 179, 8, 0.7),
                 0 0 20px rgba(234, 179, 8, 0.5);
  }
  50% {
    text-shadow: 0 0 20px rgba(234, 179, 8, 0.9),
                 0 0 30px rgba(234, 179, 8, 0.7),
                 0 0 40px rgba(234, 179, 8, 0.5);
  }
  100% {
    text-shadow: 0 0 10px rgba(234, 179, 8, 0.7),
                 0 0 20px rgba(234, 179, 8, 0.5);
  }
}

.animate-glow {
  animation: border-glow 2s infinite;
}

@keyframes border-glow {
  0% {
    box-shadow: 0 0 5px rgba(234, 179, 8, 0.5);
  }
  50% {
    box-shadow: 0 0 15px rgba(234, 179, 8, 0.8),
                0 0 20px rgba(234, 179, 8, 0.5);
  }
  100% {
    box-shadow: 0 0 5px rgba(234, 179, 8, 0.5);
  }
}

.font-medieval {
  font-family: 'Cinzel', serif;
}
*/ 