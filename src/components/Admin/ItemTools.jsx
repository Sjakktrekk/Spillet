import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ItemTools = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    type: 'weapon',
    slot: 'mainHand',
    rarity: 'common',
    defense: 0,
    damage: 0,
    vitality_bonus: 0,
    value: 0,
    image_url: '',
    effect: '',
    effect_value: 0,
    attributes: {}
  });

  // Legg til konstant for slot-typer
  const slotTypes = [
    { value: 'all', label: 'Alle' },
    { value: 'head', label: 'Hode' },
    { value: 'chest', label: 'Bryst' },
    { value: 'pants', label: 'Bukser' },
    { value: 'belt', label: 'Belte' },
    { value: 'boots', label: 'Støvler' },
    { value: 'gloves', label: 'Hansker' },
    { value: 'bracers', label: 'Armringer' },
    { value: 'shoulder', label: 'Skuldre' },
    { value: 'mainHand', label: 'Hovedhånd' },
    { value: 'offHand', label: 'Andre hånd' },
    { value: 'ring', label: 'Ring' },
    { value: 'amulet', label: 'Amulett' }
  ];

  // Funksjon for å få fargekode basert på sjeldenhet
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-200';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-200';
    }
  };

  // Funksjon for å filtrere gjenstander
  const getFilteredItems = () => {
    return items.filter(item => 
      selectedSlot === 'all' || item.slot === selectedSlot
    );
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching items:', error);
        toast.error('Kunne ikke hente gjenstander: ' + error.message);
        return;
      }

      setItems(data);
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('En uventet feil oppstod');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Sjekk filtype
    if (!file.type.startsWith('image/')) {
      toast.error('Vennligst velg en bildefil');
      return;
    }

    // Sjekk filstørrelse (maks 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Bildet må være mindre enn 2MB');
      return;
    }

    setImageFile(file);

    // Vis forhåndsvisning
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);
      
      // Sjekk om brukeren er autentisert
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Du må være logget inn for å laste opp bilder');
      }
      
      // Generer et unikt filnavn
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `items/${fileName}`;

      // Last opp til Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading:', uploadError);
        throw new Error(`Kunne ikke laste opp bilde: ${uploadError.message}`);
      }

      // Hent offentlig URL
      const { data: { publicUrl }, error: urlError } = await supabase.storage
        .from('game-assets')
        .getPublicUrl(filePath);

      if (urlError) {
        throw new Error('Kunne ikke hente bilde-URL');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Kunne ikke laste opp bilde');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = newItem.image_url;

      // Last opp bilde hvis det finnes
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
        if (!finalImageUrl) {
          throw new Error('Kunne ikke laste opp bilde');
        }
      }

      // Samle all data for gjenstanden
      const itemData = {
        name: newItem.name,
        description: newItem.description,
        type: newItem.type,
        slot: newItem.type === 'consumable' ? null : newItem.slot, // Forbruksvarer trenger ikke slot
        rarity: newItem.rarity,
        defense: newItem.defense,
        damage: newItem.damage,
        vitality_bonus: newItem.vitality_bonus,
        value: newItem.value,
        image_url: finalImageUrl,
        effect: newItem.type === 'consumable' ? newItem.effect : null,
        effect_value: newItem.type === 'consumable' ? newItem.effect_value : null
      };

      // Lagre i databasen
      const { error } = await supabase
        .from('items')
        .insert([itemData]);

      if (error) {
        throw error;
      }

      toast.success('Gjenstand opprettet!');
      fetchItems(); // Oppdater gjenstander
      
      // Tilbakestill skjemaet
      setNewItem({
        name: '',
        description: '',
        type: 'weapon',
        slot: 'mainHand',
        rarity: 'common',
        defense: 0,
        damage: 0,
        vitality_bonus: 0,
        value: 0,
        image_url: '',
        effect: '',
        effect_value: 0
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Kunne ikke opprette gjenstand: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      // Slett først bildet hvis det finnes
      const itemToDelete = items.find(item => item.id === itemId);
      if (itemToDelete?.image_url) {
        const imagePath = itemToDelete.image_url.split('/').pop();
        await supabase.storage
          .from('game-assets')
          .remove([`items/${imagePath}`]);
      }

      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting item:', error);
        toast.error('Kunne ikke slette gjenstand: ' + error.message);
        return;
      }

      toast.success('Gjenstand slettet');
      fetchItems();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('En uventet feil oppstod');
    }
  };

  const handleEditClick = (item) => {
    setEditingItem({...item});
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = editingItem.image_url;

      // Last opp bilde hvis det finnes nytt
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
        if (!finalImageUrl) {
          throw new Error('Kunne ikke laste opp bilde');
        }
      }

      // Samle all data for gjenstanden
      const itemData = {
        name: editingItem.name,
        description: editingItem.description,
        type: editingItem.type,
        slot: editingItem.type === 'consumable' ? null : editingItem.slot, // Forbruksvarer trenger ikke slot
        rarity: editingItem.rarity,
        defense: editingItem.defense,
        damage: editingItem.damage,
        vitality_bonus: editingItem.vitality_bonus,
        value: editingItem.value,
        image_url: finalImageUrl,
        effect: editingItem.type === 'consumable' ? editingItem.effect : null,
        effect_value: editingItem.type === 'consumable' ? editingItem.effect_value : null
      };

      // Oppdater i databasen
      const { error } = await supabase
        .from('items')
        .update(itemData)
        .eq('id', editingItem.id);

      if (error) {
        throw error;
      }

      toast.success('Gjenstand oppdatert!');
      fetchItems(); // Oppdater gjenstander
      setShowEditModal(false);
      setEditingItem(null);
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Kunne ikke oppdatere gjenstand: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-yellow-500">Gjenstandsadministrasjon</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">Opprett ny gjenstand</h3>
          <form onSubmit={handleCreateItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Navn</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Beskrivelse</label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400
                  focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Type</label>
              <select
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="weapon">Våpen</option>
                <option value="armor">Rustning</option>
                <option value="consumable">Forbruksvare</option>
                <option value="quest">Quest-gjenstand</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Sjeldenhet</label>
              <select
                value={newItem.rarity}
                onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="common">Vanlig</option>
                <option value="uncommon">Uvanlig</option>
                <option value="rare">Sjelden</option>
                <option value="epic">Episk</option>
                <option value="legendary">Legendarisk</option>
              </select>
            </div>

            {/* Vis slot-feltet bare når typen ikke er forbruksvare */}
            {newItem.type !== 'consumable' && (
              <div>
                <label className="block text-sm font-medium text-gray-300">Slot</label>
                <select
                  value={newItem.slot}
                  onChange={(e) => setNewItem({ ...newItem, slot: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="head">Hode</option>
                  <option value="chest">Bryst</option>
                  <option value="pants">Bukser</option>
                  <option value="belt">Belte</option>
                  <option value="boots">Støvler</option>
                  <option value="gloves">Hansker</option>
                  <option value="bracers">Armringer</option>
                  <option value="shoulder">Skuldre</option>
                  <option value="mainHand">Hovedhånd</option>
                  <option value="offHand">Andre hånd</option>
                  <option value="ring">Ring</option>
                  <option value="amulet">Amulett</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300">Skade</label>
              <input
                type="number"
                value={newItem.damage}
                onChange={(e) => setNewItem({ ...newItem, damage: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Forsvar</label>
              <input
                type="number"
                value={newItem.defense}
                onChange={(e) => setNewItem({ ...newItem, defense: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Vitalitet bonus</label>
              <input
                type="number"
                value={newItem.vitality_bonus}
                onChange={(e) => setNewItem({ ...newItem, vitality_bonus: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Verdi</label>
              <input
                type="number"
                value={newItem.value}
                onChange={(e) => setNewItem({ ...newItem, value: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {/* Effektfelter for forbruksvarer */}
            {newItem.type === 'consumable' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Effekttype</label>
                  <select
                    value={newItem.effect}
                    onChange={(e) => setNewItem({ ...newItem, effect: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Velg effekt</option>
                    <option value="restore_health">Gjenopprett helse</option>
                    <option value="restore_energy">Gjenopprett energi</option>
                    <option value="max_health">Øk makshelse</option>
                    <option value="magic_power">Øk magisk kraft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Effektverdi</label>
                  <input
                    type="number"
                    value={newItem.effect_value}
                    onChange={(e) => setNewItem({ ...newItem, effect_value: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300">Bilde</label>
              <div className="mt-1 flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700"
                />
                {imagePreview && (
                  <div className="relative w-20 h-20">
                    <img
                      src={imagePreview}
                      alt="Forhåndsvisning"
                      className="w-full h-full object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Eller angi bilde-URL manuelt:
              </p>
              <input
                type="text"
                value={newItem.image_url}
                onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                placeholder="https://..."
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400
                  focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className={`w-full ${
                uploading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
              } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
            >
              {uploading ? 'Laster opp...' : 'Opprett gjenstand'}
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">Eksisterende gjenstander</h3>
          
          {/* Filtreringsvalg */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Filtrer etter slot:</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full rounded-md bg-gray-700 border-gray-600 text-white
                focus:border-blue-500 focus:ring-blue-500"
            >
              {slotTypes.map(slot => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          </div>

          {/* Liste over gjenstander */}
          <div className="space-y-2">
            {getFilteredItems().map(item => (
              <div 
                key={item.id} 
                className="relative flex items-center justify-between bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors group"
              >
                {/* Gjenstandsinfo */}
                <div className="flex items-center space-x-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  )}
                  <div>
                    <h4 className={`font-medium ${getRarityColor(item.rarity)}`}>{item.name}</h4>
                    <p className="text-sm text-gray-400">{slotTypes.find(s => s.value === item.slot)?.label || item.slot}</p>
                  </div>
                </div>

                {/* Handlingsknapper */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="text-blue-400 hover:text-blue-300 bg-gray-800 p-2 rounded-full"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-400 hover:text-red-300 bg-gray-800 p-2 rounded-full"
                  >
                    🗑️
                  </button>
                </div>

                {/* Tooltip */}
                <div className="absolute z-10 w-72 bg-gray-800 p-4 rounded-lg border border-gray-600 shadow-lg
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200 left-full ml-2 -translate-y-1/2 top-1/2">
                  <h4 className={`font-medium ${getRarityColor(item.rarity)} mb-2`}>{item.name}</h4>
                  <p className="text-sm text-gray-300 mb-2">{item.description}</p>
                  <div className="space-y-1 text-sm">
                    <p>Type: <span className="text-blue-400">{item.type}</span></p>
                    {item.slot && (
                      <p>Slot: <span className="text-green-400">{slotTypes.find(s => s.value === item.slot)?.label}</span></p>
                    )}
                    {item.damage > 0 && (
                      <p>Skade: <span className="text-red-400">{item.damage}</span></p>
                    )}
                    {item.defense > 0 && (
                      <p>Forsvar: <span className="text-blue-400">{item.defense}</span></p>
                    )}
                    {item.vitality_bonus > 0 && (
                      <p>Vitalitet bonus: <span className="text-yellow-400">+{item.vitality_bonus}</span></p>
                    )}
                    {item.effect && (
                      <p>Effekt: 
                        <span className="text-green-400">
                          {item.effect === 'restore_health' && ` Gjenoppretter ${item.effect_value} helse`}
                          {item.effect === 'restore_energy' && ` Gjenoppretter ${item.effect_value} energi`}
                          {item.effect === 'max_health' && ` +${item.effect_value} makshelse`}
                          {item.effect === 'magic_power' && ` +${item.effect_value} magisk kraft`}
                        </span>
                      </p>
                    )}
                    <p>Verdi: <span className="text-yellow-400">{item.value} coins</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Redigeringsmodal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-yellow-400">Rediger {editingItem.name}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Navn</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Beskrivelse</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Type</label>
                <select
                  value={editingItem.type}
                  onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="weapon">Våpen</option>
                  <option value="armor">Rustning</option>
                  <option value="consumable">Forbruksvare</option>
                  <option value="quest">Quest-gjenstand</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Sjeldenhet</label>
                <select
                  value={editingItem.rarity}
                  onChange={(e) => setEditingItem({ ...editingItem, rarity: e.target.value })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="common">Vanlig</option>
                  <option value="uncommon">Uvanlig</option>
                  <option value="rare">Sjelden</option>
                  <option value="epic">Episk</option>
                  <option value="legendary">Legendarisk</option>
                </select>
              </div>

              {/* Vis slot-feltet bare når typen ikke er forbruksvare */}
              {editingItem.type !== 'consumable' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300">Slot</label>
                  <select
                    value={editingItem.slot}
                    onChange={(e) => setEditingItem({ ...editingItem, slot: e.target.value })}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="head">Hode</option>
                    <option value="chest">Bryst</option>
                    <option value="pants">Bukser</option>
                    <option value="belt">Belte</option>
                    <option value="boots">Støvler</option>
                    <option value="gloves">Hansker</option>
                    <option value="bracers">Armringer</option>
                    <option value="shoulder">Skuldre</option>
                    <option value="mainHand">Hovedhånd</option>
                    <option value="offHand">Andre hånd</option>
                    <option value="ring">Ring</option>
                    <option value="amulet">Amulett</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300">Skade</label>
                <input
                  type="number"
                  value={editingItem.damage}
                  onChange={(e) => setEditingItem({ ...editingItem, damage: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Forsvar</label>
                <input
                  type="number"
                  value={editingItem.defense}
                  onChange={(e) => setEditingItem({ ...editingItem, defense: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Vitalitet bonus</label>
                <input
                  type="number"
                  value={editingItem.vitality_bonus}
                  onChange={(e) => setEditingItem({ ...editingItem, vitality_bonus: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Verdi</label>
                <input
                  type="number"
                  value={editingItem.value}
                  onChange={(e) => setEditingItem({ ...editingItem, value: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Effektfelter for forbruksvarer i redigeringsmodalen */}
              {editingItem.type === 'consumable' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Effekttype</label>
                    <select
                      value={editingItem.effect || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, effect: e.target.value })}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                        focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Velg effekt</option>
                      <option value="restore_health">Gjenopprett helse</option>
                      <option value="restore_energy">Gjenopprett energi</option>
                      <option value="max_health">Øk makshelse</option>
                      <option value="magic_power">Øk magisk kraft</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Effektverdi</label>
                    <input
                      type="number"
                      value={editingItem.effect_value || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, effect_value: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                        focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300">Bilde</label>
                <div className="mt-1 flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-300
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700"
                  />
                  {(imagePreview || editingItem.image_url) && (
                    <div className="relative w-20 h-20">
                      <img
                        src={imagePreview || editingItem.image_url}
                        alt="Forhåndsvisning"
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setEditingItem({ ...editingItem, image_url: '' });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  Eller angi bilde-URL manuelt:
                </p>
                <input
                  type="text"
                  value={editingItem.image_url}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400
                    focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`${
                    uploading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
                >
                  {uploading ? 'Laster opp...' : 'Lagre endringer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemTools; 