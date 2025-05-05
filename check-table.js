// Enkel script for å teste om player_locations tabellen eksisterer
const { createClient } = require('@supabase/supabase-js');

// Supabase-konfigurasjon
const supabaseUrl = 'https://eitbpkxpouhtsyytufqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpdGJwa3hwb3VodHN5eXR1ZnFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTQxMDA3NSwiZXhwIjoyMDYwOTg2MDc1fQ.VWRkB8CAgfdhiCL2k73KtmkMy95j8m85pGOXdMmwZ08';

// Initialiser Supabase-klienten
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableIfNotExists() {
  try {
    // Sjekk først om tabellen eksisterer
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'player_locations')
      .maybeSingle();

    console.log('Table check result:', tableExists, checkError);

    if (!tableExists || checkError) {
      console.log('Tabellen eksisterer ikke, oppretter...');
      
      // Opprett tabellen
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS player_locations (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL,
            city_id INTEGER NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
          );
        `
      });
      
      if (error) {
        console.error('Feil ved oppretting av tabell:', error);
      } else {
        console.log('Tabell opprettet:', data);
      }
    } else {
      console.log('Tabellen eksisterer allerede');
    }
    
  } catch (err) {
    console.error('Uventet feil:', err);
  }
}

// Prøv direkte SQL-spørring
async function testTableAccess() {
  try {
    // Test SELECT spørring
    const { data, error } = await supabase
      .from('player_locations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Feil ved spørring mot tabellen:', error);
    } else {
      console.log('Tabellen eksisterer og er tilgjengelig:', data);
    }
  } catch (err) {
    console.error('Feil ved tilgang til tabell:', err);
  }
}

// Kjør funksjonene
(async () => {
  await createTableIfNotExists();
  await testTableAccess();
})(); 