import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import useAchievementTracker from '../hooks/useAchievementTracker'
import useCharacter from '../hooks/useCharacter'
import { getCharacterItems, getItemRarityColor } from '../lib/characterData'
import inventoryBackground from '../assets/inventory.jpg'
import { useItems } from '../components/Items/ItemContext'
import { toast } from 'react-hot-toast'

export default function Inventory() {
  const { user, loading: authLoading } = useAuth()
  const { character, updateCharacter } = useCharacter()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('gjenstander')
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState({
    items: [],
    resources: {},
    gold: 0
  })
  const achievementTracker = useAchievementTracker()
  const { showItem } = useItems()
  
  // State for utstyrsmodal
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [availableItems, setAvailableItems] = useState([])
  
  // State for item tools
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    // ... existing newItem state
  });
  
  // Redirect hvis ikke logget inn
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])
  
  // Henter inventardata
  useEffect(() => {
    async function loadInventory() {
      if (!user || !character) return
      
      try {
        // Forsøker å hente fra items-tabellen først
        try {
          const items = await getCharacterItems(character.id);
          
          if (items && items.length > 0) {
            // Synkroniser equipped-status med character.equipment
            const syncedItems = items.map(item => {
              // Finn ut hvilken slot denne gjenstanden er utstyrt i
              const equippedSlot = character.equipment ? 
                Object.entries(character.equipment).find(([slot, eq]) => eq.id === item.id)?.[0] : null;
              
              return {
                ...item,
                equipped: !!equippedSlot,
                slot: equippedSlot || item.slot,
                quantity: 1,
                value: item.value || 0
              };
            });
            
            // Sett inventory state
            setInventory({
              items: syncedItems,
              resources: {},
              gold: character ? character.coins : 0
            });
            
            console.log(`Hentet ${items.length} gjenstander fra database for karakter ${character.id}`);
            setLoading(false);
            return;
          } else {
            console.log('Ingen gjenstander funnet i items-tabellen');
          }
        } catch (itemsError) {
          console.error('Feil ved henting av gjenstander fra items-tabell:', itemsError);
        }
        
        // Hvis ingen gjenstander ble funnet i items-tabellen, fortsett med gammel metode
        // Forsøker å hente fra databasen først (gammel metode med inventory/equipment JSON i characters-tabell)
        let inventoryData = null;
        let equipmentData = null;
        
        try {
          // Sjekk om bruker har inventar i characters-tabellen
          const { data: characterData, error: characterError } = await supabase
            .from('characters')
            .select('inventory, equipment')
            .eq('user_id', user.id)
            .single();
          
          if (!characterError && characterData) {
            inventoryData = characterData.inventory;
            equipmentData = characterData.equipment;
            console.log('Inventar hentet fra characters-tabell:', inventoryData ? 'Funnet' : 'Ikke funnet');
          }
        } catch (dbError) {
          console.warn('Kunne ikke hente inventar fra characters-tabellen:', dbError);
        }
        
        // Hvis vi ikke fant data i databasen, prøv localStorage
        if (!inventoryData) {
          const localInventory = localStorage.getItem(`character_inventory_${character?.id}`);
          if (localInventory) {
            try {
              inventoryData = JSON.parse(localInventory);
              console.log('Inventar hentet fra localStorage');
            } catch (e) {
              console.error('Feil ved parsing av lagret inventar:', e);
            }
          }
        }
        
        // Hvis inventardata ble funnet, bruk det
        if (inventoryData && inventoryData.items) {
          setInventory({
            items: inventoryData.items || [],
            resources: inventoryData.resources || {},
            gold: character ? character.coins : 0
          });
        } else {
          // Tomme ressurser
          const resources = {
            wood: 0,
            stone: 0,
            herbs: 0,
            ore: 0,
            leather: 0,
            fabric: 0
          }
          
          // Tomme gjenstander
          const items = []

          // Sett inventardata
          setInventory({
            items,
            resources,
            gold: character ? character.coins : 0
          })
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading inventory:', error)
        setLoading(false)
      }
    }
    
    if (!authLoading && character) {
      loadInventory()
    }
  }, [user, authLoading, character])
  
  // Initier character equipment om det mangler
  useEffect(() => {
    if (character && !character.equipment && typeof updateCharacter === 'function') {
      updateCharacter({ equipment: {} });
    }
  }, [character, updateCharacter]);
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster inventar...</div>
        </div>
      </div>
    )
  }
  
  // Hjelpefunksjoner
  const getItemsByType = (type) => {
    return inventory.items.filter(item => 
      item.type === type || 
      (type === 'all' && true) ||
      (type === 'equipped' && item.equipped)
    )
  }
  
  const handleUseItem = async (item) => {
    if (item.type === 'consumable' || item.type === 'food') {
      try {
        // Bruk effekten av forbruksvaren på karakteren
        if (item.effect === 'restore_health') {
          // Øk karakterens helse, men ikke over maksimal helse
          const newHealth = Math.min(character.max_health, character.health + item.effect_value);
          
          // Oppdater karakterens helse i databasen
          const { error: characterError } = await supabase
            .from('characters')
            .update({ health: newHealth })
            .eq('id', character.id);
            
          if (characterError) {
            console.error('Feil ved oppdatering av karakter:', characterError);
            toast.error('Kunne ikke bruke gjenstanden. Prøv igjen.');
            return;
          }
          
          // Oppdater lokal karakter-tilstand
          updateCharacter({ health: newHealth });
          
          toast.success(`Du brukte ${item.name} og gjenopprettet ${item.effect_value} helse.`);
        } 
        else if (item.effect === 'restore_energy') {
          // Øk karakterens energi, men ikke over maksimal energi
          const newEnergy = Math.min(character.max_energy, character.energy + item.effect_value);
          
          // Oppdater karakterens energi i databasen
          const { error: characterError } = await supabase
            .from('characters')
            .update({ energy: newEnergy })
            .eq('id', character.id);
            
          if (characterError) {
            console.error('Feil ved oppdatering av karakter:', characterError);
            toast.error('Kunne ikke bruke gjenstanden. Prøv igjen.');
            return;
          }
          
          // Oppdater lokal karakter-tilstand
          updateCharacter({ energy: newEnergy });
          
          toast.success(`Du brukte ${item.name} og gjenopprettet ${item.effect_value} energi.`);
        }
        
        // Reduser antallet av gjenstanden eller fjern den helt
        if (item.quantity > 1) {
          // Oppdater antallet i databasen
          const { error: updateError } = await supabase
            .from('character_items')
            .update({ quantity: item.quantity - 1 })
            .eq('character_id', character.id)
            .eq('item_id', item.id);
            
          if (updateError) {
            console.error('Feil ved oppdatering av antall gjenstander:', updateError);
            toast.error('Kunne ikke oppdatere inventar. Prøv igjen.');
            return;
          }
          
          // Oppdater lokalt inventory
          setInventory(prev => ({
            ...prev,
            items: prev.items.map(i => 
              i.id === item.id ? {...i, quantity: i.quantity - 1} : i
            )
          }));
        } else {
          // Slett gjenstanden fra character_items
          const { error: deleteError } = await supabase
            .from('character_items')
            .delete()
            .eq('character_id', character.id)
            .eq('item_id', item.id);
            
          if (deleteError) {
            console.error('Feil ved sletting av gjenstand:', deleteError);
            toast.error('Kunne ikke fjerne gjenstanden. Prøv igjen.');
            return;
          }
          
          // Oppdater lokalt inventory
          setInventory(prev => ({
            ...prev,
            items: prev.items.filter(i => i.id !== item.id)
          }));
        }
      } catch (error) {
        console.error('Uventet feil ved bruk av gjenstand:', error);
        toast.error('En uventet feil oppstod. Prøv igjen senere.');
      }
    }
  }
  
  // Funksjon for å håndtere utrustning av gjenstander
  const handleEquipItem = async (item) => {
    // Legg til feilsøkingslogging for å se hva som skjer
    console.log('DEBUG handleEquipItem:', {
      item: item,
      itemName: item.name,
      itemType: item.type,
      itemSubtype: item.subtype,
      itemSlot: item.slot,
      selectedSlot: selectedSlot,
      canEquip: selectedSlot ? canEquipInSlot(item, selectedSlot) : 'ingen valgt slot'
    });
    
    // Hvis gjenstanden allerede er utstyrt, bruk dens nåværende slot
    // Dette er nyttig når vi kommer fra gjenstandsmodalen
    let targetSlot = selectedSlot;
    
    // Hvis gjenstanden er utstyrt og vi ikke har en valgt slot, bruk gjenstanden sin slot
    if (item.equipped && item.slot && !targetSlot) {
      targetSlot = item.slot;
      console.log('DEBUG: Bruker gjenstanden sin slot:', targetSlot);
    }
    
    // Hvis vi fortsatt ikke har en slot, prøv å finne en passende slot
    if (!targetSlot) {
      targetSlot = getEquipmentSlot(item);
      console.log('DEBUG: Fant passende slot basert på gjenstandstype:', targetSlot);
      
      // Hvis vi fortsatt ikke har en slot, kan vi ikke fortsette
      if (!targetSlot) {
        toast.error(`Kunne ikke finne en passende slot for ${item.name}.`);
        return;
      }
    }
    
    // Sjekk om gjenstanden kan utstyres i valgt slot
    if (!canEquipInSlot(item, targetSlot)) {
      toast.error(`${item.name} kan ikke utstyres i ${getSlotName(targetSlot).toLowerCase()}.`);
      return;
    }
    
    // Sjekk om gjenstanden allerede er utstyrt i character.equipment
    const isEquipped = character.equipment && 
                       character.equipment[targetSlot] && 
                       character.equipment[targetSlot].id === item.id;
    
    console.log('DEBUG: Gjenstanden er allerede utstyrt:', isEquipped);
    console.log('DEBUG: Character equipment før endring:', character.equipment);
    
    if (isEquipped) {
      // Ta av gjenstanden
      toast.success(`Du tok av: ${item.name}`);
      
      // Oppdater character state lokalt
      const updatedEquipment = {...character.equipment};
      delete updatedEquipment[targetSlot];
      
      console.log('DEBUG: Equipment etter fjerning:', updatedEquipment);
      
      try {
        // Oppdater character_items-tabellen
        const { error: itemError } = await supabase
          .from('character_items')
          .update({ 
            equipped: false,
            slot: null
          })
          .eq('character_id', character.id)
          .eq('item_id', item.id);
          
        if (itemError) {
          console.warn('Kunne ikke oppdatere item i database:', itemError);
          throw itemError;
        }
        
        // Oppdater characters-tabellen
        const { error: charError } = await supabase
          .from('characters')
          .update({ equipment: updatedEquipment })
          .eq('id', character.id);
          
        if (charError) {
          console.warn('Kunne ikke oppdatere utstyr i database:', charError);
          throw charError;
        }
        
        // Oppdater lokalt state
        updateCharacter({ equipment: updatedEquipment });
        console.log('DEBUG: Character state oppdatert med equipment:', updatedEquipment);
        
        setInventory(prev => ({
          ...prev,
          items: prev.items.map(i => 
            i.id === item.id ? {...i, equipped: false, slot: null} : i
          )
        }));
        
        // Lukk modalen etter handling
        setShowEquipmentModal(false);
        
      } catch (error) {
        console.warn('Feil ved oppdatering av utstyr i database:', error);
        localStorage.setItem(`character_equipment_${character.id}`, JSON.stringify(updatedEquipment));
      }
    } else {
      // Utrust gjenstanden
      toast.success(`Du utrustet: ${item.name}`);
      
      // Lagre referanse til tidligere utstyrt gjenstand
      const oldEquippedItem = character.equipment && character.equipment[targetSlot] 
        ? character.equipment[targetSlot] 
        : null;
      
      console.log('DEBUG: Tidligere utstyrt gjenstand:', oldEquippedItem);
      
      // Definer updatedEquipment før try-blokken
      const updatedEquipment = {...character.equipment};
      updatedEquipment[targetSlot] = {...item};
      
      console.log('DEBUG: Equipment etter utrustning:', updatedEquipment);
      
      try {
        // Oppdater den gamle gjenstanden hvis den finnes
        if (oldEquippedItem) {
          const { error: oldItemError } = await supabase
            .from('character_items')
            .update({ 
              equipped: false,
              slot: null
            })
            .eq('character_id', character.id)
            .eq('item_id', oldEquippedItem.id);
            
          if (oldItemError) {
            console.warn('Kunne ikke oppdatere gammel gjenstand:', oldItemError);
            throw oldItemError;
          }
        }
        
        // Oppdater den nye gjenstanden
        const { error: newItemError } = await supabase
          .from('character_items')
          .update({ 
            equipped: true,
            slot: targetSlot
          })
          .eq('character_id', character.id)
          .eq('item_id', item.id);
          
        if (newItemError) {
          console.warn('Kunne ikke oppdatere ny gjenstand:', newItemError);
          throw newItemError;
        }
        
        // Oppdater character state lokalt
        updateCharacter({ equipment: updatedEquipment });
        console.log('DEBUG: Character state oppdatert med equipment etter utrustning:', updatedEquipment);
        
        // Oppdater inventory state med korrekt equipped status
        setInventory(prev => ({
          ...prev,
          items: prev.items.map(i => {
            // Ny gjenstand som utstyres
            if (i.id === item.id) {
              return {...i, equipped: true, slot: targetSlot};
            } 
            // Gammel gjenstand som tas av
            else if (oldEquippedItem && i.id === oldEquippedItem.id) {
              return {...i, equipped: false, slot: null};
            }
            return i;
          })
        }));
        
        // Lukk modalen etter handling
        setShowEquipmentModal(false);
        
      } catch (error) {
        console.warn('Feil ved oppdatering av utstyr i database:', error);
        toast.error('Kunne ikke utstyre gjenstanden');
        localStorage.setItem(`character_equipment_${character.id}`, JSON.stringify(updatedEquipment));
      }
    }
  };
  
  const handleSellItem = (item) => {
    // I en fullverdig app ville vi sendt dette til en API
    const updatedItems = inventory.items.map(i => {
      if (i.id === item.id) {
        if (i.quantity > 1) {
          return { ...i, quantity: i.quantity - 1 }
        } else {
          return null
        }
      }
      return i
    }).filter(Boolean)
    
    // Bruk character.addCoins fra useCharacter hook
    setInventory({
      ...inventory,
      items: updatedItems
    })
    
    // Legg til gull til karakter
    if (character && typeof character.coins === 'number') {
      // I en full implementasjon ville vi brukt addCoins fra useCharacter
      alert(`Du solgte ${item.name} for ${item.value} gull.`)
    }
  }
  
  // Filtrer gjenstander basert på fane
  const getFilteredItems = () => {
    switch (activeTab) {
      case 'gjenstander': return getItemsByType('all')
      case 'utstyrt': return getItemsByType('equipped')
      case 'forbruk': return inventory.items.filter(item => item.type === 'consumable' || item.type === 'food')
      case 'våpen': return getItemsByType('weapon')
      case 'rustning': return getItemsByType('armor')
      case 'tilbehør': return getItemsByType('accessory')
      case 'materialer': return getItemsByType('material')
      default: return getItemsByType('all')
    }
  }
  
  // Når en spiller får en sjelden gjenstand
  const handleItemAcquired = (item) => {
    // Sjekk om gjenstanden er sjelden eller bedre
    if (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary') {
      // Oppdater achievement tracker
      achievementTracker.collectItem()
    }
  }
  
  // I en ekte implementering ville dette blitt kalt når spilleren finner, kjøper
  // eller får en gjenstand på annen måte. For demo formål lar vi spilleren trykke
  // på en "Finn sjelden gjenstand" knapp.
  
  const handleFindRareItem = () => {
    // Simulerer at spilleren finner en sjelden gjenstand
    const newItem = {
      id: Date.now(),
      name: 'Skimrende Ametyst',
      type: 'material',
      rarity: 'rare',
      description: 'En sjelden edelstein som skinner med mystisk lys',
      quantity: 1,
      icon: '💎',
      value: 250
    }
    
    // Legg til i inventory (i en ekte app ville dette gått til databasen)
    setInventory(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
    
    // Kall handleItemAcquired for å spore achievements
    handleItemAcquired(newItem)
    
    // Vis en melding til brukeren
    alert(`Du fant en sjelden gjenstand: ${newItem.name}!`)
  }
  
  // Mapper utstyrstype til slot-navn
  const getEquipmentSlot = (item) => {
    // Hvis gjenstanden allerede har en slot-egenskap, bruk den direkte
    if (item.slot) return item.slot;
    
    // Hent navnet i lowercase for enklere sammenligning
    const name = item.name ? item.name.toLowerCase() : '';
    
    // For våpen
    if (item.type === 'weapon') {
      if (item.subtype === 'twoHand') return 'mainHand';
      if (item.subtype === 'shield' || name.includes('skjold')) return 'offHand';
      return 'mainHand';
    }
    
    // For rustning
    if (item.type === 'armor') {
      // Spesifikke slottyper basert på navn eller subtype
      if (name.includes('hjelm') || name.includes('hode') || name.includes('lue') || 
          name.includes('hatt') || item.subtype === 'head') 
        return 'head';
        
      if (name.includes('bryst') || name.includes('kjortel') || name.includes('jakke') || 
          name.includes('tunika') || name.includes('brynje') || name.includes('kappe') || 
          name.includes('rustning') || name.includes('plate') || name.includes('lær') || item.subtype === 'chest') 
        return 'chest';
        
      if (name.includes('bukser') || name.includes('leggings') || 
          name.includes('benbeskytter') || item.subtype === 'legs') 
        return 'pants';
        
      if (name.includes('støvler') || name.includes('sko') || 
          name.includes('fot') || item.subtype === 'feet') 
        return 'boots';
        
      if (name.includes('hansker') || name.includes('hånd') || 
          item.subtype === 'hands') 
        return 'gloves';
        
      if (name.includes('armringer') || name.includes('håndledd') || 
          item.subtype === 'wrists') 
        return 'bracers';
        
      if (name.includes('skulder') || name.includes('skuldrer') || name.includes('shoulder') || 
          item.subtype === 'shoulders' || item.subtype === 'shoulder') 
        return 'shoulder';
        
      if (name.includes('belte') || item.subtype === 'waist') 
        return 'belt';
      
      // Fallback til chest hvis ingen spesifikk match
      return 'chest';
    }
    
    // For tilbehør
    if (item.type === 'accessory') {
      if (item.subtype === 'ring' || name.includes('ring')) return 'ring';
      if (item.subtype === 'amulet' || name.includes('amulett') || 
          name.includes('halskjede') || name.includes('anheng')) 
        return 'amulet';
      return 'misc';
    }
    
    // For kjæledyr
    if (item.type === 'pet') return 'pet';
    
    // Ingen match
    return null;
  };
  
  // Sjekk om en gjenstand kan utstyres i en bestemt slot
  const canEquipInSlot = (item, slotType) => {
    // Hvis gjenstanden har en spesifisert slot og den matcher slotType, tillat det direkte
    if (item.slot && item.slot === slotType) {
      return true;
    }
    
    // Hent navnet i lowercase for enklere sammenligning
    const name = item.name ? item.name.toLowerCase() : '';
    
    // Legg til feilsøkingslogging
    console.log('DEBUG canEquipInSlot:', {
      item: item,
      itemName: name,
      itemType: item.type,
      itemSubtype: item.subtype,
      itemSlot: item.slot,
      slotType: slotType,
      nameIncludes: {
        bryst: name.includes('bryst'),
        kjortel: name.includes('kjortel'),
        jakke: name.includes('jakke'),
        tunika: name.includes('tunika'),
        brynje: name.includes('brynje'),
        kappe: name.includes('kappe'),
        rustning: name.includes('rustning'),
        plate: name.includes('plate'),
        lær: name.includes('lær')
      }
    });
    
    // Grunnleggende typekontroll først - våpen kan bare gå i våpenslots, rustning bare i rustningsslots
    const weaponSlots = ['mainHand', 'offHand'];
    const armorSlots = ['head', 'chest', 'pants', 'boots', 'gloves', 'bracers', 'shoulder', 'belt'];
    const accessorySlots = ['ring', 'amulet', 'misc'];
    
    // Hvis gjenstanden er et våpen, kan den bare gå i våpenslots
    if (item.type === 'weapon' && !weaponSlots.includes(slotType)) {
      console.log(`DEBUG: Våpen kan ikke utstyres i ${slotType}-sloten`);
      return false;
    }
    
    // Hvis sloten er en våpenslot, kan bare våpen utstyres der
    if (weaponSlots.includes(slotType) && item.type !== 'weapon') {
      console.log(`DEBUG: Bare våpen kan utstyres i ${slotType}-sloten`);
      return false;
    }
    
    // Hvis gjenstanden er rustning, kan den bare gå i rustningsslots
    if (item.type === 'armor' && !armorSlots.includes(slotType)) {
      console.log(`DEBUG: Rustning kan ikke utstyres i ${slotType}-sloten`);
      return false;
    }
    
    // Hvis sloten er en rustningsslot, kan bare rustning utstyres der
    if (armorSlots.includes(slotType) && item.type !== 'armor') {
      console.log(`DEBUG: Bare rustning kan utstyres i ${slotType}-sloten`);
      return false;
    }
    
    // Hvis gjenstanden er tilbehør, kan den bare gå i tilbehørsslots
    if (item.type === 'accessory' && !accessorySlots.includes(slotType)) {
      console.log(`DEBUG: Tilbehør kan ikke utstyres i ${slotType}-sloten`);
      return false;
    }
    
    // Sjekk spesifikke regler for hver slottype
    switch (slotType) {
      case 'mainHand':
        return item.type === 'weapon' && item.subtype !== 'shield';
      case 'offHand':
        return (item.type === 'weapon' && item.subtype === 'shield') || 
               (item.type === 'armor' && name.includes('skjold'));
      case 'head':
        return item.type === 'armor' && 
               (item.subtype === 'head' || 
                name.includes('hjelm') || 
                name.includes('hode') ||
                name.includes('lue') ||
                name.includes('hatt'));
      case 'chest':
        return item.type === 'armor' && 
               (item.subtype === 'chest' || 
                name.includes('bryst') || 
                name.includes('kjortel') ||
                name.includes('jakke') ||
                name.includes('tunika') ||
                name.includes('brynje') ||
                name.includes('kappe') ||
                name.includes('rustning') ||
                name.includes('plate') ||
                name.includes('lær'));
      case 'pants':
        return item.type === 'armor' && 
               (item.subtype === 'legs' || 
                name.includes('bukser') || 
                name.includes('leggings') ||
                name.includes('benbeskytter'));
      case 'boots':
        return item.type === 'armor' && 
               (item.subtype === 'feet' || 
                name.includes('støvler') || 
                name.includes('sko') ||
                name.includes('fot'));
      case 'gloves':
        return item.type === 'armor' && 
               (item.subtype === 'hands' || 
                name.includes('hansker') ||
                name.includes('hånd'));
      case 'bracers':
        return item.type === 'armor' && 
               (item.subtype === 'wrists' || 
                name.includes('armringer') ||
                name.includes('håndledd'));
      case 'shoulder':
        return item.type === 'armor' && 
               (item.subtype === 'shoulders' || 
                item.subtype === 'shoulder' || 
                name.includes('skulder') ||
                name.includes('skuldrer') ||
                name.includes('shoulder'));
      case 'belt':
        return item.type === 'armor' && 
               (item.subtype === 'waist' || 
                name.includes('belte'));
      case 'ring':
        return item.type === 'accessory' && 
               (item.subtype === 'ring' || 
                name.includes('ring'));
      case 'amulet':
        return item.type === 'accessory' && 
               (item.subtype === 'amulet' || 
                name.includes('amulett') || 
                name.includes('halskjede') ||
                name.includes('anheng'));
      case 'misc':
        return item.type === 'accessory';
      case 'pet':
        return item.type === 'pet';
      default:
        return false;
    }
  };
  
  // Funksjon for å håndtere klikk på utstyrsplass
  const handleSlotClick = (slotType) => {
    setSelectedSlot(slotType);
    
    // Filtrer gjenstander som kan passe i denne slot-typen
    const items = inventory.items.filter(item => {
      // Ikke vis gjenstander som allerede er utstyrt i andre slots
      if (item.equipped && item.slot && item.slot !== slotType) {
        return false;
      }
      
      // Sjekk om gjenstanden kan utstyres i denne sloten
      const canEquip = canEquipInSlot(item, slotType);
      
      // Logg gjenstander som ikke kan utstyres for feilsøking
      if (!canEquip && item.type === 'armor' && !item.equipped) {
        console.log(`DEBUG: Kan ikke utstyre '${item.name}' i ${getSlotName(slotType)}-sloten.`, {
          itemType: item.type,
          itemSubtype: item.subtype,
          itemName: item.name,
          targetSlot: slotType
        });
      }
      
      return canEquip;
    });
    
    // Sorter slik at gjenstanden som allerede er utstyrt i denne sloten vises først
    const sortedItems = [...items].sort((a, b) => {
      // Hvis en av gjenstandene er utstyrt i denne sloten, vis den først
      if (a.equipped && a.slot === slotType) return -1;
      if (b.equipped && b.slot === slotType) return 1;
      
      // Ellers sorter etter sjeldenhetsgrad
      const rarityOrder = { legendary: 1, epic: 2, rare: 3, uncommon: 4, common: 5 };
      return (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99);
    });
    
    setAvailableItems(sortedItems);
    setShowEquipmentModal(true);
  };
  
  // Få norsk navn for slot
  const getSlotName = (slot) => {
    switch (slot) {
      case 'head': return 'Hodeplagg';
      case 'chest': return 'Brystplate';
      case 'pants': return 'Bukser';
      case 'boots': return 'Støvler';
      case 'gloves': return 'Hansker';
      case 'bracers': return 'Armringer';
      case 'shoulder': return 'Skulder';
      case 'belt': return 'Belte';
      case 'mainHand': return 'Hovedhånd';
      case 'offHand': return 'Skjold';
      case 'ring': return 'Ring';
      case 'amulet': return 'Amulett';
      case 'misc': return 'Diverse';
      case 'pet': return 'Kjæledyr';
      default: return '';
    }
  };

  // Få ikon for slot
  const getSlotIcon = (slot) => {
    switch (slot) {
      case 'head': return '👑';
      case 'chest': return '👕';
      case 'pants': return '👖';
      case 'boots': return '👢';
      case 'gloves': return '🧤';
      case 'bracers': return '▮▮';
      case 'shoulder': return '▣';
      case 'belt': return '🧶';
      case 'mainHand': return '⚔️';
      case 'offHand': return '🛡️';
      case 'ring': return '💍';
      case 'amulet': return '📿';
      case 'misc': return '🧸';
      case 'pet': return '🐕';
      default: return '';
    }
  };
  
  // Legg til en hjelpefunksjon for å generere en tilfeldig attributt
  const getRandomAttribute = () => {
    const attributes = ['Utholdenhet', 'Helse'];
    return attributes[Math.floor(Math.random() * attributes.length)];
  };

  // Funksjon for å trekke tilfeldig gjenstand
  const handleDrawRandomItem = async () => {
    try {
      // Hent alle gjenstander fra databasen
      const { data: items, error } = await supabase
        .from('items')
        .select('*');

      if (error) {
        console.error('Error fetching items:', error);
        toast.error('Kunne ikke hente gjenstander');
        return;
      }

      if (!items || items.length === 0) {
        toast.error('Ingen gjenstander tilgjengelig');
        return;
      }

      // Velg en tilfeldig gjenstand
      const randomItem = items[Math.floor(Math.random() * items.length)];

      // Sjekk først om karakteren allerede har denne gjenstanden
      const { data: existingItem, error: checkError } = await supabase
        .from('character_items')
        .select('*')
        .eq('character_id', character.id)
        .eq('item_id', randomItem.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 betyr "ingen resultater funnet", som er ok i dette tilfellet
        console.error('Feil ved sjekk av eksisterende gjenstand:', checkError);
        toast.error('Kunne ikke sjekke inventar');
        return;
      }

      let error2;
      
      if (existingItem) {
        // Hvis gjenstanden allerede finnes, øk antallet
        const { error: updateError } = await supabase
          .from('character_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('character_id', character.id)
          .eq('item_id', randomItem.id);
          
        error2 = updateError;
      } else {
        // Hvis gjenstanden ikke finnes, legg den til
        const { error: insertError } = await supabase
          .from('character_items')
          .insert([{
            character_id: character.id,
            item_id: randomItem.id,
            quantity: 1,
            equipped: false
          }]);
          
        error2 = insertError;
      }

      if (error2) {
        console.error('Error adding item to inventory:', error2);
        toast.error('Kunne ikke legge til gjenstand i inventaret');
        return;
      }

      // Transformer gjenstanden med attributter
      const transformedItem = {
        ...randomItem,
        quantity: 1,
        equipped: false,
        attributes: {
          helse: randomItem.vitality_bonus || 0
        }
      };

      // Oppdater lokalt inventar - sjekk om gjenstanden allerede finnes
      setInventory(prev => {
        const existingItemIndex = prev.items.findIndex(item => item.id === randomItem.id);
        
        if (existingItemIndex >= 0) {
          // Hvis gjenstanden finnes, øk antallet
          const updatedItems = [...prev.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: (updatedItems[existingItemIndex].quantity || 1) + 1
          };
          return {
            ...prev,
            items: updatedItems
          };
        } else {
          // Hvis gjenstanden ikke finnes, legg den til
          return {
            ...prev,
            items: [...prev.items, transformedItem]
          };
        }
      });

      // Vis notifikasjon
      showItem(transformedItem);
      
      // Sjekk om det er en sjelden gjenstand
      if (randomItem.rarity === 'rare' || randomItem.rarity === 'epic' || randomItem.rarity === 'legendary') {
        handleItemAcquired(randomItem);
      }

      toast.success(`Du fant: ${randomItem.name}!`);
    } catch (err) {
      console.error('Error in handleDrawRandomItem:', err);
      toast.error('En uventet feil oppstod');
    }
  };
  
  // Legg til denne funksjonen før return-statementet
  const calculateTotalBonuses = () => {
    const totalBonuses = {
      utholdenhet: 0,
      helse: 0,
      skade: 0,
      forsvar: 0
    };

    // Legg til feilsøkingslogg
    console.log('DEBUG: Starter beregning av totale bonuser');

    // Gå gjennom alle utstyrte gjenstander
    inventory.items.filter(item => item.equipped).forEach(item => {
      console.log(`DEBUG: Sjekker utstyrt gjenstand: ${item.name}`, {
        itemType: item.type,
        defense: item.defense,
        attributes: item.attributes
      });
      
      if (item.attributes) {
        Object.entries(item.attributes).forEach(([attr, value]) => {
          const attrLower = attr.toLowerCase();
          if (totalBonuses.hasOwnProperty(attrLower)) {
            totalBonuses[attrLower] += value;
            console.log(`DEBUG: La til ${value} til ${attrLower} fra attributter`);
          }
        });
      }
      
      // Legg til skade og forsvar direkte fra items
      if (item.damage && typeof item.damage === 'number') {
        totalBonuses.skade += item.damage;
        console.log(`DEBUG: La til ${item.damage} til skade fra item.damage`);
      }
      
      if (item.defense && typeof item.defense === 'number') {
        totalBonuses.forsvar += item.defense;
        console.log(`DEBUG: La til ${item.defense} til forsvar fra item.defense`);
      }
    });

    console.log('DEBUG: Ferdige totale bonuser:', totalBonuses);
    return totalBonuses;
  };

  // Legg til denne funksjonen for å beregne helse- og energibonuser
  const calculateHealthAndEnergyBonuses = (bonuses) => {
    return {
      helse: bonuses.helse * 5,  // Hver helse gir +5 helse
      energi: bonuses.utholdenhet * 5,  // Hver utholdenhet gir +5 energi
      skade: bonuses.skade,
      forsvar: bonuses.forsvar
    };
  };

  const totalBonuses = calculateTotalBonuses();
  const derivedBonuses = calculateHealthAndEnergyBonuses(totalBonuses);
  const hasAnyBonuses = Object.values(totalBonuses).some(value => value > 0);
  const hasDerivedBonuses = Object.values(derivedBonuses).some(value => value > 0);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleDiscardItem = async (item) => {
    try {
      // Slett gjenstanden fra character_items
      const { error: deleteError } = await supabase
        .from('character_items')
        .delete()
        .eq('character_id', character.id)
        .eq('item_id', item.id);

      if (deleteError) {
        console.error('Error discarding item:', deleteError);
        toast.error('Kunne ikke kaste gjenstanden');
        return;
      }

      // Oppdater lokalt inventory
      setInventory(prev => ({
        ...prev,
        items: prev.items.filter(i => i.id !== item.id)
      }));

      setShowItemModal(false);
      setSelectedItem(null);
      toast.success(`Du kastet ${item.name}`);
    } catch (err) {
      console.error('Error discarding item:', err);
      toast.error('En uventet feil oppstod');
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-900 text-white p-6 bg-cover bg-center bg-fixed"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7)), url(${inventoryBackground})`,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Topp seksjon med info og statistikk */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-gray-800 bg-opacity-80 rounded-lg p-6 border border-gray-700 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500 mb-2">Sekk og Inventar</h1>
            <div className="flex items-center text-sm text-gray-300">
              <span>
                <span className="text-yellow-400 mr-1">🪙</span> Gull: {character ? character.coins : 0}
              </span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md mr-2 text-sm">
              Sorter
            </button>
            <button
              onClick={handleDrawRandomItem}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-md text-sm"
            >
              Dev: Trek tilfeldig gjenstand
            </button>
          </div>
        </div>

        {/* Hovedinnhold med utstyrsplasser og gjenstander */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Venstre side - Utstyrsplasser */}
          <div className="lg:w-1/3 bg-gray-800 bg-opacity-80 rounded-lg border border-gray-700 shadow-lg p-6">
            <h2 className="text-xl font-bold text-yellow-500 mb-4">Utstyrsplasser</h2>
            
            {/* Vis totale bonuser hvis det finnes noen */}
            {hasDerivedBonuses && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">Totale Bonuser</h3>
                
                {/* Vis avledede bonuser (helse, energi, skade, forsvar) */}
                <div className="grid grid-cols-2 gap-3">
                  {derivedBonuses.helse > 0 && (
                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-gray-300">Maksimal Helse</span>
                      <span className="text-green-400 font-bold">+{derivedBonuses.helse}</span>
                    </div>
                  )}
                  {derivedBonuses.energi > 0 && (
                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-gray-300">Maksimal Energi</span>
                      <span className="text-blue-400 font-bold">+{derivedBonuses.energi}</span>
                    </div>
                  )}
                  {derivedBonuses.skade > 0 && (
                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-gray-300">Skade</span>
                      <span className="text-red-400 font-bold">+{derivedBonuses.skade}</span>
                    </div>
                  )}
                  {derivedBonuses.forsvar > 0 && (
                    <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-gray-300">Forsvar</span>
                      <span className="text-indigo-400 font-bold">+{derivedBonuses.forsvar}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Utstyrsplasser */}
            <div className="grid grid-cols-2 gap-4">
              {['head', 'chest', 'pants', 'boots', 'gloves', 'bracers', 'shoulder', 'belt', 'mainHand', 'offHand', 'ring', 'amulet', 'misc', 'pet'].map(slot => {
                // Sjekk først character.equipment for å se om det er noe utstyrt i denne sloten
                const equippedItemFromCharacter = character.equipment && character.equipment[slot];
                
                // Legg til feilsøkingslogg for å se hva som skjer i hver slot
                if (slot === 'gloves') {
                  console.log('DEBUG: Sjekker hanskeslot:', {
                    slot: slot,
                    equippedItemFromCharacter: equippedItemFromCharacter,
                    characterEquipment: character.equipment
                  });
                }
                
                // Deretter finn gjenstanden i inventory basert på ID
                const equippedItem = equippedItemFromCharacter 
                  ? inventory.items.find(item => item.id === equippedItemFromCharacter.id)
                  : null;
                
                if (slot === 'gloves' && equippedItemFromCharacter) {
                  console.log('DEBUG: Hanskedetaljer:', {
                    equippedItemId: equippedItemFromCharacter.id,
                    equippedItemName: equippedItemFromCharacter.name,
                    foundInInventory: !!equippedItem,
                    equippedItem: equippedItem
                  });
                  
                  // Sjekk alle gjenstander i inventaret
                  console.log('DEBUG: Alle hansker i inventaret:', 
                    inventory.items
                      .filter(item => item.type === 'armor' && 
                              (item.subtype === 'hands' || 
                               (item.name && item.name.toLowerCase().includes('hanske'))))
                  );
                }
                
                return (
                  <div 
                    key={slot}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer relative group"
                    onClick={() => handleSlotClick(slot)}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center text-xl">
                        {equippedItem ? (
                          equippedItem.image_url ? (
                            <img 
                              src={equippedItem.image_url} 
                              alt={equippedItem.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            equippedItem.icon
                          )
                        ) : (
                          getSlotIcon(slot)
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium text-sm text-gray-300">{getSlotName(slot)}</h3>
                      {equippedItem && (
                        <p className={`text-xs ${getItemRarityColor(equippedItem.rarity)}`}>{equippedItem.name}</p>
                      )}
                    </div>

                    {/* Tooltip for utstyrte gjenstander */}
                    {equippedItem && (
                      <div className="absolute z-10 w-72 bg-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible
                        transition-all duration-200 left-full ml-2 -translate-y-1/2 top-1/2">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-grow">
                            <h3 className={`font-bold ${getItemRarityColor(equippedItem.rarity)}`}>{equippedItem.name}</h3>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300 capitalize">
                                {equippedItem.type === 'weapon' && 'Våpen'}
                                {equippedItem.type === 'armor' && 'Rustning'}
                                {equippedItem.type === 'accessory' && 'Tilbehør'}
                                {equippedItem.type === 'consumable' && 'Forbruksvare'}
                                {equippedItem.type === 'material' && 'Materiale'}
                                {equippedItem.type === 'food' && 'Mat'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${getItemRarityColor(equippedItem.rarity)} bg-opacity-20 bg-gray-700`}>
                                {equippedItem.rarity === 'common' && 'Vanlig'}
                                {equippedItem.rarity === 'uncommon' && 'Uvanlig'}
                                {equippedItem.rarity === 'rare' && 'Sjelden'}
                                {equippedItem.rarity === 'epic' && 'Episk'}
                                {equippedItem.rarity === 'legendary' && 'Legendarisk'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="mt-2 text-sm text-gray-300">{equippedItem.description}</p>
                        
                        {(equippedItem.damage > 0 || equippedItem.defense > 0 || equippedItem.effect) && (
                          <div className="mt-2 text-sm">
                            {equippedItem.damage > 0 && (
                              <div className="text-red-400">Skade: {equippedItem.damage}</div>
                            )}
                            {equippedItem.defense > 0 && (
                              <div className="text-blue-400">Forsvar: {equippedItem.defense}</div>
                            )}
                            {equippedItem.effect && (
                              <div className="text-green-400">
                                Effekt: 
                                {equippedItem.effect === 'restore_health' && ` Gjenoppretter ${equippedItem.effect_value} helse`}
                                {equippedItem.effect === 'restore_energy' && ` Gjenoppretter ${equippedItem.effect_value} energi`}
                                {equippedItem.effect === 'max_health' && ` +${equippedItem.effect_value} makshelse`}
                                {equippedItem.effect === 'magic_power' && ` +${equippedItem.effect_value} magisk kraft`}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Attributter */}
                        {equippedItem.attributes && (
                          <div className="mt-2 text-sm">
                            {Object.entries(equippedItem.attributes)
                              .sort(([a], [b]) => {
                                const order = {
                                  'helse': 1,
                                  'utholdenhet': 2
                                };
                                return (order[a.toLowerCase()] || 99) - (order[b.toLowerCase()] || 99);
                              })
                              .map(([attr, value]) => {
                                if (value <= 0) return null;
                                
                                switch(attr.toLowerCase()) {
                                  case 'helse':
                                    return <div key={attr} className="text-pink-400">+{value} Helse</div>;
                                  case 'utholdenhet':
                                    return <div key={attr} className="text-yellow-400">+{value} Utholdenhet</div>;
                                  default:
                                    return null;
                                }
                            })}
                          </div>
                        )}
                        
                        <div className="mt-3 text-sm text-gray-400">
                          Verdi: <span className="text-yellow-400">{equippedItem.value} gull</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Høyre side - Gjenstander og ressurser */}
          <div className="lg:w-2/3 bg-gray-800 bg-opacity-80 rounded-lg border border-gray-700 shadow-lg p-6">
            <h2 className="text-xl font-bold text-yellow-500 mb-4">Gjenstander</h2>
            
            {/* Grid med gjenstander */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
              {inventory.items.filter(item => !item.equipped).map(item => (
                <div 
                  key={item.id} 
                  className={`bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-500 transition-colors relative group cursor-pointer`}
                  onClick={() => handleItemClick(item)}
                >
                  {/* Item icon and name only */}
                  <div className="flex items-center justify-center mb-2">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center text-xl">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        item.icon
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className={`font-medium text-sm ${getItemRarityColor(item.rarity)} truncate`}>{item.name}</h3>
                    <div className="text-gray-400 text-xs">
                      {item.quantity > 1 && `× ${item.quantity}`}
                    </div>
                  </div>
                  
                  {/* Tooltip that appears on hover */}
                  <div className="absolute z-10 w-72 bg-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 left-full ml-2 -translate-y-1/2 top-1/2">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-grow">
                        <h3 className={`font-bold ${getItemRarityColor(item.rarity)}`}>{item.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300 capitalize">
                            {item.type === 'consumable' && 'Forbruksvare'}
                            {item.type === 'weapon' && 'Våpen'}
                            {item.type === 'armor' && 'Rustning'}
                            {item.type === 'accessory' && 'Tilbehør'}
                            {item.type === 'material' && 'Materiale'}
                            {item.type === 'food' && 'Mat'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getItemRarityColor(item.rarity)} bg-opacity-20 bg-gray-700`}>
                            {item.rarity === 'common' && 'Vanlig'}
                            {item.rarity === 'uncommon' && 'Uvanlig'}
                            {item.rarity === 'rare' && 'Sjelden'}
                            {item.rarity === 'epic' && 'Episk'}
                            {item.rarity === 'legendary' && 'Legendarisk'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-300">{item.description}</p>
                    
                    {(item.damage > 0 || item.defense > 0 || item.effect) && (
                      <div className="mt-2 text-sm">
                        {item.damage > 0 && (
                          <div className="text-red-400">Skade: {item.damage}</div>
                        )}
                        {item.defense > 0 && (
                          <div className="text-blue-400">Forsvar: {item.defense}</div>
                        )}
                        {item.effect && (
                          <div className="text-green-400">
                            Effekt: 
                            {item.effect === 'restore_health' && ` Gjenoppretter ${item.effect_value} helse`}
                            {item.effect === 'restore_energy' && ` Gjenoppretter ${item.effect_value} energi`}
                            {item.effect === 'max_health' && ` +${item.effect_value} makshelse`}
                            {item.effect === 'magic_power' && ` +${item.effect_value} magisk kraft`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Legg til attributtbonuser */}
                    {item.attributes && (
                      <div className="mt-2 text-sm">
                        {Object.entries(item.attributes)
                          .sort(([a], [b]) => {
                            // Definer rekkefølgen vi ønsker
                            const order = {
                              'helse': 1,
                              'utholdenhet': 2
                            };
                            return (order[a.toLowerCase()] || 99) - (order[b.toLowerCase()] || 99);
                          })
                          .map(([attr, value]) => {
                            if (value <= 0) return null; // Ikke vis attributter med verdi 0 eller mindre
                            
                            switch(attr.toLowerCase()) {
                              case 'helse':
                                return <div key={attr} className="text-pink-400">+{value} Helse</div>;
                              case 'utholdenhet':
                                return <div key={attr} className="text-yellow-400">+{value} Utholdenhet</div>;
                              default:
                                return null;
                            }
                        })}
                      </div>
                    )}
                    
                    <div className="mt-3 text-sm text-gray-400">
                      Verdi: <span className="text-yellow-400">{item.value} gull</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ressurser */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-yellow-500 mb-4">Ressurser</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(inventory.resources).map(([resource, amount]) => (
                  <div key={resource} className="bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-md bg-gray-600 flex items-center justify-center mr-3 text-xl">
                        {resource === 'wood' && '🪵'}
                        {resource === 'stone' && '🪨'}
                        {resource === 'herbs' && '🌿'}
                        {resource === 'ore' && '⛏️'}
                        {resource === 'leather' && '🧶'}
                        {resource === 'fabric' && '🧵'}
                      </div>
                      <div>
                        <div className="font-medium">{
                          resource === 'wood' ? 'Tre' :
                          resource === 'stone' ? 'Stein' :
                          resource === 'herbs' ? 'Urter' :
                          resource === 'ore' ? 'Malm' :
                          resource === 'leather' ? 'Lær' :
                          resource === 'fabric' ? 'Stoff' : 
                          resource
                        }</div>
                        <div className="text-yellow-400 text-sm">{amount} stk</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for å velge utstyr til en slot */}
      {showEquipmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg max-w-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-yellow-500">
                Velg utstyr for {getSlotName(selectedSlot)}
              </h3>
              <button 
                onClick={() => setShowEquipmentModal(false)}
                className="text-gray-500 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Viser nåværende utstyrte gjenstander */}
            <div className="mb-4">
              <h4 className="text-md font-semibold text-yellow-400 mb-2">Nåværende utstyr</h4>
              {character.equipment && character.equipment[selectedSlot] ? (
                <div className="bg-gray-700 p-3 rounded-lg mb-2 border border-gray-600">
                  <div className="flex items-start">
                    {/* Finn gjenstanden i inventory basert på ID */}
                    {(() => {
                      const currentItem = inventory.items.find(item => 
                        item.id === character.equipment[selectedSlot].id
                      );
                      
                      return currentItem ? (
                        <>
                          <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center text-xl mr-3">
                            {currentItem.image_url ? (
                              <img 
                                src={currentItem.image_url} 
                                alt={currentItem.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              currentItem.icon
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <h4 className={`font-bold ${getItemRarityColor(currentItem.rarity)}`}>
                                {currentItem.name}
                              </h4>
                              <button 
                                onClick={() => handleEquipItem(currentItem)}
                                className="text-xs bg-red-700 hover:bg-red-600 px-2 py-0.5 rounded text-white"
                              >
                                Fjern
                              </button>
                            </div>
                            <p className="text-sm text-gray-300 mt-1">{currentItem.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {currentItem.damage > 0 && (
                                <span className="bg-gray-600 text-xs text-white px-2 py-0.5 rounded">
                                  Skade: {currentItem.damage}
                                </span>
                              )}
                              {currentItem.defense > 0 && (
                                <span className="bg-gray-600 text-xs text-white px-2 py-0.5 rounded">
                                  Forsvar: {currentItem.defense}
                                </span>
                              )}
                              {currentItem.effect && (
                                <span className="bg-gray-600 text-xs text-white px-2 py-0.5 rounded">
                                  Effekt: {currentItem.effect_value} {currentItem.effect}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm italic">Kunne ikke finne informasjon om gjenstanden</div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm italic mb-2">Ingen gjenstander utstyrt i denne sloten</div>
              )}
            </div>
            
            <h4 className="text-md font-semibold text-yellow-400 mb-2">Tilgjengelige gjenstander</h4>
            
            {availableItems.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {availableItems.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 border border-gray-600 cursor-pointer transition-colors"
                    onClick={() => handleEquipItem(item)}
                  >
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center text-xl mr-3">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          item.icon
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <h4 className={`font-bold ${getItemRarityColor(item.rarity)}`}>{item.name}</h4>
                          <span className="bg-yellow-600 text-xs text-white px-2 py-0.5 rounded-full transition-opacity">
                            {item.equipped ? 'Utstyrt' : 'Velg'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.damage && (
                            <span className="bg-gray-600 text-xs text-white px-2 py-0.5 rounded">
                              Skade: {item.damage}
                            </span>
                          )}
                          {item.defense && (
                            <span className="bg-gray-600 text-xs text-white px-2 py-0.5 rounded">
                              Forsvar: {item.defense}
                            </span>
                          )}
                          {item.effect && (
                            <span className="bg-gray-600 text-xs text-white px-2 py-0.5 rounded">
                              Effekt: {item.effect_value} {item.effect}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                Du har ingen gjenstander som passer i denne sloten
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setShowEquipmentModal(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gjenstandsinteraksjonsmodal */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center text-xl mr-3">
                  {selectedItem.image_url ? (
                    <img 
                      src={selectedItem.image_url} 
                      alt={selectedItem.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    selectedItem.icon
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${getItemRarityColor(selectedItem.rarity)}`}>
                    {selectedItem.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {selectedItem.type === 'weapon' && 'Våpen'}
                    {selectedItem.type === 'armor' && 'Rustning'}
                    {selectedItem.type === 'consumable' && 'Forbruksvare'}
                    {selectedItem.type === 'accessory' && 'Tilbehør'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowItemModal(false);
                  setSelectedItem(null);
                }}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <p className="text-gray-300 text-sm">{selectedItem.description}</p>
              
              {/* Attributter */}
              {selectedItem.attributes && (
                <div className="mt-4 space-y-2">
                  {Object.entries(selectedItem.attributes).map(([attr, value]) => {
                    if (value <= 0) return null;
                    const color = 
                      attr === 'styrke' ? 'text-red-400' :
                      attr === 'magi' ? 'text-blue-400' :
                      attr === 'smidighet' ? 'text-green-400' :
                      attr === 'kunnskap' ? 'text-purple-400' :
                      attr === 'helse' ? 'text-pink-400' : 'text-gray-400';
                    return (
                      <div key={attr} className={`${color}`}>
                        +{value} {attr.charAt(0).toUpperCase() + attr.slice(1)}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stats */}
              <div className="mt-4 space-y-2">
                {selectedItem.damage > 0 && (
                  <div className="text-red-400">Skade: {selectedItem.damage}</div>
                )}
                {selectedItem.defense > 0 && (
                  <div className="text-blue-400">Forsvar: {selectedItem.defense}</div>
                )}
              </div>

              {/* Handlingsknapper */}
              <div className="mt-6 flex space-x-3">
                {(selectedItem.type === 'weapon' || selectedItem.type === 'armor' || selectedItem.type === 'accessory') && (
                  <button
                    onClick={() => {
                      // Sett riktig slot basert på gjenstanden før vi kaller handleEquipItem
                      const itemSlot = selectedItem.equipped ? selectedItem.slot : getEquipmentSlot(selectedItem);
                      setSelectedSlot(itemSlot);
                      
                      // Legg til en liten forsinkelse for å sikre at selectedSlot er satt
                      setTimeout(() => {
                        handleEquipItem(selectedItem);
                        setShowItemModal(false);
                        setSelectedItem(null);
                      }, 10);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    {selectedItem.equipped ? 'Ta av' : 'Utrust'}
                  </button>
                )}
                {(selectedItem.type === 'consumable' || selectedItem.type === 'food') && (
                  <button
                    onClick={() => {
                      handleUseItem(selectedItem);
                      setShowItemModal(false);
                      setSelectedItem(null);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Bruk
                  </button>
                )}
                <button
                  onClick={() => handleDiscardItem(selectedItem)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Kast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 