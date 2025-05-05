// Dette skriptet oppdaterer databaseskjemaet ved å legge til nye kolonner
import { supabase } from '../lib/supabase.js';

async function updateDatabaseSchema() {
  console.log('Starter oppdatering av databaseskjema...');
  
  try {
    // Må kjøre SQL direkte for å oppdatere skjemaet
    const { error } = await supabase.rpc('update_character_schema', {
      sql_command: `
        ALTER TABLE characters 
        ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT NULL;
      `
    });

    if (error) {
      console.error('Feil ved oppdatering av skjema:', error);
      throw error;
    }
    
    console.log('Databaseskjema oppdatert vellykket!');
  } catch (error) {
    console.error('Noe gikk galt ved oppdatering av databaseskjema:', error);
  }
}

// Kjør funksjonen
updateDatabaseSchema()
  .then(() => console.log('Skript fullført'))
  .catch(err => console.error('Skript feilet:', err)); 