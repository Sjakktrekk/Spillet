import { supabase } from './supabase'

export async function getRaces() {
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function createCharacter(characterData) {
  try {
    const { data, error } = await supabase
      .from('characters')
      .insert([characterData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Feil ved opprettelse av karakter:', error);
    throw error;
  }
}

export async function getRaceById(raceId) {
  if (!raceId) return null;
  
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .eq('id', raceId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getClassById(classId) {
  if (!classId) return null;
  
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();
  
  if (error) throw error;
  return data;
}

// Henter avatarer basert på rase
export function getAvatars(raceName) {
  if (!raceName) return [];
  
  // Mapper norske rasenavn til engelske filnavn
  const raceNameMap = {
    'Menneske': 'Human',
    'Alv': 'Elf',
    'Dverg': 'Dwarf',
    'Ork': 'Half-Orc'
  };
  
  // Finner riktig engelsk navn som brukes i filnavnene
  const englishRaceName = raceNameMap[raceName] || raceName;
  
  // Mapper rasenavnet til avatarene i assets/avatars-mappen
  // Returnerer stier til bildene basert på rasenavn
  const avatarFiles = [];
  
  // Importer alle avatarfilene for den valgte rasen fra assets-mappen
  const raceAvatarsContext = import.meta.glob('/src/assets/avatars/*.webp', { eager: true });
  
  console.log('Prøver å finne avatarer for:', raceName, '→', englishRaceName);
  console.log('Tilgjengelige avatarfiler:', Object.keys(raceAvatarsContext));
  
  // Filtrer ut avatarer som matcher den valgte rasen
  for (const path in raceAvatarsContext) {
    const fileName = path.split('/').pop();
    if (fileName.startsWith(englishRaceName)) {
      avatarFiles.push({
        url: raceAvatarsContext[path].default,
        fileName: fileName
      });
    }
  }
  
  console.log(`Fant ${avatarFiles.length} avatarer for ${raceName}`);
  return avatarFiles;
}

// Laster opp avatar URL til karakterens profil
export async function updateCharacterAvatar(characterId, avatarUrl) {
  const { data, error } = await supabase
    .from('characters')
    .update({ avatar_url: avatarUrl })
    .eq('id', characterId)
    .select()
  
  if (error) throw error
  return data[0]
}

// Funksjon for å slette en karakter
export async function deleteCharacter(userId) {
  try {
    // Først finner vi karakteren som skal slettes
    const { data: character, error: findError } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (findError) {
      console.error('Feil ved søk etter karakter:', findError);
      throw findError;
    }
    
    if (!character) {
      throw new Error('Fant ingen karakter å slette');
    }
    
    // Sletter karakteren
    const { error: deleteError } = await supabase
      .from('characters')
      .delete()
      .eq('id', character.id);
    
    if (deleteError) {
      console.error('Feil ved sletting av karakter:', deleteError);
      throw deleteError;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Feil ved sletting av karakter:', error);
    throw error;
  }
}

// Funksjon for å hente gjenstander for en karakter
export async function getCharacterItems(characterId) {
  try {
    const { data: characterItems, error: itemsError } = await supabase
      .from('character_items')
      .select(`
        quantity,
        equipped,
        items (
          id,
          name,
          description,
          type,
          slot,
          rarity,
          damage,
          defense,
          image_url,
          value,
          vitality_bonus,
          attributes
        )
      `)
      .eq('character_id', characterId);

    if (itemsError) {
      console.error('Feil ved henting av gjenstander:', itemsError);
      throw itemsError;
    }

    // Omform datastrukturen til det formatet resten av appen forventer
    return characterItems.map(item => ({
      ...item.items,
      quantity: item.quantity,
      equipped: item.equipped,
      // Bruk attributes-objektet fra databasen eller opprett et tomt objekt
      attributes: item.items.attributes || { 
        helse: item.items.vitality_bonus || 0 
      }
    }));

  } catch (error) {
    console.error('Feil ved henting av gjenstander:', error);
    throw error;
  }
}

// Legg til flere items-relaterte funksjoner her
export function getItemRarityColor(rarity) {
  switch (rarity) {
    case 'uncommon': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-orange-400';
    case 'artifact': return 'text-rose-400';
    default: return 'text-gray-200'; // common eller standard
  }
}

export function getItemRarityBorderColor(rarity) {
  switch (rarity) {
    case 'common': return 'border-gray-500';
    case 'uncommon': return 'border-green-500';
    case 'rare': return 'border-blue-500';
    case 'epic': return 'border-purple-500';
    case 'legendary': return 'border-yellow-500';
    case 'artifact': return 'border-rose-500';
    default: return 'border-gray-500';
  }
}

export async function addItemToCharacter(characterId, itemId, quantity = 1) {
  try {
    // Sjekk om karakteren allerede har gjenstanden
    const { data: existingItem, error: checkError } = await supabase
      .from('character_items')
      .select('*')
      .eq('character_id', characterId)
      .eq('item_id', itemId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 betyr at ingen rader ble funnet, som er ok
      console.error('Feil ved sjekk av eksisterende gjenstand:', checkError);
      throw checkError;
    }

    if (existingItem) {
      // Oppdater antall på eksisterende gjenstand
      const { error: updateError } = await supabase
        .from('character_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('character_id', characterId)
        .eq('item_id', itemId);

      if (updateError) {
        console.error('Feil ved oppdatering av gjenstandsantall:', updateError);
        throw updateError;
      }
    } else {
      // Legg til ny gjenstand
      const { error: insertError } = await supabase
        .from('character_items')
        .insert({
          character_id: characterId,
          item_id: itemId,
          quantity: quantity,
          equipped: false
        });

      if (insertError) {
        console.error('Feil ved tillegging av gjenstand:', insertError);
        throw insertError;
      }
    }

    return true;
  } catch (error) {
    console.error('Feil ved tillegging av gjenstand til karakter:', error);
    throw error;
  }
}