import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function ShopAdmin() {
  const [items, setItems] = useState([]);
  const [cities, setCities] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(1);
  const [respawnTimer, setRespawnTimer] = useState(3600); // Standard 1 time

  // Hent alle items og byer ved lasting
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hent items med alle egenskaper
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .order('name');

        if (itemsError) {
          console.error('Feil ved henting av items:', itemsError);
          throw itemsError;
        }
        console.log('Hentet items:', itemsData);
        setItems(itemsData);

        // Hent byer
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('*')
          .order('name');

        if (citiesError) throw citiesError;
        setCities(citiesData);

        // Hent eksisterende shop_items
        const { data: shopItemsData, error: shopItemsError } = await supabase
          .from('shop_items')
          .select(`
            *,
            items:item_id (*),
            cities:city_id (*)
          `);

        if (shopItemsError) throw shopItemsError;
        setShopItems(shopItemsData);

        setLoading(false);
      } catch (error) {
        console.error('Feil ved henting av data:', error);
        toast.error('Kunne ikke laste data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Håndter valg av item
  const handleItemSelect = (item) => {
    setSelectedItem(item);
    // Finn eksisterende shop_items for dette itemet
    const existingShopItems = shopItems.filter(si => si.item_id === item.id);
    setSelectedCities(existingShopItems.map(si => si.city_id));
    if (existingShopItems.length > 0) {
      setPrice(existingShopItems[0].price);
      setStock(existingShopItems[0].stock);
      setRespawnTimer(existingShopItems[0].respawn_timer || 3600);
    } else {
      setPrice(item.value || 0);
      setStock(1);
      setRespawnTimer(3600);
    }
  };

  // Håndter valg av byer
  const handleCityToggle = (cityId) => {
    setSelectedCities(prev => {
      if (prev.includes(cityId)) {
        return prev.filter(id => id !== cityId);
      } else {
        return [...prev, cityId];
      }
    });
  };

  // Lagre endringer
  const handleSave = async () => {
    if (!selectedItem) {
      toast.error('Velg en gjenstand først');
      return;
    }

    if (selectedCities.length === 0) {
      toast.error('Velg minst én by');
      return;
    }

    if (price <= 0) {
      toast.error('Prisen må være større enn 0');
      return;
    }

    if (stock < 0) {
      toast.error('Lagerbeholdning kan ikke være negativ');
      return;
    }

    if (respawnTimer < 0) {
      toast.error('Respawn-tid kan ikke være negativ');
      return;
    }

    try {
      // Finn eksisterende shop_items for dette itemet
      const existingShopItems = shopItems.filter(si => si.item_id === selectedItem.id);
      
      // Slett shop_items for byer som ikke lenger er valgt
      const citiesToRemove = existingShopItems
        .filter(si => !selectedCities.includes(si.city_id))
        .map(si => si.id);

      if (citiesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('shop_items')
          .delete()
          .in('id', citiesToRemove);

        if (deleteError) throw deleteError;
      }

      // Opprett eller oppdater shop_items for valgte byer
      for (const cityId of selectedCities) {
        const existingShopItem = existingShopItems.find(si => si.city_id === cityId);

        if (existingShopItem) {
          // Oppdater eksisterende
          const { error: updateError } = await supabase
            .from('shop_items')
            .update({
              price,
              stock,
              respawn_timer: respawnTimer,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingShopItem.id);

          if (updateError) throw updateError;
        } else {
          // Opprett ny
          const { error: insertError } = await supabase
            .from('shop_items')
            .insert({
              item_id: selectedItem.id,
              city_id: cityId,
              price,
              stock,
              respawn_timer: respawnTimer
            });

          if (insertError) throw insertError;
        }
      }

      // Oppdater lokalt state
      const { data: updatedShopItems, error: fetchError } = await supabase
        .from('shop_items')
        .select(`
          *,
          items:item_id (*),
          cities:city_id (*)
        `);

      if (fetchError) throw fetchError;
      setShopItems(updatedShopItems);

      toast.success('Endringer lagret');
    } catch (error) {
      console.error('Feil ved lagring av endringer:', error);
      toast.error('Kunne ikke lagre endringer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-300">Laster data...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-yellow-500 mb-6">Butikkadministrasjon</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Venstre side - Gjenstander */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Gjenstander</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedItem?.id === item.id
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm opacity-75">{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Høyre side - Byer og innstillinger */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Innstillinger</h3>
          
          {selectedItem ? (
            <>
              {/* Item informasjon */}
              <div className="mb-6 bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-yellow-300">{selectedItem.name}</h4>
                    <p className="text-gray-300 text-sm mt-1">{selectedItem.description}</p>
                  </div>
                  <div className="text-sm bg-gray-600 px-2 py-1 rounded-full">
                    {selectedItem.type}
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-300">
                    <span className="text-gray-400">Sjeldenhet:</span>{' '}
                    <span className={`${
                      selectedItem.rarity === 'common' ? 'text-gray-300' :
                      selectedItem.rarity === 'uncommon' ? 'text-green-400' :
                      selectedItem.rarity === 'rare' ? 'text-blue-400' :
                      selectedItem.rarity === 'epic' ? 'text-purple-400' :
                      'text-yellow-400'
                    }`}>
                      {selectedItem.rarity}
                    </span>
                  </div>
                  <div className="text-gray-300">
                    <span className="text-gray-400">Standardverdi:</span>{' '}
                    <span className="text-yellow-400">{selectedItem.value} gull</span>
                  </div>
                </div>

                {/* Grunnleggende egenskaper */}
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-yellow-300 mb-2">Grunnleggende egenskaper:</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedItem.strength > 0 && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Styrke:</span>{' '}
                        <span className="text-green-400">+{selectedItem.strength}</span>
                      </div>
                    )}
                    {selectedItem.defense > 0 && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Forsvar:</span>{' '}
                        <span className="text-green-400">+{selectedItem.defense}</span>
                      </div>
                    )}
                    {selectedItem.health > 0 && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Helse:</span>{' '}
                        <span className="text-green-400">+{selectedItem.health}</span>
                      </div>
                    )}
                    {selectedItem.mana > 0 && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Mana:</span>{' '}
                        <span className="text-green-400">+{selectedItem.mana}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistikker */}
                {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-yellow-300 mb-2">Statistikker:</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedItem.stats).map(([stat, value]) => (
                        <div key={stat} className="text-gray-300">
                          <span className="text-gray-400">{stat}:</span>{' '}
                          <span className="text-green-400">+{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bonuser */}
                {selectedItem.bonuses && Object.keys(selectedItem.bonuses).length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-yellow-300 mb-2">Bonuser:</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedItem.bonuses).map(([bonus, value]) => (
                        <div key={bonus} className="text-gray-300">
                          <span className="text-gray-400">{bonus}:</span>{' '}
                          <span className="text-blue-400">+{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Effekter */}
                {selectedItem.effects && Object.keys(selectedItem.effects).length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-yellow-300 mb-2">Effekter:</h5>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {Object.entries(selectedItem.effects).map(([effect, value]) => (
                        <div key={effect} className="text-gray-300">
                          <span className="text-gray-400">{effect}:</span>{' '}
                          <span className="text-purple-400">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Krav */}
                {selectedItem.requirements && Object.keys(selectedItem.requirements).length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-yellow-300 mb-2">Krav:</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(selectedItem.requirements).map(([req, value]) => (
                        <div key={req} className="text-gray-300">
                          <span className="text-gray-400">{req}:</span>{' '}
                          <span className="text-red-400">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium text-yellow-300 mb-2">Velg byer</h4>
                <div className="grid grid-cols-2 gap-2">
                  {cities.map(city => (
                    <label
                      key={city.id}
                      className="flex items-center space-x-2 p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCities.includes(city.id)}
                        onChange={() => handleCityToggle(city.id)}
                        className="form-checkbox text-yellow-500"
                      />
                      <span className="text-gray-300">{city.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-yellow-300 mb-2">Pris</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value))}
                    min="1"
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-yellow-300 mb-2">Lagerbeholdning</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value))}
                    min="0"
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-yellow-300 mb-2">Respawn-tid (sekunder)</label>
                  <input
                    type="number"
                    value={respawnTimer}
                    onChange={(e) => setRespawnTimer(parseInt(e.target.value))}
                    min="0"
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    {respawnTimer < 60 
                      ? `${respawnTimer} sekunder`
                      : respawnTimer < 3600
                        ? `${Math.floor(respawnTimer / 60)} minutter`
                        : `${Math.floor(respawnTimer / 3600)} timer ${Math.floor((respawnTimer % 3600) / 60)} minutter`}
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Lagre endringer
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-center py-8">
              Velg en gjenstand fra listen til venstre for å begynne
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 