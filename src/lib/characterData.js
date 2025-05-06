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
  const { data, error } = await supabase
    .from('characters')
    .insert([characterData])
    .select()
  
  if (error) throw error
  return data[0]
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

// Funksjon for å legge til standardutstyr til en nyopprettet karakter
export async function addStartingEquipment(characterId, classId) {
  try {
    // Sjekk først om karakteren eksisterer
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();
    
    if (charError) {
      console.error('Feil ved henting av karakter:', charError);
      throw charError;
    }
    
    // Bestem hvilken type utstyr som skal gis basert på klasse
    let armorType = 'cloth'; // Standard for magikere (class_id 3)
    
    if (classId === 2) { // Kriger
      armorType = 'mail';
    } else if (classId === 4) { // Tyv
      armorType = 'leather';
    } else if (classId === 1) { // Eventyrer
      armorType = 'leather';
    }
    
    // Opprett standard utstyr basert på armorType
    const standardEquipment = {
      head: {
        name: `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} Hodeplagg`,
        type: 'armor',
        rarity: 'common',
        defense: armorType === 'mail' ? 3 : (armorType === 'leather' ? 2 : 1),
        description: `Et enkelt ${armorType} hodeplagg.`,
        icon: '👑',
        image_url: `/src/assets/Items/Standard/${armorType.charAt(0).toUpperCase() + armorType.slice(1)}1_Head.png`,
        value: 1
      },
      chest: {
        name: `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} Brystplate`,
        type: 'armor',
        rarity: 'common',
        defense: armorType === 'mail' ? 5 : (armorType === 'leather' ? 3 : 2),
        description: `En enkel ${armorType} brystplate.`,
        icon: '👕',
        image_url: `/src/assets/Items/Standard/${armorType.charAt(0).toUpperCase() + armorType.slice(1)}1_Chest.png`,
        value: 1
      },
      pants: {
        name: `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} Bukser`,
        type: 'armor',
        rarity: 'common',
        defense: armorType === 'mail' ? 4 : (armorType === 'leather' ? 2 : 1),
        description: `Et par enkle ${armorType} bukser.`,
        icon: '👖',
        image_url: `/src/assets/Items/Standard/${armorType.charAt(0).toUpperCase() + armorType.slice(1)}1_Pants.png`,
        value: 1
      },
      belt: {
        name: `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} Belte`,
        type: 'armor',
        rarity: 'common',
        defense: armorType === 'mail' ? 2 : 1,
        description: `Et enkelt ${armorType} belte.`,
        icon: '🧶',
        image_url: `/src/assets/Items/Standard/${armorType.charAt(0).toUpperCase() + armorType.slice(1)}1_belt.png`,
        value: 1
      },
      boots: {
        name: `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} Støvler`,
        type: 'armor',
        rarity: 'common',
        defense: armorType === 'mail' ? 3 : 2,
        description: `Et par enkle ${armorType} støvler.`,
        icon: '👢',
        image_url: `/src/assets/Items/Standard/${armorType.charAt(0).toUpperCase() + armorType.slice(1)}1_Boots.png`,
        value: 1
      },
      gloves: {
        name: `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} Hansker`,
        type: 'armor',
        rarity: 'common',
        defense: armorType === 'mail' ? 2 : 1,
        description: `Et par enkle ${armorType} hansker.`,
        icon: '🧤',
        image_url: `/src/assets/Items/Standard/${armorType.charAt(0).toUpperCase() + armorType.slice(1)}1_gloves.png`,
        value: 1
      },
      bracers: {
        name: `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} Armringer`,
        type: 'armor',
        rarity: 'common',
        defense: armorType === 'mail' ? 2 : 1,
        description: `Et par enkle ${armorType} armringer.`,
        icon: '▮▮',
        image_url: `/src/assets/Items/Standard/${armorType.charAt(0).toUpperCase() + armorType.slice(1)}1_bracers.png`,
        value: 1
      },
      shoulder: {
        name: `${armorType.charAt(0).toUpperCase() + armorType.slice(1)} Skulderbeskyttere`,
        type: 'armor',
        rarity: 'common',
        defense: armorType === 'cloth' ? 3 : 2,
        description: `Et par enkle ${armorType} skulderbeskyttere.`,
        icon: '▣',
        image_url: `/src/assets/Items/Standard/${armorType.charAt(0).toUpperCase() + armorType.slice(1)}1_Shoulder.png`,
        value: 1
      }
    };
    
    // Legg til startvåpen basert på klasse
    let weapon = {};
    
    switch (classId) {
      case 1: // Eventyrer
        weapon = {
          name: 'Jaktbue',
          type: 'weapon',
          slot: 'mainHand',
          rarity: 'common',
          damage: 4,
          description: 'En enkel jaktbue.',
          icon: '🏹',
          image_url: '/src/assets/Items/Standard/Bow_01.png'
        };
        break;
      case 2: // Kriger
        weapon = {
          name: 'Krigsøks',
          type: 'weapon',
          slot: 'mainHand',
          rarity: 'common',
          damage: 6,
          description: 'En standard krigsøks.',
          icon: '🪓',
          image_url: '/src/assets/Items/Standard/Axe_01.png'
        };
        break;
      case 3: // Magiker
        weapon = {
          name: 'Tryllestav',
          type: 'weapon',
          slot: 'mainHand',
          rarity: 'common',
          damage: 3,
          magicDamage: 5,
          description: 'En enkel tryllestav.',
          icon: '🪄',
          image_url: '/src/assets/Items/Standard/staff_1.png'
        };
        break;
      case 4: // Tyv
        weapon = {
          name: 'Dolk',
          type: 'weapon',
          slot: 'mainHand',
          rarity: 'common',
          damage: 3,
          critChance: 10,
          description: 'En skarp dolk.',
          icon: '🔪',
          image_url: '/src/assets/Items/Standard/Dagger_01.png'
        };
        break;
      default:
        weapon = {
          name: 'Kniv',
          type: 'weapon',
          slot: 'mainHand',
          rarity: 'common',
          damage: 2,
          description: 'En enkel kniv.',
          icon: '🔪',
          image_url: '/src/assets/Items/Standard/Dagger_01.png'
        };
    }
    
    standardEquipment.mainHand = weapon;
    
    // Implementer logikken for å legge til standardutstyr til karakteren
    console.log('Standardutstyr:', standardEquipment);
    
    // Legg standardutstyret til i databasen
    for (const [slot, item] of Object.entries(standardEquipment)) {
      try {
        const { error } = await supabase
          .from('items')
          .insert({
            character_id: characterId,
            name: item.name,
            type: item.type,
            slot: slot,
            rarity: item.rarity,
            defense: item.defense || 0,
            damage: item.damage || 0,
            magic_damage: item.magicDamage || 0,
            crit_chance: item.critChance || 0,
            description: item.description,
            icon: item.icon,
            image_url: item.image_url,
            equipped: true // Sett utstyret som utrustet med en gang
          });
        
        if (error) {
          console.error(`Feil ved lagring av ${slot}:`, error);
        }
      } catch (itemError) {
        console.error(`Feil ved lagring av ${slot}:`, itemError);
      }
    }
    
    console.log('Standardutstyr lagt til i databasen');
    
    return standardEquipment;
  } catch (error) {
    console.error('Feil ved tilsetting av standardutstyr:', error);
    throw error;
  }
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