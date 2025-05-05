import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getRaces, getClasses, createCharacter, getAvatars, addStartingEquipment, deleteCharacter } from '../lib/characterData'
import { supabase } from '../lib/supabase'

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

  const [character, setCharacter] = useState({
    name: '',
    race_id: '',
    class_id: '',
    avatar_url: '',
  })

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
      
      // Legg til startutstyr til den nye karakteren
      await addStartingEquipment(createdCharacter.id, parseInt(character.class_id))
      
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
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url("https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1920")',
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
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url("https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=1920")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-24 h-24 mb-6 bg-contain bg-center bg-no-repeat" 
          style={{ backgroundImage: 'url("https://static.vecteezy.com/system/resources/previews/009/664/031/original/shield-with-sword-game-icon-free-vector.jpg")' }}>
        </div>
        <h1 className="text-5xl font-extrabold text-center text-yellow-500 mb-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          Karakterskaping
        </h1>
        <h2 className="text-xl text-center text-gray-300 mb-8 italic drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
          Velg din skjebne i den magiske verdenen
        </h2>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="relative bg-gray-900 bg-opacity-80 py-8 px-6 rounded-lg sm:px-10 border-2 border-yellow-700 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
          {/* Dekorative hjørner */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-yellow-600"></div>
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-yellow-600"></div>
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-yellow-600"></div>
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-yellow-600"></div>
          
          {error && (
            <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {hasExistingCharacter ? (
            <div className="text-center py-6">
              <div className="text-yellow-500 mb-2 text-xl font-bold">Du har allerede en karakter</div>
              <p className="text-gray-300 mb-6">
                Du har allerede opprettet karakteren <span className="text-yellow-400 font-semibold">{hasExistingCharacter.name}</span>.
                I denne versjonen kan hver bruker kun ha én karakter.
              </p>

              {deleteConfirmation ? (
                <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-600 mb-6">
                  <p className="text-white mb-4">Er du sikker på at du vil slette din eksisterende karakter? Dette kan ikke angres.</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleDeleteCharacter}
                      disabled={deletingCharacter}
                      className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md ${deletingCharacter ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {deletingCharacter ? 'Sletter...' : 'Ja, slett karakter'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmation(false)}
                      disabled={deletingCharacter}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => setDeleteConfirmation(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                  >
                    Slett eksisterende karakter
                  </button>
                  <button
                    onClick={() => navigate('/home')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Gå tilbake til spillet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-yellow-500 mb-1">
                  Karakternavn
                </label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                  className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-500 mb-1">
                    Rase
                  </label>
                  <select
                    value={character.race_id}
                    onChange={(e) => setCharacter({ 
                      ...character, 
                      race_id: e.target.value ? parseInt(e.target.value) : '' 
                    })}
                    className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  >
                    <option value="">Velg rase</option>
                    {races.map((race) => (
                      <option key={race.id} value={race.id}>
                        {race.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-500 mb-1">
                    Klasse
                  </label>
                  <select
                    value={character.class_id}
                    onChange={(e) => setCharacter({ 
                      ...character, 
                      class_id: e.target.value ? parseInt(e.target.value) : '' 
                    })}
                    className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  >
                    <option value="">Velg klasse</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Avatar velger */}
              {selectedRace && (
                <div className="mt-4 border-t border-gray-700 pt-6">
                  <label className="block text-sm font-medium text-yellow-500 mb-3">
                    Velg Avatar
                  </label>
                  
                  {avatars.length > 0 ? (
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
                  ) : (
                    <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
                      <p className="text-gray-400">Ingen avatarer tilgjengelig for valgt rase</p>
                    </div>
                  )}
                </div>
              )}

              {/* Viser attributter for valgt rase og klasse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 border-t border-gray-700 pt-6">
                {selectedRace && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center text-xl mr-3">
                        {selectedRace.icon || '👤'}
                      </div>
                      <h3 className="text-lg font-medium text-yellow-400">{selectedRace.name}</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{selectedRace.description || 'Ingen beskrivelse tilgjengelig'}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-400">Styrke:</div>
                      <div className="text-right text-green-400">+{selectedRace.strength_bonus || 0}</div>
                      <div className="text-gray-400">Kunnskap:</div>
                      <div className="text-right text-green-400">+{selectedRace.knowledge_bonus || 0}</div>
                      <div className="text-gray-400">List:</div>
                      <div className="text-right text-green-400">+{selectedRace.agility_bonus || 0}</div>
                      <div className="text-gray-400">Innsikt:</div>
                      <div className="text-right text-green-400">+{selectedRace.magic_bonus || 0}</div>
                    </div>
                  </div>
                )}

                {selectedClass && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center text-xl mr-3">
                        {selectedClass.icon || '⚔️'}
                      </div>
                      <h3 className="text-lg font-medium text-yellow-400">{selectedClass.name}</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{selectedClass.description || 'Ingen beskrivelse tilgjengelig'}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-400">Startmynt:</div>
                      <div className="text-right text-yellow-400">{selectedClass.starting_coins || 0} gull</div>
                      <div className="text-gray-400">Hovedattributt:</div>
                      <div className="text-right text-blue-400">{selectedClass.primary_attribute || 'Ukjent'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-gray-900 bg-yellow-600 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
                >
                  Begynn ditt eventyr
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 