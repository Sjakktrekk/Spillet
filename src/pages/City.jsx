import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import useAchievementTracker from '../hooks/useAchievementTracker'
import nordvikBakgrunn from '../assets/nordvik.jpg'
import backgroundImage from '../assets/background.jpg'
import mapImage from '../assets/map.jpg'
import tanakDunBakgrunn from '../assets/tanak-dun.jpg'
import eldoriaBakgrunn from '../assets/Eldoria.jpg'
import skyggeborgBakgrunn from '../assets/skyggeborg.jpg'
import { updatePlayerLocation } from '../lib/travel'

export default function City() {
  const { cityId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [city, setCity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('oversikt')
  const [playerLocation, setPlayerLocation] = useState(null)
  const [availableQuests, setAvailableQuests] = useState([])
  const achievementTracker = useAchievementTracker()
  const cityLoadAttemptedRef = useRef(false);
  const userAnnouncedRef = useRef(false);
  
  // Hjelpefunksjon for å alltid sikre at lokasjon blir lagret
  const updatePlayerLocationSafely = async (userId, newCityId) => {
    try {
      // Prøv først databaselagring
      const success = await updatePlayerLocation(userId, newCityId);
      
      // Uansett hva som skjer med databasen, lagre i localStorage for sikkerhetsskyld
      localStorage.setItem(`player_location_${userId}`, JSON.stringify({
        city_id: newCityId,
        updated_at: new Date().toISOString()
      }));
      
      return success;
    } catch (error) {
      console.error('Kunne ikke oppdatere brukerposisjon:', error);
      
      // Alltid lagre i localStorage som fallback
      localStorage.setItem(`player_location_${userId}`, JSON.stringify({
        city_id: newCityId,
        updated_at: new Date().toISOString()
      }));
      return false;
    }
  };
  
  // Definer loadPlayerLocation funksjonen utenfor useEffect
  async function loadPlayerLocation() {
    try {
      // Prøv å hente fra localStorage først for raskest mulig respons
      const storedLocation = localStorage.getItem(`player_location_${user.id}`);
      let currentCityId = null;
      
      if (storedLocation) {
        try {
          const parsedLocation = JSON.parse(storedLocation);
          if (parsedLocation && parsedLocation.city_id) {
            currentCityId = parsedLocation.city_id;
            
            // Hvis vi er allerede i riktig by, trenger vi ikke gjøre mer
            if (currentCityId.toString() === cityId.toString()) {
              console.log('Bruker lagret posisjon fra localStorage - allerede i riktig by');
              return;
            }
          }
        } catch (parseError) {
          console.error('Feil ved parsing av lagret posisjon:', parseError);
        }
      }
      
      // Prøv å hente fra databasen som en bakgrunnsoperasjon
      try {
        const { data, error } = await supabase
          .from('player_locations')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // Hvis ingen feil, men byene er forskjellige, oppdater
        if (!error && data && data.city_id.toString() !== cityId.toString()) {
          console.log(`Oppdaterer brukerposisjon fra ${data.city_id} til ${cityId}`);
          await updatePlayerLocationSafely(user.id, cityId);
        } 
        // Hvis feil, oppdater uansett
        else if (error) {
          console.log('Ingen eksisterende brukerposisjon funnet i database, oppdaterer');
          await updatePlayerLocationSafely(user.id, cityId);
        }
      } catch (dbError) {
        // Hvis databasetilgang feiler, sikre at vi lagrer i localStorage
        console.error('Databasefeil ved brukerposisjonshåndtering:', dbError);
        localStorage.setItem(`player_location_${user.id}`, JSON.stringify({
          city_id: cityId,
          updated_at: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Kunne ikke håndtere brukerposisjon:', error);
      // Siste utvei - lagre i localStorage
      try {
        localStorage.setItem(`player_location_${user.id}`, JSON.stringify({
          city_id: cityId,
          updated_at: new Date().toISOString()
        }));
        console.log('Lagret posisjon i localStorage som siste utvei');
      } catch (localStorageError) {
        console.error('Kritisk feil - kunne ikke lagre i localStorage heller:', localStorageError);
      }
    }
  }
  
  // Laster inn byen fra Supabase
  useEffect(() => {
    let isMounted = true;
    
    // Forhindre gjentakelse av byinnlasting
    if (cityLoadAttemptedRef.current) return;
    cityLoadAttemptedRef.current = true;
    
    async function loadCity() {
      if (!cityId) return
      
      try {
        // Sett dummy-data med en gang slik at vi har noe å vise mens vi laster
        const dummyCity = getDummyCityData(parseInt(cityId) || 1);
        setCity(dummyCity); // Sett dummy-data umiddelbart
        setLoading(false); // Fjern lasteskjerm
        
        // Prøv å laste direkte fra localStorage først hvis tilgjengelig
        const cachedCity = localStorage.getItem(`city_${cityId}`);
        if (cachedCity) {
          try {
            const cityData = JSON.parse(cachedCity);
            if (isMounted) {
              setCity(cityData);
            }
          } catch (err) {
            console.log('Feil ved parsing av cachet by-data');
          }
        }
        
        try {
          // Forsøk å laste fra API, men brukeren venter ikke på dette
          console.log(`Forsøker å laste by ${cityId} fra API i bakgrunnen`);
          const { data, error } = await supabase
            .from('cities')
            .select('*')
            .eq('id', cityId)
            .maybeSingle();
          
          if (error) {
            console.log('Error from Supabase:', error);
            return; // Vi har allerede satt dummy-data, så vi fortsetter bare
          }
          
          if (!data) {
            console.log('Ingen data returnert fra API');
            return; // Vi har allerede satt dummy-data, så vi fortsetter bare
          }
          
          if (isMounted) {
            // Oppdater med faktisk data hvis vi fikk den
            setCity(data);
            
            // Lagre til localStorage for fremtiden
            localStorage.setItem(`city_${cityId}`, JSON.stringify(data));
            
            // Oppdater achievement tracker med den besøkte byen
            if (data && data.name) {
              try {
                achievementTracker.visitCity(data.name);
              } catch (err) {
                console.log('Kunne ikke oppdatere achievement');
              }
            }
          }
        } catch (error) {
          console.log('Error loading city from API:', error);
          // Vi har allerede satt dummy-data, så vi fortsetter bare
        }
      } catch (error) {
        console.error('Uventet feil ved lasting av by:', error);
        fallbackToLocalData();
      }
    }
    
    function fallbackToLocalData() {
      // Bruk dummy-data når API-kallet feiler
      console.log(`Bruker dummy-data for by ${cityId}`);
      const dummyCity = getDummyCityData(parseInt(cityId) || 1); // Forsikre oss om at ID er et tall
      
      if (isMounted) {
        setCity(dummyCity);
        setLoading(false);
        
        // Lagre til localStorage for raskere tilgang neste gang
        try {
          localStorage.setItem(`city_${cityId}`, JSON.stringify(dummyCity));
        } catch (err) {
          console.log('Kunne ikke lagre by til localStorage');
        }
        
        // Oppdater achievement tracker med dummy byen
        if (dummyCity && dummyCity.name) {
          try {
            achievementTracker.visitCity(dummyCity.name);
          } catch (err) {
            console.log('Kunne ikke oppdatere achievement');
          }
        }
      }
    }
    
    if (!authLoading) {
      loadCity();
      if (user) {
        // Bare forsøk å laste player location én gang
        loadPlayerLocation();
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [cityId, navigate, user, authLoading, achievementTracker]);
  
  // Beskjed til chatboksen om at brukeren har ankommet byen - separat effekt
  useEffect(() => {
    // Forhindre gjentakelse av meldingsutsendelse
    if (!city || !user || userAnnouncedRef.current) return;
    
    userAnnouncedRef.current = true;
    
    // I en full implementering ville dette ha sendt en beskjed til chatboksen
    console.log(`${user.email} har ankommet ${city.name}`);
    // Her ville vi også ha trigget en hendelse i spillet
  }, [city, user]);
  
  // Last spillerens nåværende posisjon og oppdater databasen
  useEffect(() => {
    if (!user) return;

    console.log('Laster brukerposisjon i bakgrunnen');
    
    loadPlayerLocation();
  }, [user, cityId]);
  
  // Hent tilgjengelige oppdrag for byen
  useEffect(() => {
    async function fetchQuests() {
      if (!cityId || !city) return;
      
      try {
        // Hent oppdrag som matcher byens navn
        const { data, error } = await supabase
          .from('quests')
          .select('*')
          .eq('location', city.name)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching quests:', error);
          return;
        }

        setAvailableQuests(data || []);
      } catch (error) {
        console.error('Error in fetchQuests:', error);
      }
    }

    if (cityId && city) {
      fetchQuests();
    }
  }, [cityId, city]);
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Ankommer {city?.name || 'by'}...</div>
        </div>
      </div>
    )
  }
  
  // Fjern dummy-data for tjenester og oppdrag
  const services = [
    { id: 1, name: 'Markedsplass', icon: '🏪', description: 'Kjøp og selg varer med lokale handelsmenn.', path: '/shop/' + cityId },
    { id: 2, name: 'Inn', icon: '🏰', description: 'Hvil deg og få tilbake energi.' },
    { id: 3, name: 'Smie', icon: '⚔️', description: 'Oppgrader og reparer våpen og rustning.' }
  ]
  
  const handleTravelBack = () => {
    navigate('/home')
  }
  
  // Hjelpefunksjon for å generere dummy-bydata
  function getDummyCityData(id) {
    const cityId = parseInt(id)
    const cities = {
      1: {
        id: 1,
        name: 'Nordhavn',
        description: `Nordhavn – Porten mot verden

Nordhavn er en stolt og livlig by som ligger helt ytterst mot det åpne havet. Her møtes skip fra fjerne land, og vinden fra nord blåser gjennom gatene fulle av liv, lukten av sjø og lyden av hammerslag og latter. Byen er kjent for sine modige sjømenn, flinke håndverkere og vise ledere.

Nordhavn ble bygget av mennesker som ønsket å utforske verden – ikke bare med sverd og styrke, men med kunnskap, handel og nysgjerrighet. Byen vokste raskt fordi den ligger perfekt til for både reiser og beskyttelse. Med sterke murer og våkne vakter har den stått imot både stormer og fiender.

## Hva er spesielt med Nordhavn? ##

Byen har en stor havneport som aldri stenger, og her lastes varer fra både alver, dverger og fjerne riker.

Nordhavn har mange lærde, oppdagere og kapteiner som samler historier og kunnskap fra hele verden.

Midt i byen står Lysfestningen, en høy bygning med et magisk fyrtårn som lyser både natt og dag for å lede skip trygt hjem.

## Historie og rykter ##

Det sies at under havnebrygga finnes eldgamle kart som viser hemmelige øyer og skjulte steder. Noen tror også at fyrtårnet i Lysfestningen er mer enn bare et lys – at det skjuler en kraft som har holdt byen trygg i hundrevis av år.

## Hvordan er folk i Nordhavn? ##

Folk her er åpne, hjelpsomme og alltid klare for et nytt eventyr. De liker å høre historier, lære nye ting og finne smarte løsninger. De fleste er ikke redd for hardt arbeid – og de vet at både klokskap og samarbeid er like viktig som styrke.`,
        population: 12500,
        race: 'Mennesker',
        history: 'Nordhavn ble grunnlagt for over 800 år siden av sjøfarere og har vokst til å bli det største handelssentrumet i regionen. Byen har alltid vært et smeltepunkt for ulike ideer og kulturer.'
      },
      2: {
        id: 2,
        name: 'Eldoria',
        description: `Eldoria – Alvenes lysende hjem

Dypt inne i den grønne, levende skogen ligger Eldoria, en by bygget av alver i harmoni med naturen. Eldoria er kjent for å være en av de vakreste og mest fredelige byene i hele riket. Trærne her er så gamle at ingen husker når de ble plantet, og de høyeste trærne er faktisk en del av byen – med trapper, broer og hus bygget oppe i greinene.

Eldoria ble grunnlagt av alver for mange tusen år siden, og det sies at byen lyser om natten – som om månen selv bor der. Lysene kommer fra spesielle blomster og krystaller som vokser i skogen og sender ut et svakt, magisk skinn.

## Hva er spesielt med Eldoria? ##

Eldoria er full av magiske steder, som fortryllede innsjøer, glitrende stier og trær som hvisker når du går forbi.

Alvene her er eksperter på magi, bueskyting og helbredelse.

Mange reiser til Eldoria for å lære mer om naturens hemmeligheter – og noen håper å møte en fe eller ånd.

## Historie og rykter ##

Noen sier at det skjuler seg en eldgammel kraft i Eldorias skog, og at bare de renhjertede kan finne veien til Livets Lys, en magisk flamme som beskytter byen. Det går også rykter om at skogen kan flytte på seg – slik at ingen fiender noen gang finner byen om de ikke er invitert.

## Hvordan er folk i Eldoria? ##

Alvene i Eldoria er kloke, vennlige og veldig flinke til å lytte. De snakker gjerne i gåter og elsker vakre ting som musikk, dikt og natur. Selv om de er rolige og fredelige, er de sterke beskyttere av skogen sin, og de gir seg aldri hvis noen prøver å ødelegge balansen i naturen.`,
        population: 8200,
        race: 'Alver',
        history: 'Eldoria har eksistert siden tidenes morgen, lenge før menneskene ankom kontinentet. Alvene har levd i harmoni med skogen i tusenvis av år, og har utviklet en dyp forståelse for naturens krefter.'
      },
      3: {
        id: 3,
        name: 'Tanak-dun',
        description: `Tanak-Dun – Byen under fjellet

Langt inne i de mørke fjellene ligger Tanak-Dun, en gammel by bygget av dverger for mange hundre år siden. Tanak-Dun ble først grunnlagt fordi fjellet rundt byen var rik på gull, sølv og andre dyrebare skatter. Dvergene, som er kjent for å være sterke og flinke til å bygge, gravde dype ganger inn i fjellet og fant store rikdommer.

Byen er bygget nesten helt av stein. Store steinsøyler holder taket oppe, og det glitrer fra edelstener som er satt inn i veggene. Midt i byen står det en enorm statue av Grunmarr, den aller første kongen av Tanak-Dun, som sies å ha funnet den første gullåren her.

## Hva er spesielt med Tanak-Dun? ##

Byen er kjent for sine smeder, som lager de sterkeste våpnene og de vakreste smykkene i hele verden.

Mange reiser hit for å handle på markedet, der det selges alt fra magiske ringer til rustninger som aldri ruster.

Tanak-Dun har også hemmelige tunneler som bare dvergene kjenner til. Disse brukes for å komme seg raskt rundt – eller for å rømme om byen noen gang skulle bli angrepet.

## Historie og rykter ##

Det sies at under den eldste delen av byen ligger det en skjult skatt som bare kan finnes av den som er modig nok til å løse de gamle dvergenes gåter. Noen sier også at en sovende drage vokter de innerste kamrene, men ingen vet sikkert om det er sant...

## Hvordan er folk i Tanak-Dun? ##

Dvergene i Tanak-Dun er stolte, modige og jobber hardt. De elsker historier om heltemot, og om kvelden samles de ofte i store haller for å fortelle eventyr, synge gamle sanger og spise solide måltider med kjøtt, brød og ost.`,
        population: 7800,
        race: 'Dverger',
        history: 'Tanak-dun ble grunnlagt for over 2000 år siden da dvergene først begynte å utforske de rike åreprøvene i Bergrammene. Deres smie-teknikker er legendariske og deres runemagi er unik i verden.'
      },
      4: {
        id: 4,
        name: 'Skyggeborg',
        description: `Skyggeborg – Orkenes hjem

Skyggeborg er en imponerende by bygget i fjellene, hjemmet til orkene. Byen ble grunnlagt for mange generasjoner siden som en krigsby, men har gjennomgått store forandringer de siste 50 årene.

Byen er bygget med massive steinmurer og tårn som strekker seg mot himmelen. Midt i byen står det en stor arena hvor orkene holder sine tradisjonelle kampsporter og feiringer.

## Hva er spesielt med Skyggeborg? ##

Byen er kjent for sin krigskunst og overlevelse. Her finner du noen av de beste krigerne og jegerne i verden.

Mange reiser hit for å lære kampkunst og overlevelsesferdigheter fra orkenes mestere.

Skyggeborg har også en stor markedsplass hvor orkene selger sine håndverk og varer.

## Historie og rykter ##

Det sies at under arenaen ligger det en gammel krigers grav. Noen sier at han vokter en kraftig artefakt som kan gi uovervinnelig styrke, men ingen har funnet den ennå...

## Hvordan er folk i Skyggeborg? ##

Orkene i Skyggeborg er stolte og sterke. De var en gang under Skyggens kontroll, men for 50 år siden brøt de fri og begynte sin lange reise mot å gjenopprette sin ære. De søker nå en ny ære og en plass i verden, og har utviklet en sterk kultur basert på ære, styrke og fellesskap.`,
        population: 9300,
        race: 'Orker',
        history: 'I generasjoner var Skyggeborg sentrum for den mørke hæren, men for 50 år siden brøt orkene fri fra Skyggens grep og begynte sin lange reise mot å gjenopprette sin ære og finne sin plass i verden.'
      }
    }
    
    return cities[cityId] || {
      id: cityId,
      name: `By #${cityId}`,
      description: 'En mystisk by som få har hørt om.',
      population: 1000 + Math.floor(Math.random() * 10000),
      race: 'Ukjent',
      history: 'Historien til denne byen er ukjent og venter på å bli oppdaget.'
    }
  }
  
  // Hjelpefunksjon for å få riktig bakgrunnsbilde basert på by-ID
  const getBackgroundImage = () => {
    if (!city) return backgroundImage;
    
    // Velg bakgrunnsbilde basert på by-ID
    switch(parseInt(city.id)) {
      case 1:
        return nordvikBakgrunn; // Bruker Nordvik-bildet for Nordhavn (mennesker)
      case 2:
        return eldoriaBakgrunn; // Eldoria (alver)
      case 3:
        return tanakDunBakgrunn; // Tanak-dun (dverger)
      case 4:
        return skyggeborgBakgrunn; // Skyggeborg (orker)
      default:
        return backgroundImage;
    }
  };
  
  return (
    <div 
      className="min-h-screen text-white p-6"
      style={{
        backgroundImage: `url(${getBackgroundImage()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: 'rgba(0,0,0,0.7)',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* By header med informasjon og tilbake-knapp */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 bg-gray-800 bg-opacity-90 rounded-lg p-6 border border-gray-700 shadow-lg">
          <div>
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 bg-yellow-700 rounded-full border-4 border-yellow-600 flex items-center justify-center text-3xl mr-6">
                {city.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-yellow-500">{city.name}</h1>
                <div className="text-gray-300 mt-1">
                  <span className="text-yellow-400">{city.race || 'Ukjent rase'}</span> • Befolkning: ~{(city.population || 1000).toLocaleString()} innbyggere
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleTravelBack}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors flex items-center"
          >
            <span className="mr-2">🗺️</span>
            Tilbake til verdenskartet
          </button>
        </div>
        
        {/* Ny struktur med to hovedkolonner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Venstre kolonne - by informasjon og tabs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Beskrivelse av byen */}
            <div className="bg-gray-800 bg-opacity-90 rounded-lg p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">Om {city.name}</h2>
              <div className="text-gray-300 whitespace-pre-line">
                {city.description.split('\n').map((line, index) => {
                  if (line.startsWith('## ') && line.endsWith(' ##')) {
                    return (
                      <h3 key={index} className="text-lg font-bold text-yellow-400 mt-4 mb-2">
                        {line.replace(/##/g, '').trim()}
                      </h3>
                    );
                  }
                  return <p key={index}>{line}</p>;
                })}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="bg-gray-800 bg-opacity-90 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
              <div className="flex border-b border-gray-700 bg-gray-800 bg-opacity-80 px-2 pt-2">
                <button 
                  onClick={() => setActiveTab('oversikt')}
                  className={`${
                    activeTab === 'oversikt' 
                      ? 'border-yellow-500 text-yellow-500' 
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-400'
                  } flex items-center px-4 py-2 border-b-2 font-medium text-sm`}
                >
                  <span className="mr-2">🏙️</span>
                  Oversikt
                </button>
                <button 
                  onClick={() => setActiveTab('tjenester')}
                  className={`${
                    activeTab === 'tjenester' 
                      ? 'border-yellow-500 text-yellow-500' 
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-400'
                  } flex items-center px-4 py-2 border-b-2 font-medium text-sm`}
                >
                  <span className="mr-2">🏪</span>
                  Tjenester
                </button>
                <button 
                  onClick={() => setActiveTab('oppdrag')}
                  className={`${
                    activeTab === 'oppdrag' 
                      ? 'border-yellow-500 text-yellow-500' 
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-400'
                  } flex items-center px-4 py-2 border-b-2 font-medium text-sm`}
                >
                  <span className="mr-2">📜</span>
                  Oppdrag
                </button>
              </div>
              
              {/* Tab innhold */}
              <div className="p-6">
                {activeTab === 'oversikt' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-yellow-500 mb-4">Byens historie</h2>
                      <p className="text-gray-300 mb-4">
                        {city.history || `${city.name} har en rik historie som strekker seg tilbake mange hundre år. Byen ble grunnlagt av handelsmenn som så verdien i dette strategiske området.`}
                      </p>
                      <p className="text-gray-300">
                        I dag er byen kjent for sin livlige markedsplass og dyktige håndverkere.
                      </p>
                    </div>
                    
                    <div>
                      <h2 className="text-xl font-bold text-yellow-500 mb-4">Aktiviteter</h2>
                      
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="bg-gray-700 p-2 rounded-lg mr-3">🏪</div>
                          <div>
                            <h3 className="font-semibold">Handel</h3>
                            <p className="text-sm text-gray-300">Utforsk markedsplassen og kjøp eller selg varer med lokale handelsmenn.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-gray-700 p-2 rounded-lg mr-3">⚔️</div>
                          <div>
                            <h3 className="font-semibold">Trening</h3>
                            <p className="text-sm text-gray-300">Tren dine ferdigheter med lokale mestere.</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-gray-700 p-2 rounded-lg mr-3">📜</div>
                          <div>
                            <h3 className="font-semibold">Oppdrag</h3>
                            <p className="text-sm text-gray-300">Hjelp byens innbyggere med deres problemer og tjen belønninger.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'tjenester' && (
                  <div className="grid grid-cols-1 gap-6">
                    {services.map(service => (
                      <div key={service.id} className="bg-gray-700 bg-opacity-70 rounded-lg p-6 border border-gray-600 hover:border-yellow-600 transition-colors">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-2xl mr-4">
                            {service.icon}
                          </div>
                          <h3 className="text-xl font-bold text-yellow-400">{service.name}</h3>
                        </div>
                        
                        <p className="text-gray-300 mb-4">{service.description}</p>
                        
                        {service.path ? (
                          <button 
                            onClick={() => navigate(service.path)}
                            className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                          >
                            Besøk {service.name.toLowerCase()}
                          </button>
                        ) : (
                          <button className="w-full py-2 bg-gray-700 text-gray-400 rounded-md cursor-not-allowed">
                            Kommer snart
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'oppdrag' && (
                  <div className="space-y-4">
                    {availableQuests.map(quest => (
                      <div key={quest.id} className="bg-gray-700 bg-opacity-70 rounded-lg p-5 border border-gray-600">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-yellow-400">{quest.title}</h3>
                            <div className="text-sm text-gray-400 mb-3">Nivå {quest.level} oppdrag</div>
                          </div>
                          <div className="bg-yellow-900 text-yellow-300 px-3 py-1 rounded-full text-xs font-medium">
                            Belønning: {quest.reward_gold} gull, {quest.reward_xp} XP
                          </div>
                        </div>
                        <p className="text-gray-300 mb-4">{quest.description}</p>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => navigate(`/quests/${quest.id}`)}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                          >
                            Se oppdrag
                          </button>
                        </div>
                      </div>
                    ))}
                    {availableQuests.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        Ingen tilgjengelige oppdrag i denne byen for øyeblikket.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Høyre kolonne - bybilde i stedet for chat */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 bg-opacity-90 rounded-lg border border-gray-700 shadow-lg overflow-hidden h-full">
              <h2 className="text-xl font-bold text-yellow-500 p-4 border-b border-gray-700">
                Bybilde: {city.name}
              </h2>
              
              <div className="p-4">
                {/* Her viser vi et stort bilde av byen */}
                <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden border-2 border-gray-600 mb-4">
                  <img 
                    src={getBackgroundImage()} 
                    alt={`Bilde av ${city.name}`} 
                    className="object-cover w-full h-full"
                  />
                </div>
                
                {/* Informasjon om byen under bildet */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-yellow-400 text-lg">Herskere</h3>
                    <p className="text-gray-300 text-sm">
                      {city.id === 1 && "Høykongen Eirik den Rettferdige"}
                      {city.id === 2 && "Eldrerådet ledet av Eleniel Stjerneblikk"}
                      {city.id === 3 && "Trongrevekongen Thurin Jarnfot"}
                      {city.id === 4 && "Høvding Grulag den Vise"}
                      {!city.id && "Ukjent"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-yellow-400 text-lg">Kjent for</h3>
                    <p className="text-gray-300 text-sm">
                      {city.id === 1 && "Skipsfart, handel og diplomatiske forbindelser"}
                      {city.id === 2 && "Magi, visdom og helbredende kunster"}
                      {city.id === 3 && "Smedkunst, gruvedrift og runemagi"}
                      {city.id === 4 && "Krigskunst, overlevelse og sterk kultur"}
                      {!city.id && "Ukjent"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-yellow-400 text-lg">Lokal spesialitet</h3>
                    <p className="text-gray-300 text-sm">
                      {city.id === 1 && "Havnefestens mjød - brygg med honning fra de kongelige bier"}
                      {city.id === 2 && "Månelys nektar - en drikk som gløder svakt i mørket"}
                      {city.id === 3 && "Bergrammens sterke øl - brygget med vann fra underjordiske kilder"}
                      {city.id === 4 && "Orkisk ildvann - en kraftig drikk som varmer gjennom hele kroppen"}
                      {!city.id && "Ukjent"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 