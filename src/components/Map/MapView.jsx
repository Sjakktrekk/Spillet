import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import mapImage from '../../assets/map.jpg'
import TravelModal from '../Travel/TravelModal'
import { useAuth } from '../../hooks/useAuth'

export default function MapView() {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState(null)
  const [travelModalOpen, setTravelModalOpen] = useState(false)
  const [playerCity, setPlayerCity] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadCities() {
      // For demo, bruker vi dummy-data i stedet for å hente fra Supabase
      /*
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error loading cities:', error)
        return
      }
      
      console.log('Loaded cities:', data)
      setCities(data)
      */

      // Oppdaterte byer med riktige navn og beskrivelser
      const dummyCities = [
        {
          id: 1,
          name: 'Nordhavn',
          description: 'Et handelssentrum ved kysten. Menneskene er kjent for sin tilpasningsdyktighet og nysgjerrighet. De søker kunnskap og makt.',
          race: 'Mennesker',
          x_position: 28.23,
          y_position: 45.96,
          population: 12500
        },
        {
          id: 2,
          name: 'Eldoria',
          description: 'En skogskledd by skjult blant eldgamle trær. Alvene vokter naturens hemmeligheter og har en sterk tilknytning til magi.',
          race: 'Alver',
          x_position: 22.17,
          y_position: 21.09,
          population: 8200
        },
        {
          id: 3,
          name: 'Tanak-dun',
          description: 'En fjellfestning gravd dypt i Bergrammene. Dvergene er mestere i smedkunst, gruvedrift og gamle runer.',
          race: 'Dverger',
          x_position: 87.27,
          y_position: 12.89,
          population: 7800
        },
        {
          id: 4,
          name: 'Skyggeborg',
          description: 'En tidligere krigsby som nå forsøker å gjenoppbygge sitt rykte. Orkene var en gang under Skyggens kontroll, men søker nå en ny ære.',
          race: 'Orker',
          x_position: 81.08,
          y_position: 72.92,
          population: 9300
        }
      ]
      
      console.log('Loaded cities:', dummyCities)
      setCities(dummyCities)
      setLoading(false)
    }

    loadCities()
    
    // Forsøker å laste brukerens nåværende by-posisjon
    async function loadPlayerLocation() {
      if (!user) return;
      
      try {
        // Først prøver vi å laste fra databasen
        const { data, error } = await supabase
          .from('player_locations')
          .select('city_id')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.log('Feil ved lasting av spillerposisjon fra database, sjekker localStorage');
          
          // Hvis databasespørringen feiler, prøv localStorage som backup
          try {
            const storedLocation = localStorage.getItem(`player_location_${user.id}`);
            if (storedLocation) {
              const parsedLocation = JSON.parse(storedLocation);
              if (parsedLocation && parsedLocation.city_id) {
                const cityId = parsedLocation.city_id;
                console.log(`Fant spillerposisjon i localStorage: By ID ${cityId}`);
                
                const city = cities.find(c => c.id === parseInt(cityId));
                if (city) {
                  setPlayerCity(city);
                  return;
                }
              }
            }
          } catch (localStorageError) {
            console.error('Feil ved lasting fra localStorage:', localStorageError);
          }
          
          // Som siste utvei, bruk standardbyen (Nordhavn)
          console.log('Ingen posisjon funnet, bruker standardby (Nordhavn)');
          setPlayerCity(cities.find(c => c.id === 1) || null);
          return;
        }
        
        if (data) {
          const city = cities.find(c => c.id === data.city_id);
          if (city) {
            setPlayerCity(city);
          } else {
            // Hvis byen ikke finnes i vår liste, bruk standard
            setPlayerCity(cities.find(c => c.id === 1) || null);
          }
        }
      } catch (error) {
        console.error('Error loading player location:', error);
        setPlayerCity(cities.find(c => c.id === 1) || null);
      }
    }
    
    if (user) {
      loadPlayerLocation();
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-300">Laster kart...</div>
      </div>
    )
  }

  const handleCityClick = (city) => {
    setSelectedCity(city)
  }

  const handleCloseInfo = () => {
    setSelectedCity(null)
  }

  const handleTravel = () => {
    if (!selectedCity) return;
    
    // Åpne reisemodulen i stedet for direkte navigasjon
    setTravelModalOpen(true);
  }
  
  const handleCloseTravelModal = () => {
    setTravelModalOpen(false);
    // Ikke fjern den valgte byen når modalen lukkes
  }

  return (
    <div className="relative w-full h-full">
      <img 
        src={mapImage} 
        alt="Fantasy World Map" 
        className="w-full h-full object-cover opacity-90"
        onError={(e) => {
          console.error('Feil ved lasting av kartbilde');
          e.target.style.display = 'none';
        }}
      />
      
      {cities.map((city) => (
        <div
          key={city.id}
          className="absolute cursor-pointer group"
          style={{
            left: `${city.x_position}%`,
            top: `${city.y_position}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => handleCityClick(city)}
        >
          {/* Usynlig klikkbar sone med zoom-effekt */}
          <div className={`w-[150px] h-[150px] rounded-full transition-all duration-300 ease-in-out transform relative ${
            playerCity && playerCity.id === city.id 
              ? 'opacity-100 scale-150' 
              : 'opacity-0 group-hover:opacity-100 group-hover:scale-150'
          }`}>
            {/* Kul effekt - glødende ring med flere lag */}
            <div className="absolute inset-4 rounded-full border-4 border-yellow-500/30 animate-pulse"></div>
            <div className="absolute inset-8 rounded-full border-4 border-yellow-500/20 animate-pulse delay-75"></div>
            <div className="absolute inset-12 rounded-full border-4 border-yellow-500/10 animate-pulse delay-150"></div>
            
            {/* Sentral glødende effekt */}
            <div className="absolute inset-1/4 rounded-full bg-yellow-500/20 animate-pulse"></div>
            
            {/* Radiant effekt */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 animate-spin-slow"></div>
          </div>

          {/* Byinformasjon som vises kun ved hover på andre byer */}
          {(!playerCity || playerCity.id !== city.id) && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-6 px-4 py-3 bg-gray-800/95 border-2 border-yellow-500 rounded-lg shadow-lg transition-all duration-300 min-w-[250px] pointer-events-none backdrop-blur-sm opacity-0 group-hover:opacity-100">
              <h3 className="font-bold text-yellow-400 text-lg mb-2">{city.name}</h3>
              <p className="text-sm text-gray-300">{city.description}</p>
            </div>
          )}
        </div>
      ))}

      {/* Modal for byinformasjon */}
      {selectedCity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg border border-yellow-500 max-w-md w-full p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-xl font-bold text-yellow-400">{selectedCity.name}</h2>
                <div className="text-sm text-yellow-300 opacity-75">{selectedCity.race}s hjemby</div>
              </div>
              <button
                onClick={handleCloseInfo}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-300 mb-4">{selectedCity.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <h4 className="font-semibold text-yellow-400 mb-1">Tjenester:</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>🏪 Markedsplass</li>
                  <li>🏰 Inn</li>
                  <li>⚔️ Smie</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-400 mb-1">Oppdrag:</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>📜 Byens voktere (Nivå 1)</li>
                  <li>📜 Savnet leveranse (Nivå 2)</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleTravel}
                disabled={playerCity && playerCity.id === selectedCity.id}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  playerCity && playerCity.id === selectedCity.id
                    ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
              >
                {playerCity && playerCity.id === selectedCity.id ? 'Du er her' : 'Reis hit'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reisemodal */}
      <TravelModal 
        isOpen={travelModalOpen}
        onClose={handleCloseTravelModal}
        fromCity={playerCity}
        toCity={selectedCity}
        cities={cities}
      />
    </div>
  )
} 