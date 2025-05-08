import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getRaces, getClasses, createCharacter, getAvatars, deleteCharacter } from '../lib/characterData'
import { supabase } from '../lib/supabase'
import characterCreationBg from '../assets/character-creation.jpg'
import ccNpc from '../assets/NPC/cc-npc.png'

export default function CharacterCreation() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [races, setRaces] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRace, setSelectedRace] = useState(null)
  const [selectedClass, setSelectedClass] = useState(null)
  const [avatars, setAvatars] = useState([])
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [hasExistingCharacter, setHasExistingCharacter] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)
  const [deletingCharacter, setDeletingCharacter] = useState(false)
  const [currentStep, setCurrentStep] = useState('welcome')
  const [showRaceModal, setShowRaceModal] = useState(false)
  const [showClassModal, setShowClassModal] = useState(false)

  const [character, setCharacter] = useState({
    name: '',
    race_id: '',
    class_id: '',
    avatar_url: '',
  })

  const npcDialogues = {
    welcome: "Velkommen, eventyrer! Jeg er din guide i denne magiske verdenen. La oss begynne med å gi deg et navn som vil bli kjent gjennom hele Eldoria.",
    nameEntered: "Et flott navn! Nå skal vi velge din rase. Hver rase har sine egne styrker og særegenheter. La meg fortelle deg om dem...",
    raceSelected: "Utmerket valg! Nå skal vi finne den perfekte klassen for deg. Hver klasse har sin egen unike sti til makt og ære...",
    classSelected: "Fantastisk! Du har nå valgt både rase og klasse. La oss velge et utseende som passer til din nye identitet.",
    ready: "Perfekt! Du er nå klar til å begynne ditt eventyr. Er du klar til å trå inn i historien?"
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [racesData, classesData] = await Promise.all([
          getRaces(),
          getClasses()
        ])
        setRaces(racesData)
        setClasses(classesData)
        setLoading(false)
      } catch (error) {
        setError('Kunne ikke laste inn data')
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (character.race_id) {
      const race = races.find(r => r.id === parseInt(character.race_id))
      setSelectedRace(race)
    } else {
      setSelectedRace(null)
    }
  }, [character.race_id, races])

  useEffect(() => {
    if (character.class_id) {
      const characterClass = classes.find(c => c.id === parseInt(character.class_id))
      setSelectedClass(characterClass)
    } else {
      setSelectedClass(null)
    }
  }, [character.class_id, classes])

  // Last inn avatarer når rase velges
  useEffect(() => {
    if (selectedRace) {
      try {
        const avatarsList = getAvatars(selectedRace.name)
        setAvatars(avatarsList)
        // Fjern eventuelt tidligere valgt avatar hvis rasen endres
        setSelectedAvatar(null)
        setCharacter(prev => ({ ...prev, avatar_url: '' }))
      } catch (error) {
        console.error('Feil ved lasting av avatarer:', error)
      }
    } else {
      setAvatars([])
      setSelectedAvatar(null)
    }
  }, [selectedRace])

  // Sjekk om brukeren allerede har en karakter ved oppstart
  useEffect(() => {
    if (user) {
      async function checkExistingCharacter() {
        try {
          const { data, error } = await supabase
            .from('characters')
            .select('id, name')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (data) {
            setHasExistingCharacter(data);
          }
        } catch (err) {
          console.error('Feil ved sjekk av eksisterende karakter:', err);
        }
      }
      
      checkExistingCharacter();
    }
  }, [user]);

  const handleSelectAvatar = (avatar) => {
    setSelectedAvatar(avatar)
    setCharacter(prev => ({ ...prev, avatar_url: avatar.url }))
  }

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (character.name.trim()) {
      setCurrentStep('nameEntered')
    }
  }

  const handleRaceSelect = (race) => {
    setCharacter(prev => ({ ...prev, race_id: race.id }))
    setSelectedRace(race)
    setShowRaceModal(false)
    setCurrentStep('raceSelected')
  }

  const handleClassSelect = (cls) => {
    setCharacter(prev => ({ ...prev, class_id: cls.id }))
    setSelectedClass(cls)
    setShowClassModal(false)
    setCurrentStep('classSelected')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!character.avatar_url && selectedRace) {
      setError('Vennligst velg en avatar for karakteren din')
      return
    }

    if (hasExistingCharacter) {
      setError('Du har allerede opprettet en karakter. Slett den eksisterende karakteren først.');
      return;
    }

    try {
      // Først sjekker vi om brukeren har en profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Oppretter profil hvis den ikke finnes
        await supabase
          .from('profiles')
          .insert([{ id: user.id, username: user.email.split('@')[0] }])
      }

      // Oppretter karakteren
      const classId = parseInt(character.class_id);
      
      // Sett grunnverdier for alle attributter til 5
      let strength = 5;
      let knowledge = 5;
      let agility = 5;
      let magic = 5;
      
      // Legg til klassespesifikke bonuser
      switch (classId) {
        case 2: // Kriger
          strength += 3;
          agility += 2;
          break;
        case 1: // Eventyrer
          agility += 3;
          knowledge += 2;
          break;
        case 3: // Magiker
          magic += 3;
          knowledge += 2;
          break;
        case 4: // Tyv
          agility += 2;
          strength += 2;
          knowledge += 1;
          break;
      }
      
      const newCharacter = {
        user_id: user.id,
        name: character.name,
        race_id: parseInt(character.race_id),
        class_id: classId,
        avatar_url: character.avatar_url,
        level: 1,
        experience: 0,
        coins: classes.find(c => c.id === classId)?.starting_coins || 0,
        strength,
        knowledge,
        agility,
        magic,
        skill_points: 0
      }

      // Oppretter karakteren i databasen
      const createdCharacter = await createCharacter(newCharacter)
      
      // Omdiriger til hovedsiden
      navigate('/home')
    } catch (error) {
      setError(error.message)
    }
  }

  // Funksjon for å slette eksisterende karakter
  const handleDeleteCharacter = async () => {
    try {
      setDeletingCharacter(true);
      await deleteCharacter(user.id);
      setHasExistingCharacter(false);
      setDeleteConfirmation(false);
    } catch (error) {
      setError(`Feil ved sletting av karakter: ${error.message}`);
    } finally {
      setDeletingCharacter(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-900"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)), url(${characterCreationBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster inn verdens skapningsverktøy...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)), url(${characterCreationBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-7xl">
        <div className="grid grid-cols-2 gap-8">
          {/* Venstre boks - NPC */}
          <div className="flex items-center justify-start">
            <div className="relative w-[500px] h-[500px]">
              <div className="absolute inset-0 animate-pulse bg-yellow-500/20 rounded-full blur-xl"></div>
              <img 
                src={ccNpc} 
                alt="Guide NPC" 
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"
              />
            </div>
          </div>

          {/* Høyre boks - Dialog og innhold */}
          <div className="bg-gray-900 bg-opacity-80 py-8 px-6 rounded-lg border-2 border-yellow-700 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            {/* Dialog */}
            <div className="mb-8">
              <div className="bg-gray-800 p-6 rounded-lg border border-yellow-600 relative">
                <div className="absolute -left-4 top-6 w-8 h-8 transform rotate-45 bg-gray-800 border-l border-b border-yellow-600"></div>
                <div className="text-yellow-400 text-xl mb-2">Din Guide</div>
                <p className="text-gray-300 text-lg leading-relaxed">{npcDialogues[currentStep]}</p>
              </div>
            </div>

            {/* Character Creation Form */}
            {currentStep === 'welcome' && (
              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-yellow-500 mb-1">
                    Hva skal din karakter hete?
                  </label>
                  <input
                    type="text"
                    value={character.name}
                    onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                    className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-gray-900 bg-yellow-600 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
                >
                  Fortsett
                </button>
              </form>
            )}

            {currentStep === 'nameEntered' && (
              <div className="text-center">
                <button
                  onClick={() => setShowRaceModal(true)}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-lg font-medium transition-colors duration-200"
                >
                  Velg din rase
                </button>
              </div>
            )}

            {/* Race Selection Modal */}
            {showRaceModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full mx-4 border-2 border-yellow-600">
                  <h2 className="text-2xl font-bold text-yellow-500 mb-4">Velg din rase</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {races.map((race) => (
                      <div
                        key={race.id}
                        onClick={() => handleRaceSelect(race)}
                        className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-yellow-500 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center text-xl mr-3">
                            {race.icon || '👤'}
                          </div>
                          <h3 className="text-lg font-medium text-yellow-400">{race.name}</h3>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{race.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {race.combat_bonus > 0 && (
                            <>
                              <div className="text-gray-400">Kamp:</div>
                              <div className="text-right text-green-400">+{race.combat_bonus}</div>
                            </>
                          )}
                          {race.endurance_bonus > 0 && (
                            <>
                              <div className="text-gray-400">Utholdenhet:</div>
                              <div className="text-right text-green-400">+{race.endurance_bonus}</div>
                            </>
                          )}
                          {race.exploration_bonus > 0 && (
                            <>
                              <div className="text-gray-400">Utforskning:</div>
                              <div className="text-right text-green-400">+{race.exploration_bonus}</div>
                            </>
                          )}
                          {race.knowledge_bonus > 0 && (
                            <>
                              <div className="text-gray-400">Kunnskap:</div>
                              <div className="text-right text-green-400">+{race.knowledge_bonus}</div>
                            </>
                          )}
                          {race.magic_bonus > 0 && (
                            <>
                              <div className="text-gray-400">Magi:</div>
                              <div className="text-right text-green-400">+{race.magic_bonus}</div>
                            </>
                          )}
                          {race.persuasion_bonus > 0 && (
                            <>
                              <div className="text-gray-400">Overtalelse:</div>
                              <div className="text-right text-green-400">+{race.persuasion_bonus}</div>
                            </>
                          )}
                          {race.crafting_bonus > 0 && (
                            <>
                              <div className="text-gray-400">Håndverk:</div>
                              <div className="text-right text-green-400">+{race.crafting_bonus}</div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Class Selection Modal */}
            {showClassModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full mx-4 border-2 border-yellow-600">
                  <h2 className="text-2xl font-bold text-yellow-500 mb-4">Velg din klasse</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => handleClassSelect(cls)}
                        className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-yellow-500 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center text-xl mr-3">
                            {cls.icon || '⚔️'}
                          </div>
                          <h3 className="text-lg font-medium text-yellow-400">{cls.name}</h3>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{cls.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-400">Startmynt:</div>
                          <div className="text-right text-yellow-400">{cls.starting_coins || 0} gull</div>
                          <div className="text-gray-400">Hovedattributt:</div>
                          <div className="text-right text-blue-400">{cls.primary_attribute || 'Ukjent'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'raceSelected' && (
              <div className="text-center">
                <button
                  onClick={() => setShowClassModal(true)}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-lg font-medium transition-colors duration-200"
                >
                  Velg din klasse
                </button>
              </div>
            )}

            {currentStep === 'classSelected' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl text-yellow-400 mb-4">Velg ditt utseende</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {avatars.map((avatar, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleSelectAvatar(avatar)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedAvatar === avatar ? 'border-yellow-500 ring-2 ring-yellow-400' : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <img 
                          src={avatar.url} 
                          alt={`${selectedRace.name} avatar ${index + 1}`} 
                          className="w-full h-32 object-cover"
                        />
                        {selectedAvatar === avatar && (
                          <div className="absolute top-1 right-1 bg-yellow-500 rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-900" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedAvatar && (
                  <div className="text-center">
                    <button
                      onClick={() => setCurrentStep('ready')}
                      className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-lg font-medium transition-colors duration-200"
                    >
                      Fortsett
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'ready' && (
              <div className="text-center space-y-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-yellow-600">
                  <h3 className="text-xl text-yellow-400 mb-2">Din karakter</h3>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-gray-400">Navn:</p>
                      <p className="text-yellow-400">{character.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Rase:</p>
                      <p className="text-yellow-400">{selectedRace?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Klasse:</p>
                      <p className="text-yellow-400">{selectedClass?.name}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xl font-medium transition-colors duration-200"
                >
                  Begynn ditt eventyr
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 