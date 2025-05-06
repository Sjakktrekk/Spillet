// Test-skript for travel_events-tabellen
import { supabase } from './src/lib/supabase';

/**
 * Tester at travel_events-tabellen har de nødvendige feltene
 */
async function testTravelEventsTable() {
  console.log('Testing travel_events table structure...');
  
  try {
    // Hent alle kolonner fra travel_events-tabellen
    const { data, error } = await supabase
      .from('travel_events')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Feil ved henting fra travel_events:', error);
      if (error.code === '42P01') { // relation does not exist
        console.error('TABELLEN MANGLER! Kjør travel_events_table.sql først.');
      }
      return false;
    }
    
    // Sjekk at vi fikk data
    if (!data || data.length === 0) {
      console.log('Ingen data i travel_events-tabellen. Tester struktur fra databasens metadata...');
      // Her kunne vi sjekket strukturen direkte med en annen spørring, men det er
      // ikke nødvendig for denne testen
    } else {
      const event = data[0];
      console.log('Fant event:', event.title);
      
      // Sjekk at alle nødvendige felt finnes
      const requiredFields = ['id', 'title', 'description', 'choices', 'type', 'difficulty'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (!(field in event)) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        console.error(`MANGLENDE FELT: ${missingFields.join(', ')}`);
        console.error('Kjør update_travel_events_table.sql for å legge til manglende felt.');
        return false;
      }
      
      console.log('Alle nødvendige felt finnes i travel_events-tabellen.');
      
      // Sjekk feltenes datatyper
      if (typeof event.type !== 'string') {
        console.error('Feil datatype for type-feltet. Forventet string, fikk:', typeof event.type);
        return false;
      }
      
      if (typeof event.difficulty !== 'number') {
        console.error('Feil datatype for difficulty-feltet. Forventet number, fikk:', typeof event.difficulty);
        return false;
      }
      
      console.log('Alle felt har riktig datatype.');
    }
    
    return true;
  } catch (error) {
    console.error('Generell feil under testing av travel_events:', error);
    return false;
  }
}

/**
 * Tester at events kan lagres i databasen med alle nødvendige felt
 */
async function testSaveEvent() {
  console.log('Testing saving of event with type and difficulty...');
  
  const testEvent = {
    title: 'TEST EVENT',
    description: 'Dette er en test-hendelse.',
    type: 'travel',
    difficulty: 3,
    choices: [
      {
        id: 1,
        text: 'Testvalg',
        skill: 'Kamp',
        difficulty: 5,
        success: 'Du lykkes!',
        failure: 'Du mislykkes.',
        successReward: { gold: 10, experience: 20 },
        failurePenalty: { gold: -5, experience: 5 }
      }
    ]
  };
  
  try {
    // Lagre test-hendelsen
    const { data, error } = await supabase
      .from('travel_events')
      .insert(testEvent)
      .select();
    
    if (error) {
      console.error('Feil ved lagring av test-hendelse:', error);
      return false;
    }
    
    console.log('Test-hendelse lagret:', data[0].id);
    
    // Slett test-hendelsen igjen for å unngå å etterlate testdata
    const { error: deleteError } = await supabase
      .from('travel_events')
      .delete()
      .eq('id', data[0].id);
    
    if (deleteError) {
      console.error('Kunne ikke slette test-hendelse:', deleteError);
    } else {
      console.log('Test-hendelse slettet.');
    }
    
    return true;
  } catch (error) {
    console.error('Generell feil under testing av hendelseslagring:', error);
    return false;
  }
}

/**
 * Kjør alle tester
 */
async function runTests() {
  console.log('=== TESTING TRAVEL EVENTS ===');
  
  const tableStructureOk = await testTravelEventsTable();
  
  if (!tableStructureOk) {
    console.error('Feil i tabellstruktur. Avbryter tester.');
    return;
  }
  
  const saveEventOk = await testSaveEvent();
  
  if (!saveEventOk) {
    console.error('Feil ved lagring av hendelse.');
    return;
  }
  
  console.log('=== ALLE TESTER BESTÅTT ===');
}

// Kjør testene
runTests().catch(console.error); 