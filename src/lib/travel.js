import { supabase } from './supabase';

/**
 * Reisehendelser som kan skje under reise mellom byer
 */
export const travelEvents = [
  {
    id: 1,
    title: 'Landeveisrøvere',
    description: 'Du støter på en gruppe landeveisrøvere som blokkerer veien!',
    choices: [
      { 
        id: 1, 
        text: 'Slåss mot røverne', 
        skill: 'strength',
        difficulty: 8, 
        success: 'Du overvinner røverne og finner noen verdisaker.', 
        failure: 'Du kjemper tappert, men blir såret og mister noen mynter.',
        successReward: { gold: 25, experience: 50, health: 0 },
        failurePenalty: { gold: -15, experience: 10, health: -10 }
      },
      { 
        id: 2, 
        text: 'Prøv å snike deg forbi', 
        skill: 'agility',
        difficulty: 7, 
        success: 'Du sniker deg ubemerket forbi røverne.', 
        failure: 'Du blir oppdaget og må flykte, mister en gjenstand på veien.',
        successReward: { gold: 0, experience: 30, health: 0 },
        failurePenalty: { gold: -5, experience: 10, health: -5, loseItem: true }
      }
    ]
  },
  {
    id: 2,
    title: 'Handelskaravane',
    description: 'Du møter en handelskaravane på vei mot samme by som deg.',
    choices: [
      { 
        id: 1, 
        text: 'Slå følge for beskyttelse', 
        skill: 'magic',
        difficulty: 6, 
        success: 'Karavanen tar deg godt imot, og du lærer mye om handel på reisen.', 
        failure: 'Karavanen er skeptisk og krever betaling for beskyttelse.',
        successReward: { gold: 0, experience: 40, health: 5 },
        failurePenalty: { gold: -10, experience: 5, health: 0 }
      },
      { 
        id: 2, 
        text: 'Forsøk å handle med dem', 
        skill: 'knowledge',
        difficulty: 7, 
        success: 'Du gjør en god handel og får en god pris på varene.', 
        failure: 'Du blir lurt og betaler overpris for middelmådige varer.',
        successReward: { gold: 20, experience: 25, health: 0 },
        failurePenalty: { gold: -15, experience: 10, health: 0 }
      }
    ]
  },
  {
    id: 3,
    title: 'Mystisk reisende',
    description: 'En mystisk tilslørt person ber om å få slå følge med deg.',
    choices: [
      { 
        id: 1, 
        text: 'La personen følge med deg', 
        skill: 'magic',
        difficulty: 8, 
        success: 'Den mystiske reisende deler gammel kunnskap og gir deg en verdifull gave før dere skilles.', 
        failure: 'Den mystiske reisende stjeler fra deg mens du sover!',
        successReward: { gold: 15, experience: 60, health: 0, item: true },
        failurePenalty: { gold: -30, experience: 15, health: 0 }
      },
      { 
        id: 2, 
        text: 'Avvis personen høflig', 
        skill: 'magic',
        difficulty: 5, 
        success: 'Du avviser personen uten å fornærme. Senere møter du personen igjen, som takker for din ærlighet.', 
        failure: 'Personen blir fornærmet og ryktet om din uhøflighet sprer seg til neste by.',
        successReward: { gold: 10, experience: 20, health: 0 },
        failurePenalty: { gold: 0, experience: 5, health: 0, reputation: -5 }
      }
    ]
  },
  {
    id: 4,
    title: 'Uvær på horisonten',
    description: 'Mørke skyer trekker seg sammen, og du hører torden i det fjerne.',
    choices: [
      { 
        id: 1, 
        text: 'Skynd deg for å komme fram før uværet', 
        skill: 'strength',
        difficulty: 7, 
        success: 'Du presser på og når fram akkurat idet de første regndråpene faller.', 
        failure: 'Du blir fanget i uværet og ankommer utmattet og gjennomvåt.',
        successReward: { gold: 0, experience: 30, health: 0 },
        failurePenalty: { gold: 0, experience: 10, health: -15 }
      },
      { 
        id: 2, 
        text: 'Søk ly og vent til uværet passerer', 
        skill: 'knowledge',
        difficulty: 6, 
        success: 'Du finner en trygg hule hvor du kan vente. Der oppdager du noen gamle mynter!', 
        failure: 'Du finner dårlig beskyttelse og blir likevel våt og kald.',
        successReward: { gold: 15, experience: 25, health: 0 },
        failurePenalty: { gold: 0, experience: 10, health: -10 }
      }
    ]
  },
  {
    id: 5,
    title: 'Forlatt leir',
    description: 'Du kommer over en forlatt leir ved veien. Det ser ut til at noen har forlatt stedet i all hast.',
    choices: [
      { 
        id: 1, 
        text: 'Undersøk leiren grundig', 
        skill: 'agility',
        difficulty: 7, 
        success: 'Du finner verdifulle gjenstander som noen har etterlatt!', 
        failure: 'Plutselig dukker eierne opp og anklager deg for tyveri.',
        successReward: { gold: 35, experience: 40, health: 0, item: true },
        failurePenalty: { gold: -20, experience: 10, health: -5 }
      },
      { 
        id: 2, 
        text: 'Gå videre og unngå trøbbel', 
        skill: 'magic',
        difficulty: 5, 
        success: 'Ditt instinkt redder deg. Like etter hører du skrik fra leiren.', 
        failure: 'Du går glipp av verdifulle ressurser, og angrer på beslutningen.',
        successReward: { gold: 0, experience: 20, health: 0 },
        failurePenalty: { gold: 0, experience: 5, health: 0 }
      }
    ]
  }
];

/**
 * Henter en tilfeldig reisehendelse
 */
export const getRandomTravelEvent = () => {
  const randomIndex = Math.floor(Math.random() * travelEvents.length);
  return travelEvents[randomIndex];
};

/**
 * Lagrer en reisehendelse i travel_log tabellen
 */
export const logTravel = async (userId, fromCityId, toCityId, eventId, journalEntry, outcomeSuccess) => {
  try {
    const { data, error } = await supabase
      .from('travel_log')
      .insert({
        user_id: userId,
        from_city_id: fromCityId,
        to_city_id: toCityId,
        event_id: eventId,
        journal_entry: journalEntry,
        outcome_success: outcomeSuccess,
        traveled_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging travel:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error logging travel:', error);
    return false;
  }
};

/**
 * Henter brukerens reiselogg
 */
export const getTravelLog = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('travel_log')
      .select('*, from_city:from_city_id(name), to_city:to_city_id(name)')
      .eq('user_id', userId)
      .order('traveled_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching travel log:', error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching travel log:', error);
    return [];
  }
};

/**
 * Simulerer et terningkast basert på brukerens ferdigheter
 * @param {number} baseSkill - Brukerens basisferdighet
 * @param {number} difficulty - Vanskelighetsgraden for oppgaven
 * @returns {boolean} Om terningkastet var vellykket
 */
export const rollDice = (baseSkill, difficulty) => {
  // Simulerer et d20 terningkast
  const roll = Math.floor(Math.random() * 20) + 1;
  
  // Critical success (naturlig 20) eller critical failure (naturlig 1)
  if (roll === 20) return true;
  if (roll === 1) return false;
  
  // Vanlig terningkast: Hvis roll + skill >= difficulty, er det en suksess
  return (roll + baseSkill) >= difficulty;
};

/**
 * Beregner reisekostnaden mellom to byer
 */
export const calculateTravelCost = (fromCityId, toCityId, cities) => {
  // Finn byene fra cities-arrayet
  const fromCity = cities.find(city => city.id === parseInt(fromCityId));
  const toCity = cities.find(city => city.id === parseInt(toCityId));
  
  if (!fromCity || !toCity) return 10; // Standard kostnad hvis vi ikke finner byene
  
  // Beregn avstand basert på posisjoner (forenklet)
  const distance = Math.sqrt(
    Math.pow(fromCity.x_position - toCity.x_position, 2) + 
    Math.pow(fromCity.y_position - toCity.y_position, 2)
  );
  
  // Konverter avstand til reisekostnad (minimum 5 gull)
  const cost = Math.max(5, Math.floor(distance * 0.5));
  
  return cost;
};

/**
 * Oppdaterer spillerens nåværende byposisjon i databasen og i localStorage som backup
 * @param {string} userId - Brukerens ID
 * @param {number} cityId - ID til byen spilleren befinner seg i
 * @returns {boolean} Om databaseoppdateringen var vellykket
 */
export const updatePlayerLocation = async (userId, cityId) => {
  let databaseSuccess = false;
  
  // Alltid forsøk å lagre i localStorage først for umiddelbar effekt
  try {
    localStorage.setItem(`player_location_${userId}`, JSON.stringify({
      city_id: cityId,
      updated_at: new Date().toISOString()
    }));
    console.log(`Lagret spillerposisjon (by ${cityId}) i localStorage`);
  } catch (localStorageError) {
    console.error('Kunne ikke lagre posisjon i localStorage:', localStorageError);
  }
  
  // Deretter forsøk å lagre i databasen
  try {
    // Sjekk først om det finnes en eksisterende posisjon for denne brukeren
    const { data: existingData, error: existingError } = await supabase
      .from('player_locations')
      .select('*')
      .eq('user_id', userId);
    
    if (existingError) {
      // Feilhåndtering for manglende tabell eller annen databasefeil
      console.error('Feil ved sjekk av eksisterende spillerposisjon:', existingError);
      
      if (existingError.code === '42P01') { // "relation does not exist"
        console.log('player_locations tabell finnes ikke. Fortsetter med localStorage.');
      }
      
      // Vi har allerede lagret i localStorage, så vi kan returnere
      return false;
    }
    
    let result;
    
    // Hvis det finnes en eksisterende rad, oppdater den
    if (existingData && existingData.length > 0) {
      const { data, error } = await supabase
        .from('player_locations')
        .update({ 
          city_id: cityId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      result = { data, error };
    } 
    // Ellers, opprett en ny rad
    else {
      const { data, error } = await supabase
        .from('player_locations')
        .insert({
          user_id: userId,
          city_id: cityId,
          updated_at: new Date().toISOString()
        });
      
      result = { data, error };
    }
    
    if (result.error) {
      console.error('Feil ved oppdatering av spillerposisjon i database:', result.error);
      return false;
    }
    
    console.log(`Spillerposisjon for ${userId} oppdatert til by ${cityId} i database`);
    databaseSuccess = true;
  } catch (error) {
    console.error('Generell feil ved oppdatering av spillerposisjon:', error);
  }
  
  return databaseSuccess;
}; 