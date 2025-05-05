import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useCharacter from '../../hooks/useCharacter';
import { getRandomTravelEvent, rollDice, logTravel, calculateTravelCost, updatePlayerLocation } from '../../lib/travel';
import useAchievementTracker from '../../hooks/useAchievementTracker';

export default function TravelModal({ 
  isOpen, 
  onClose, 
  fromCity, 
  toCity, 
  cities 
}) {
  const { user } = useAuth();
  const { 
    character, 
    addCoins, 
    removeCoins, 
    addExperience, 
    updateCharacter 
  } = useCharacter();
  const navigate = useNavigate();
  const achievementTracker = useAchievementTracker();
  
  const [stage, setStage] = useState('confirm'); // confirm -> traveling -> event -> result -> journal -> complete
  const [event, setEvent] = useState(null);
  const [travelCost, setTravelCost] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [outcomeSuccess, setOutcomeSuccess] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const [rewards, setRewards] = useState({ gold: 0, experience: 0, health: 0 });
  const [journalError, setJournalError] = useState('');
  
  useEffect(() => {
    if (isOpen && cities && fromCity && toCity) {
      // Beregn reisekostnad basert på avstand mellom byene
      const cost = calculateTravelCost(fromCity.id, toCity.id, cities);
      setTravelCost(cost);
    }
  }, [isOpen, fromCity, toCity, cities]);
  
  // Starter reisen
  const handleStartTravel = () => {
    if (!character || character.coins < travelCost) {
      alert('Du har ikke nok gull til å reise!');
      return;
    }
    
    // Trekk reisekostnad
    removeCoins(travelCost);
    
    // Gå til reise-status
    setStage('traveling');
    
    // Simuler reise med forsinkelse
    setTimeout(() => {
      // Generer en tilfeldig hendelse
      const randomEvent = getRandomTravelEvent();
      setEvent(randomEvent);
      setStage('event');
    }, 2000);
  };
  
  // Håndterer valg av handling
  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
    
    // Simulerer terningkast basert på karakterens ferdigheter
    const skill = choice.skill;
    const characterSkillValue = character[skill] || 0;
    const isSuccess = rollDice(characterSkillValue, choice.difficulty);
    
    setOutcomeSuccess(isSuccess);
    
    // Vis utfallet
    if (isSuccess) {
      setOutcome(choice.success);
      
      // Legg til belønning
      const reward = choice.successReward;
      setRewards(reward);
      
      // Oppdater karakter med belønning
      if (reward.gold) addCoins(reward.gold);
      if (reward.experience) addExperience(reward.experience);
      if (reward.health && character.health !== undefined && character.max_health !== undefined) {
        updateCharacter({ 
          health: Math.min(character.health + reward.health, character.max_health) 
        });
      }
      
      // Achievement
      try {
        achievementTracker.travelSuccess();
      } catch (err) {
        console.log('Kunne ikke oppdatere achievement');
      }
    } else {
      setOutcome(choice.failure);
      
      // Påfør straff
      const penalty = choice.failurePenalty;
      setRewards(penalty);
      
      // Oppdater karakter med straff
      if (penalty.gold) addCoins(penalty.gold);
      if (penalty.experience) addExperience(penalty.experience);
      if (penalty.health && character.health !== undefined) {
        updateCharacter({ 
          health: Math.max(1, character.health + penalty.health) 
        });
      }
    }
    
    // Gå til resultat-visning
    setStage('result');
  };
  
  // Gå til dagbokskjermen etter at hendelsen er over
  const handleContinueToJournal = () => {
    setStage('journal');
  };
  
  // Fullfør reisen og lagre dagbok
  const handleCompleteTravel = async () => {
    try {
      // Sjekk om dagboknotatet er langt nok
      if (journalEntry.trim() && journalEntry.trim().length < 100) {
        setJournalError('Dagboknotatet må være minst 100 tegn langt');
        return;
      }
      
      // Lagre i localStorage først for umiddelbar effekt
      if (user && toCity) {
        try {
          localStorage.setItem(`player_location_${user.id}`, JSON.stringify({
            city_id: toCity.id,
            updated_at: new Date().toISOString()
          }));
          console.log(`Lagret spillerposisjon (by ${toCity.id}) i localStorage for reise`);
        } catch (localStorageError) {
          console.error('Kunne ikke lagre posisjon i localStorage:', localStorageError);
        }
      }
      
      // Lagre reiselogg i databasen
      if (user && event) {
        try {
          await logTravel(
            user.id,
            fromCity.id,
            toCity.id,
            event.id,
            journalEntry,
            outcomeSuccess
          );
        } catch (logError) {
          console.error('Feil ved lagring av reiselogg:', logError);
          // Fortsett likevel siden dette ikke er kritisk
        }
      }
      
      // Oppdater spillerens posisjon i databasen
      if (user && toCity) {
        try {
          const positionUpdateSuccess = await updatePlayerLocation(user.id, toCity.id);
          if (!positionUpdateSuccess) {
            console.log('Kunne ikke oppdatere posisjon i databasen, men fortsetter siden vi har lagret i localStorage');
          }
        } catch (positionError) {
          console.error('Feil ved oppdatering av spillerposisjon:', positionError);
          // Vi har allerede lagret i localStorage, så vi fortsetter
        }
      }
      
      // Fullfør reisen
      setStage('complete');
      
      // Oppdater achievement - besøkt en ny by
      try {
        achievementTracker.visitCity(toCity.name);
      } catch (err) {
        console.log('Kunne ikke oppdatere achievement for bybesøk');
      }
      
      // Navigerer til destinasjonsbyen etter kort forsinkelse
      setTimeout(() => {
        navigate(`/city/${toCity.id}`);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Generell feil ved fullførelse av reise:', error);
      
      // Fortsett reisen uansett hvis vi har destinasjonen
      if (toCity) {
        // Sikre at localStorage alltid blir oppdatert
        try {
          localStorage.setItem(`player_location_${user.id}`, JSON.stringify({
            city_id: toCity.id,
            updated_at: new Date().toISOString()
          }));
        } catch(e) {
          console.error('Kritisk feil - kunne ikke lagre i localStorage:', e);
        }
        
        // Naviger til byen uansett
        navigate(`/city/${toCity.id}`);
        onClose();
      } else {
        // Hvis vi mangler toCity, gå tilbake til kartet
        navigate('/home');
        onClose();
      }
    }
  };
  
  // Hvis modal ikke er åpen, ikke vis noe
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 border border-gray-700 shadow-lg">
        {stage === 'confirm' && (
          <>
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">Planlegg reise</h2>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-gray-400">Fra:</span>
                  <span className="ml-2 text-gray-200">{fromCity?.name}</span>
                </div>
                <div className="text-xl text-gray-400">→</div>
                <div>
                  <span className="text-gray-400">Til:</span>
                  <span className="ml-2 text-gray-200">{toCity?.name}</span>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-gray-200 mb-2">Reiseinformasjon</h3>
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reisekostnad:</span>
                    <span className="text-yellow-400">{travelCost} gull</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Beregnet reisetid:</span>
                    <span className="text-gray-200">1 dag</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Din gullbeholdning:</span>
                    <span className={character?.coins < travelCost ? 'text-red-400' : 'text-yellow-400'}>
                      {character?.coins || 0} gull
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6">
                Veien mellom byer kan være farlig, og du vil kanskje støte på utfordringer underveis. 
                Vær sikker på at du er godt forberedt før du legger ut på reisen.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300"
              >
                Avbryt
              </button>
              <button
                onClick={handleStartTravel}
                disabled={!character || character.coins < travelCost}
                className={`px-4 py-2 rounded-md text-sm font-medium 
                  ${(!character || character.coins < travelCost) 
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'}
                `}
              >
                Start reise ({travelCost} gull)
              </button>
            </div>
          </>
        )}
        
        {stage === 'traveling' && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <div className="text-xl text-yellow-500 mb-2">Reiser til {toCity?.name}...</div>
            <p className="text-gray-400">Du er på vei gjennom landskapet...</p>
          </div>
        )}
        
        {stage === 'event' && event && (
          <>
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">{event.title}</h2>
            <p className="text-gray-300 mb-6">{event.description}</p>
            
            <h3 className="font-semibold text-gray-200 mb-3">Hva vil du gjøre?</h3>
            <div className="space-y-3 mb-6">
              {event.choices.map(choice => (
                <div 
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice)}
                  className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 border border-gray-600 hover:border-yellow-500 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{choice.text}</span>
                    <span className="text-sm text-gray-400">
                      Bruker {choice.skill === 'strength' ? 'Styrke' :
                        choice.skill === 'knowledge' ? 'Kunnskap' :
                        choice.skill === 'agility' ? 'Smidighet' :
                        choice.skill === 'magic' ? 'Magi' : 'Ukjent'}
                      ({character ? character[choice.skill] : 0})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {stage === 'result' && (
          <>
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">
              {outcomeSuccess ? 'Vellykket!' : 'Mislykket!'}
            </h2>
            <p className="text-gray-300 mb-6">{outcome}</p>
            
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-200 mb-2">Resultat:</h3>
              <div className="space-y-2">
                {rewards.gold !== 0 && (
                  <div className="flex justify-between">
                    <span>Gull:</span>
                    <span className={rewards.gold > 0 ? 'text-green-400' : 'text-red-400'}>
                      {rewards.gold > 0 ? `+${rewards.gold}` : rewards.gold}
                    </span>
                  </div>
                )}
                {rewards.experience !== 0 && (
                  <div className="flex justify-between">
                    <span>Erfaring:</span>
                    <span className={rewards.experience > 0 ? 'text-green-400' : 'text-red-400'}>
                      {rewards.experience > 0 ? `+${rewards.experience}` : rewards.experience}
                    </span>
                  </div>
                )}
                {rewards.health !== 0 && (
                  <div className="flex justify-between">
                    <span>Helse:</span>
                    <span className={rewards.health > 0 ? 'text-green-400' : 'text-red-400'}>
                      {rewards.health > 0 ? `+${rewards.health}` : rewards.health}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleContinueToJournal}
                className="px-4 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Fortsett
              </button>
            </div>
          </>
        )}
        
        {stage === 'journal' && (
          <>
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">Reisedagbok</h2>
            <p className="text-gray-300 mb-4">
              Skriv ned dine tanker om hendelsen. Dagboknotatet må være minst 100 tegn langt.
            </p>
            
            <textarea
              value={journalEntry}
              onChange={(e) => {
                setJournalEntry(e.target.value);
                setJournalError('');
              }}
              placeholder="Skriv dine tanker om hendelsen her..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[120px] mb-2"
            />
            
            {journalError && (
              <p className="text-red-400 text-sm mb-4">{journalError}</p>
            )}
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {journalEntry.trim().length}/100 tegn
              </div>
              <button
                onClick={handleCompleteTravel}
                className="px-4 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {journalEntry.trim() ? 'Lagre og fortsett' : 'Hopp over'}
              </button>
            </div>
          </>
        )}
        
        {stage === 'complete' && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <div className="text-xl text-yellow-500 mb-2">Ankommer {toCity?.name}...</div>
            <p className="text-gray-400">Reisen er nesten fullført.</p>
          </div>
        )}
      </div>
    </div>
  );
} 