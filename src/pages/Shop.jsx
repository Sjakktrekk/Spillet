import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import backgroundImage from '../assets/store.jpg'
import seedrandom from 'seedrandom'
import { getCharacterItems } from '../lib/characterData'
import useCharacter from '../hooks/useCharacter'
import { toast } from 'react-hot-toast'

export default function Shop() {
  const { cityId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { character } = useCharacter()
  const [city, setCity] = useState(null)
  const [shopItems, setShopItems] = useState([])
  const [playerInventory, setPlayerInventory] = useState({
    items: [],
    gold: 0
  })
  const [activeTab, setActiveTab] = useState('kjøp')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('alle')
  const [selectedItems, setSelectedItems] = useState([])
  const [respawnTimers, setRespawnTimers] = useState({})

  // Redirect hvis ikke logget inn
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // Laster inn byen og butikkdata
  useEffect(() => {
    async function loadShopData() {
      if (!user || !cityId) return
      
      try {
        // Hent bydata
        const cityData = await fetchCityData(cityId)
        if (!cityData) {
          navigate('/home')
          return
        }
        
        setCity(cityData)
        
        // Hent varer tilgjengelig i butikken
        const items = await generateShopItems()
        setShopItems(items)
        
        // Hent spillerens inventar og gullbeholdning umiddelbart
        const inventory = await fetchPlayerInventory()
        setPlayerInventory(inventory)

        // Hent oppdatert gullbeholdning direkte fra characters-tabellen
        const { data: characterData, error: characterError } = await supabase
          .from('characters')
          .select('coins')
          .eq('id', character.id)
          .single();

        if (!characterError && characterData) {
          setPlayerInventory(prev => ({
            ...prev,
            gold: characterData.coins
          }));
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading shop data:', error)
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      loadShopData()
    }
  }, [cityId, user, authLoading, navigate, character])

  // Oppdater respawn-timere hvert sekund
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const newTimers = {};
      
      shopItems.forEach(item => {
        if (item.stock <= 0 && item.lastRespawn) {
          const lastRespawn = new Date(item.lastRespawn);
          const timeSinceLastRespawn = Math.floor((now - lastRespawn) / 1000);
          const timeUntilRespawn = Math.max(0, item.respawnTimer - timeSinceLastRespawn);
          
          if (timeUntilRespawn > 0) {
            newTimers[item.id] = timeUntilRespawn;
          } else {
            // Hvis respawn-tiden er over, oppdater lagerbeholdning
            generateShopItems();
          }
        }
      });
      
      setRespawnTimers(newTimers);
    }, 1000);

    return () => clearInterval(timer);
  }, [shopItems]);

  // Formater tid til lesbart format
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Hjelpefunksjon for å få bynavn basert på ID
  function getCityNameById(id) {
    const cityNames = {
      1: "Solhavn",
      2: "Skogheim",
      3: "Fjellstad",
      4: "Havbyen"
    }
    return cityNames[id] || `By ${id}`
  }

  // Hent bydata - bruker dummy data hvis nødvendig
  async function fetchCityData(id) {
    try {
      // Sjekk først om vi har data i localStorage
      const cachedCity = localStorage.getItem(`city_${id}`);
      if (cachedCity) {
        return JSON.parse(cachedCity);
      }
      
      // Hvis ikke, hent fra databasen
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.log('Could not fetch city data from database, using dummy data')
        // Returnerer dummy-data hvis databasekallet feiler
        const dummyCity = {
          id: parseInt(id),
          name: getCityNameById(parseInt(id)),
          population: 5000 + Math.floor(Math.random() * 5000)
        };
        
        // Lagre dummy-dataen i localStorage for fremtidig bruk
        localStorage.setItem(`city_${id}`, JSON.stringify(dummyCity));
        return dummyCity;
      }
      
      if (data) {
        // Lagre dataen i localStorage for fremtidig bruk
        localStorage.setItem(`city_${id}`, JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Error fetching city:', error)
    }
    
    // Returnerer dummy-data hvis databasekallet feiler
    const dummyCity = {
      id: parseInt(id),
      name: getCityNameById(parseInt(id)),
      population: 5000 + Math.floor(Math.random() * 5000)
    };
    
    // Lagre dummy-dataen i localStorage for fremtidig bruk
    localStorage.setItem(`city_${id}`, JSON.stringify(dummyCity));
    return dummyCity;
  }
  
  // Generer vareutvalg basert på by
  const generateShopItems = async () => {
    try {
      if (!cityId) return [];
      
      // Hent shop_items for denne byen
      const { data: shopItems, error } = await supabase
        .from('shop_items')
        .select(`
          *,
          items:item_id (*)
        `)
        .eq('city_id', cityId);
      
      if (error) {
        console.error('Feil ved henting av butikkvarer:', error);
        return [];
      }
      
      // Sjekk og oppdater respawn for hver gjenstand
      const now = new Date();
      const updatedShopItems = await Promise.all(shopItems.map(async (si) => {
        const lastRespawn = new Date(si.last_respawn);
        const timeSinceLastRespawn = Math.floor((now - lastRespawn) / 1000); // i sekunder
        
        if (si.stock < si.items.max_stock && timeSinceLastRespawn >= si.respawn_timer) {
          // Beregn antall respawns siden sist
          const respawns = Math.floor(timeSinceLastRespawn / si.respawn_timer);
          const newStock = Math.min(si.items.max_stock, si.stock + respawns);
          
          // Oppdater lagerbeholdning i databasen
          const { error: updateError } = await supabase
            .from('shop_items')
            .update({
              stock: newStock,
              last_respawn: now.toISOString()
            })
            .eq('id', si.id);
          
          if (updateError) {
            console.error('Feil ved oppdatering av lagerbeholdning:', updateError);
            return si;
          }
          
          return {
            ...si,
            stock: newStock,
            last_respawn: now.toISOString()
          };
        }
        
        return si;
      }));
      
      // Formater data for visning
      return updatedShopItems.map(si => ({
        id: si.id,
        ...si.items,
        buyPrice: si.price,
        stock: si.stock,
        sellPrice: Math.floor(si.price * 0.5), // 50% av kjøpspris som standard
        respawnTimer: si.respawn_timer,
        lastRespawn: si.last_respawn,
        max_stock: si.items.max_stock
      }));
    } catch (error) {
      console.error('Feil ved generering av butikkvarer:', error);
      return [];
    }
  };
  
  // Hent spillerens inventar
  async function fetchPlayerInventory() {
    try {
      if (!character) return { items: [], gold: 0 };
      
      // Hent gjenstander fra items-tabellen
      const items = await getCharacterItems(character.id);
      
      // Hent oppdatert character-data for å få riktig gullbeholdning
      const { data: characterData, error: characterError } = await supabase
        .from('characters')
        .select('coins')
        .eq('id', character.id)
        .single();

      if (characterError) {
        console.error('Feil ved henting av gullbeholdning:', characterError);
        return { items: [], gold: 0 };
      }

      // Oppdater character-objektet med ny gullbeholdning
      if (characterData) {
        character.coins = characterData.coins;
      }
      
      // Legg til sellPrice basert på value hvis det mangler
      const itemsWithSellPrice = items.map(item => ({
        ...item,
        sellPrice: item.sellPrice || Math.floor(item.value * 0.5) // 50% av kjøpspris som standard
      }));
      
      return {
        items: itemsWithSellPrice || [],
        gold: characterData?.coins || 0
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      return { items: [], gold: 0 }
    }
  }
  
  // Oppdater inventar og gullbeholdning periodisk
  useEffect(() => {
    const updateInterval = setInterval(async () => {
      const inventory = await fetchPlayerInventory();
      setPlayerInventory(inventory);
    }, 5000); // Oppdater hvert 5. sekund

    return () => clearInterval(updateInterval);
  }, [character]);

  // Farger for sjeldenhetsgrader
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-300'
      case 'uncommon': return 'text-green-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-gray-300'
    }
  }

  // Fargeklasser for tooltips basert på sjeldenhet
  const getTooltipRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-700'
      case 'uncommon': return 'bg-green-900'
      case 'rare': return 'bg-blue-900'
      case 'epic': return 'bg-purple-900'
      case 'legendary': return 'bg-yellow-900'
      default: return 'bg-gray-700'
    }
  }

  // Formater statnavn til norsk
  const formatStatName = (stat) => {
    const statNames = {
      strength: 'Styrke',
      dexterity: 'Smidighet',
      constitution: 'Kroppsbygning',
      intelligence: 'Intelligens',
      wisdom: 'Visdom',
      charisma: 'Karisma',
      health: 'Helse',
      mana: 'Mana',
      armor: 'Rustning',
      damage: 'Skade',
      critChance: 'Kritisk sjanse',
      critDamage: 'Kritisk skade',
      dodgeChance: 'Unngåelsessjanse',
      blockChance: 'Blokkeringssjanse',
      attackSpeed: 'Angrepshastighet',
      movementSpeed: 'Bevegelseshastighet',
      healthRegen: 'Helsegjenoppretting',
      manaRegen: 'Managjenoppretting'
    };
    return statNames[stat] || stat;
  }
  
  // Håndter kjøp av en gjenstand
  const handleBuyItem = async (item) => {
    try {
      // Sjekk om spilleren har nok gull
      if (playerInventory.gold < item.buyPrice) {
        toast.error('Du har ikke nok gull');
        return;
      }

      // Sjekk om det er nok på lager
      if (item.stock <= 0) {
        toast.error('Dette itemet er utsolgt');
        return;
      }

      // Start en transaksjon
      const { data: shopItems, error: fetchError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('item_id', item.id)
        .eq('city_id', cityId);

      if (fetchError) throw fetchError;
      if (!shopItems || shopItems.length === 0) {
        toast.error('Kunne ikke finne varen i butikken');
        return;
      }

      const shopItem = shopItems[0];

      // Dobbeltsjekk lagerbeholdning
      if (shopItem.stock <= 0) {
        toast.error('Dette itemet er utsolgt');
        return;
      }

      // Oppdater lagerbeholdning
      const { error: updateError } = await supabase
        .from('shop_items')
        .update({ 
          stock: shopItem.stock - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopItem.id);

      if (updateError) throw updateError;

      // Sjekk om spilleren allerede har dette itemet
      const { data: existingItem, error: checkError } = await supabase
        .from('character_items')
        .select('*')
        .eq('character_id', character.id)
        .eq('item_id', item.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingItem) {
        // Oppdater antall hvis itemet allerede finnes
        const { error: updateItemError } = await supabase
          .from('character_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('character_id', character.id)
          .eq('item_id', item.id);

        if (updateItemError) throw updateItemError;
      } else {
        // Legg til nytt item hvis det ikke finnes
        const { error: insertError } = await supabase
          .from('character_items')
          .insert({
            character_id: character.id,
            item_id: item.id,
            quantity: 1,
            equipped: false
          });

        if (insertError) throw insertError;
      }

      // Oppdater spillerens gull
      const { error: goldError } = await supabase
        .from('characters')
        .update({ 
          coins: playerInventory.gold - item.buyPrice 
        })
        .eq('id', character.id);

      if (goldError) throw goldError;

      // Oppdater lokalt state
      setPlayerInventory(prev => ({
        ...prev,
        gold: prev.gold - item.buyPrice,
        items: prev.items.some(i => i.id === item.id)
          ? prev.items.map(i => 
              i.id === item.id 
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          : [...prev.items, { ...item, quantity: 1 }]
      }));

      setShopItems(prev => 
        prev.map(shopItem => 
          shopItem.id === item.id 
            ? { ...shopItem, stock: shopItem.stock - 1 }
            : shopItem
        )
      );

      // Vis tematisk popup
      const popup = document.createElement('div');
      popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-green-600 text-green-400 p-4 rounded-lg shadow-lg z-50 animate-fade-in';
      popup.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-2">🛍️</span>
          <div>
            <p class="font-bold">Kjøp vellykket!</p>
            <p class="text-sm">Du kjøpte ${item.name} for ${item.buyPrice} gull</p>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      
      // Fjern popup etter 3 sekunder
      setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 500);
      }, 3000);

      toast.success('Kjøp vellykket!');
    } catch (error) {
      console.error('Feil ved kjøp av item:', error);
      toast.error('Kunne ikke kjøpe item');
    }
  };
  
  // Håndter salg av en gjenstand
  const handleSellItem = async (item) => {
    if (!item.sellPrice) {
      console.error('Item has no sell price:', item);
      return;
    }

    try {
      // Oppdater gull i databasen
      const { error: goldError } = await supabase
        .from('characters')
        .update({ coins: character.coins + item.sellPrice })
        .eq('id', character.id);

      if (goldError) throw goldError;

      // Oppdater antall i items-tabellen
      if (item.quantity > 1) {
        const { error: updateError } = await supabase
          .from('items')
          .update({ quantity: item.quantity - 1 })
          .eq('id', item.id);

        if (updateError) throw updateError;
      } else {
        // Slett gjenstanden hvis det var den siste
        const { error: deleteError } = await supabase
          .from('items')
          .delete()
          .eq('id', item.id);

        if (deleteError) throw deleteError;
      }

      // Oppdater character.inventory
      const updatedInventory = {
        ...character.inventory,
        items: character.inventory?.items?.filter(i => i.id !== item.id) || []
      };

      const { error: inventoryError } = await supabase
        .from('characters')
        .update({ inventory: updatedInventory })
        .eq('id', character.id);

      if (inventoryError) throw inventoryError;

      // Hent oppdatert character-data
      const { data: updatedCharacter, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', character.id)
        .single();

      if (fetchError) throw fetchError;

      // Oppdater character state
      character.coins = updatedCharacter.coins;
      character.inventory = updatedCharacter.inventory;

      // Oppdater lokalt state
      const updatedItems = playerInventory.items.map(i => 
        i.id === item.id 
          ? { ...i, quantity: i.quantity - 1 } 
          : i
      ).filter(i => i.quantity > 0);
      
      setPlayerInventory({
        ...playerInventory,
        items: updatedItems,
        gold: playerInventory.gold + item.sellPrice
      });
      
      // Vis tematisk popup
      const popup = document.createElement('div');
      popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-yellow-600 text-yellow-400 p-4 rounded-lg shadow-lg z-50 animate-fade-in';
      popup.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-2">💰</span>
          <div>
            <p class="font-bold">Handel fullført!</p>
            <p class="text-sm">Du solgte ${item.name} for ${item.sellPrice} gull</p>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      
      // Fjern popup etter 3 sekunder
      setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 500);
      }, 3000);
      
    } catch (error) {
      console.error('Error selling item:', error);
      // Vis tematisk feilmelding
      const popup = document.createElement('div');
      popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-red-600 text-red-400 p-4 rounded-lg shadow-lg z-50 animate-fade-in';
      popup.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-2">❌</span>
          <div>
            <p class="font-bold">Handel feilet!</p>
            <p class="text-sm">Prøv igjen senere</p>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      
      // Fjern popup etter 3 sekunder
      setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 500);
      }, 3000);
    }
  };
  
  // Filtrer butikkvarer basert på søkeord og kategori
  const getFilteredShopItems = () => {
    return shopItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'alle' || item.type === selectedCategory
      return matchesSearch && matchesCategory
    })
  }
  
  // Håndter valg av gjenstander
  const handleItemSelect = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  // Håndter salg av flere gjenstander
  const handleSellSelectedItems = async () => {
    if (selectedItems.length === 0) {
      // Vis tematisk melding
      const popup = document.createElement('div');
      popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-yellow-600 text-yellow-400 p-4 rounded-lg shadow-lg z-50 animate-fade-in';
      popup.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-2">⚠️</span>
          <div>
            <p class="font-bold">Ingen gjenstander valgt</p>
            <p class="text-sm">Velg minst én gjenstand å selge</p>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      
      // Fjern popup etter 3 sekunder
      setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 500);
      }, 3000);
      return;
    }

    try {
      const totalValue = selectedItems.reduce((sum, item) => sum + (item.sellPrice || 0), 0);
      
      // Oppdater gull i databasen
      const { error: goldError } = await supabase
        .from('characters')
        .update({ coins: character.coins + totalValue })
        .eq('id', character.id);

      if (goldError) throw goldError;

      // Oppdater eller slett gjenstander i databasen
      for (const item of selectedItems) {
        if (item.quantity > 1) {
          const { error: updateError } = await supabase
            .from('items')
            .update({ quantity: item.quantity - 1 })
            .eq('id', item.id);

          if (updateError) throw updateError;
        } else {
          const { error: deleteError } = await supabase
            .from('items')
            .delete()
            .eq('id', item.id);

          if (deleteError) throw deleteError;
        }
      }

      // Oppdater character.inventory
      const updatedInventory = {
        ...character.inventory,
        items: character.inventory?.items?.filter(i => 
          !selectedItems.some(selected => selected.id === i.id)
        ) || []
      };

      const { error: inventoryError } = await supabase
        .from('characters')
        .update({ inventory: updatedInventory })
        .eq('id', character.id);

      if (inventoryError) throw inventoryError;

      // Hent oppdatert character-data
      const { data: updatedCharacter, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', character.id)
        .single();

      if (fetchError) throw fetchError;

      // Oppdater character state
      character.coins = updatedCharacter.coins;
      character.inventory = updatedCharacter.inventory;
      
      // Oppdater lokalt state
      const updatedItems = playerInventory.items.map(invItem => {
        const selectedItem = selectedItems.find(sel => sel.id === invItem.id);
        if (selectedItem) {
          return { ...invItem, quantity: invItem.quantity - 1 };
        }
        return invItem;
      }).filter(item => item.quantity > 0);
      
      setPlayerInventory({
        ...playerInventory,
        items: updatedItems,
        gold: playerInventory.gold + totalValue
      });
      
      // Tøm valgte gjenstander
      setSelectedItems([]);
      
      // Vis tematisk popup
      const popup = document.createElement('div');
      popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-yellow-600 text-yellow-400 p-4 rounded-lg shadow-lg z-50 animate-fade-in';
      popup.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-2">💰</span>
          <div>
            <p class="font-bold">Handel fullført!</p>
            <p class="text-sm">Du solgte ${selectedItems.length} gjenstander for totalt ${totalValue} gull</p>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      
      // Fjern popup etter 3 sekunder
      setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 500);
      }, 3000);
      
    } catch (error) {
      console.error('Error selling items:', error);
      // Vis tematisk feilmelding
      const popup = document.createElement('div');
      popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-red-600 text-red-400 p-4 rounded-lg shadow-lg z-50 animate-fade-in';
      popup.innerHTML = `
        <div class="flex items-center">
          <span class="text-2xl mr-2">❌</span>
          <div>
            <p class="font-bold">Handel feilet!</p>
            <p class="text-sm">Prøv igjen senere</p>
          </div>
        </div>
      `;
      document.body.appendChild(popup);
      
      // Fjern popup etter 3 sekunder
      setTimeout(() => {
        popup.classList.add('animate-fade-out');
        setTimeout(() => popup.remove(), 500);
      }, 3000);
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster markedsplass...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen text-white p-6"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="bg-gray-900 bg-opacity-90 rounded-lg shadow-xl p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-6 border-b border-gray-700">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-16 h-16 bg-yellow-700 rounded-full border-4 border-yellow-600 flex items-center justify-center text-3xl mr-6">
              🏪
            </div>
            <div>
              <h1 className="text-3xl font-bold text-yellow-500">{city?.name} Markedsplass</h1>
              <div className="text-gray-300 mt-1">Ditt gull: <span className="text-yellow-400">{playerInventory.gold}</span></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button 
              onClick={() => navigate(`/city/${cityId}`)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center"
            >
              <span className="mr-2">🏙️</span>
              Tilbake til byen
            </button>
            <button 
              onClick={() => navigate('/inventory')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors flex items-center"
            >
              <span className="mr-2">🎒</span>
              Se inventar
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button 
            onClick={() => setActiveTab('kjøp')}
            className={`${
              activeTab === 'kjøp' 
                ? 'border-yellow-500 text-yellow-500' 
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-400'
            } flex items-center px-4 py-2 border-b-2 font-medium text-sm`}
          >
            <span className="mr-2">🛒</span>
            Kjøp varer
          </button>
          <button 
            onClick={() => setActiveTab('selg')}
            className={`${
              activeTab === 'selg' 
                ? 'border-yellow-500 text-yellow-500' 
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-400'
            } flex items-center px-4 py-2 border-b-2 font-medium text-sm`}
          >
            <span className="mr-2">💰</span>
            Selg varer
          </button>
        </div>
        
        {/* Kjøpemodus */}
        {activeTab === 'kjøp' && (
          <>
            {/* Søk og filtrering */}
            <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
              <div className="relative w-full md:w-1/3">
                <input 
                  type="text"
                  placeholder="Søk etter varer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 pl-10 text-white focus:outline-none focus:border-yellow-500"
                />
                <span className="absolute left-3 top-2.5">🔍</span>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedCategory('alle')}
                  className={`px-3 py-1 rounded text-sm ${selectedCategory === 'alle' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Alle
                </button>
                <button 
                  onClick={() => setSelectedCategory('weapon')}
                  className={`px-3 py-1 rounded text-sm ${selectedCategory === 'weapon' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Våpen
                </button>
                <button 
                  onClick={() => setSelectedCategory('armor')}
                  className={`px-3 py-1 rounded text-sm ${selectedCategory === 'armor' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Rustning
                </button>
                <button 
                  onClick={() => setSelectedCategory('consumable')}
                  className={`px-3 py-1 rounded text-sm ${selectedCategory === 'consumable' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Forbruksvarer
                </button>
              </div>
            </div>
            
            {/* Tilgjengelige varer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredShopItems().map(item => (
                <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-yellow-500 transition-colors">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{item.icon}</span>
                      <h3 className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</h3>
                    </div>
                    <div className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                      {item.type === 'weapon' ? 'Våpen' : 
                       item.type === 'armor' ? 'Rustning' : 
                       item.type === 'consumable' ? 'Forbruksvare' : 
                       item.type === 'accessory' ? 'Tilbehør' : 
                       item.type === 'food' ? 'Mat' : 
                       item.type === 'tool' ? 'Verktøy' : 'Gjenstand'}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mt-2">{item.description}</p>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1">🪙</span>
                      <span className="font-bold">{item.buyPrice}</span>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      {item.stock > 0 ? (
                        `På lager: ${item.stock}`
                      ) : (
                        <div className="flex items-center text-red-400">
                          <span className="mr-1">⏳</span>
                          {respawnTimers[item.id] ? (
                            `Tilbake om: ${formatTime(respawnTimers[item.id])}`
                          ) : (
                            'Utsolgt'
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleBuyItem(item)}
                    disabled={item.stock <= 0 || playerInventory.gold < item.buyPrice}
                    className={`w-full mt-3 py-2 rounded text-sm ${
                      item.stock <= 0 || playerInventory.gold < item.buyPrice
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }`}
                  >
                    {item.stock <= 0 
                      ? 'Utsolgt' 
                      : playerInventory.gold < item.buyPrice
                        ? 'Ikke nok gull'
                        : `Kjøp for ${item.buyPrice} gull`}
                  </button>
                </div>
              ))}
            </div>
            
            {getFilteredShopItems().length === 0 && (
              <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                <div className="text-2xl mb-2">🔍</div>
                <p>Ingen varer funnet. Prøv et annet søk eller kategori.</p>
              </div>
            )}
          </>
        )}
        
        {/* Salgmodus */}
        {activeTab === 'selg' && (
          <>
            <div className="mb-6">
              <p className="text-gray-300">Velg gjenstander fra ditt inventar for å selge til handelsmenn.</p>
              {selectedItems.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-900 bg-opacity-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-yellow-300">Valgte gjenstander: {selectedItems.length}</span>
                      <span className="ml-4 text-yellow-400">
                        Total verdi: {selectedItems.reduce((sum, item) => sum + (item.sellPrice || 0), 0)} gull
                      </span>
                    </div>
                    <button
                      onClick={handleSellSelectedItems}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                    >
                      Selg valgte gjenstander
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {playerInventory.items.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
                <div className="text-2xl mb-2">🎒</div>
                <p>Du har ingen gjenstander å selge for øyeblikket.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerInventory.items.map(item => (
                  <div 
                    key={item.id} 
                    className={`bg-gray-800 border rounded-lg p-4 cursor-pointer transition-all relative group ${
                      selectedItems.some(selected => selected.id === item.id)
                        ? 'border-yellow-500 bg-gray-700'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{item.icon}</span>
                          <h3 className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</h3>
                        </div>
                        <div className="text-sm bg-gray-700 px-2 py-1 rounded-full">
                          Antall: {item.quantity}
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mt-2">{item.description}</p>
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-1">🪙</span>
                          <span className="font-bold">{item.sellPrice}</span>
                          <span className="text-xs text-gray-400 ml-1">per stk</span>
                        </div>
                      </div>
                    </div>

                    {/* Selg-knapp */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSellItem(item);
                      }}
                      className="absolute bottom-2 right-2 p-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full transition-colors"
                      title={`Selg for ${item.sellPrice} gull`}
                    >
                      <span className="text-sm">💰</span>
                    </button>

                    {/* Tooltip */}
                    <div className={`absolute z-50 invisible group-hover:visible w-64 p-3 rounded-lg ${getTooltipRarityColor(item.rarity)} border border-gray-600 shadow-lg transition-all duration-200 transform translate-y-2 group-hover:translate-y-0`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold ${getRarityColor(item.rarity)}`}>{item.name}</h4>
                        <span className="text-xs text-gray-400">{item.type}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                      <div className="text-sm text-gray-400">
                        <div className="flex justify-between mb-1">
                          <span>Sjeldenhet:</span>
                          <span className={getRarityColor(item.rarity)}>{item.rarity}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span>Verdi:</span>
                          <span className="text-yellow-400">{item.value} gull</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span>Salgspris:</span>
                          <span className="text-yellow-400">{item.sellPrice} gull</span>
                        </div>
                        {item.stats && Object.entries(item.stats).length > 0 && (
                          <>
                            <div className="border-t border-gray-600 my-2"></div>
                            <div className="text-yellow-400 font-semibold mb-1">Statistikker:</div>
                            {Object.entries(item.stats).map(([stat, value]) => (
                              <div key={stat} className="flex justify-between">
                                <span>{formatStatName(stat)}:</span>
                                <span className="text-green-400">+{value}</span>
                              </div>
                            ))}
                          </>
                        )}
                        {item.requirements && Object.entries(item.requirements).length > 0 && (
                          <>
                            <div className="border-t border-gray-600 my-2"></div>
                            <div className="text-yellow-400 font-semibold mb-1">Krav:</div>
                            {Object.entries(item.requirements).map(([req, value]) => (
                              <div key={req} className="flex justify-between">
                                <span>{formatStatName(req)}:</span>
                                <span className="text-red-400">{value}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}