import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const AchievementAdmin = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [titles, setTitles] = useState([]);
  const [customReward, setCustomReward] = useState('');
  const [useCustomReward, setUseCustomReward] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    id: '',
    name: '',
    description: '',
    category: 'generelt',
    difficulty: 'lett',
    icon: '🏆',
    total: 1,
    reward: '',
    tracking_type: 'none',
    stat_key: ''
  });

  const trackingTypes = [
    { value: 'none', label: 'Ingen automatisk telling' },
    { value: 'login_count', label: 'Antall innlogginger' },
    { value: 'quests_completed', label: 'Fullførte oppdrag' },
    { value: 'messages_count', label: 'Sendte meldinger' },
    { value: 'items_collected', label: 'Samlede gjenstander' },
    { value: 'monsters_killed', label: 'Beseirede monstre' },
    { value: 'gold_earned', label: 'Opptjent gull' },
    { value: 'cities_visited', label: 'Besøkte byer' },
    { value: 'distance_traveled', label: 'Tilbakelagt avstand' },
    { value: 'items_crafted', label: 'Laget gjenstander' },
    { value: 'resources_gathered', label: 'Samlede råvarer' },
    { value: 'battles_won', label: 'Vunne kamper' }
  ];

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .order('id');
        
        if (error) throw error;
        setAchievements(data || []);
      } catch (error) {
        toast.error('Kunne ikke laste prestasjoner: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
    fetchTitles();
  }, []);

  const fetchTitles = async () => {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTitles(data || []);
    } catch (error) {
      console.error('Kunne ikke laste titler:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'tracking_type') {
      const newValue = value === 'none' ? '' : value;
      setNewAchievement({
        ...newAchievement,
        tracking_type: value,
        stat_key: newValue
      });
    } else {
      setNewAchievement({
        ...newAchievement,
        [name]: value
      });
    }
  };

  const handleTitleSelect = (e) => {
    const titleName = e.target.value;
    if (titleName === 'custom') {
      setUseCustomReward(true);
    } else {
      setUseCustomReward(false);
      setNewAchievement({
        ...newAchievement,
        reward: titleName ? `Tittel: ${titleName}` : ''
      });
    }
  };

  const handleCustomRewardChange = (e) => {
    setCustomReward(e.target.value);
    setNewAchievement({
      ...newAchievement,
      reward: e.target.value
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'tracking_type') {
      const newValue = value === 'none' ? '' : value;
      setEditingAchievement({
        ...editingAchievement,
        tracking_type: value,
        stat_key: newValue
      });
    } else {
      setEditingAchievement({
        ...editingAchievement,
        [name]: value
      });
    }
  };

  const handleEditTitleSelect = (e) => {
    const titleName = e.target.value;
    if (titleName === 'custom') {
      // Behold nåværende verdi men la brukeren redigere manuelt
    } else {
      setEditingAchievement({
        ...editingAchievement,
        reward: titleName ? `Tittel: ${titleName}` : ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const achievementData = {
        ...newAchievement
      };
      
      const { tracking_type, ...dataToInsert } = achievementData;
      
      const { error } = await supabase
        .from('achievements')
        .insert([dataToInsert]);
      
      if (error) throw error;
      
      toast.success('Prestasjon lagt til!');
      setNewAchievement({
        id: '',
        name: '',
        description: '',
        category: 'generelt',
        difficulty: 'lett',
        icon: '🏆',
        total: 1,
        reward: '',
        tracking_type: 'none',
        stat_key: ''
      });
      setUseCustomReward(false);
      setCustomReward('');
      
      const { data, error: fetchError } = await supabase
        .from('achievements')
        .select('*')
        .order('id');
      
      if (fetchError) throw fetchError;
      setAchievements(data || []);
      
    } catch (error) {
      toast.error('Kunne ikke legge til prestasjon: ' + error.message);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { tracking_type, ...dataToUpdate } = editingAchievement;
      
      const { error } = await supabase
        .from('achievements')
        .update(dataToUpdate)
        .eq('id', editingAchievement.id);
      
      if (error) throw error;
      
      toast.success('Prestasjon oppdatert!');
      setShowEditModal(false);
      
      setAchievements(achievements.map(ach => 
        ach.id === editingAchievement.id ? editingAchievement : ach
      ));
      
    } catch (error) {
      toast.error('Kunne ikke oppdatere prestasjon: ' + error.message);
    }
  };

  const handleEdit = (achievement) => {
    const trackingType = achievement.stat_key ? achievement.stat_key : 'none';
    setEditingAchievement({...achievement, tracking_type: trackingType});
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Er du sikker på at du vil slette denne prestasjonen?')) return;
    
    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Prestasjon slettet!');
      setAchievements(achievements.filter(a => a.id !== id));
    } catch (error) {
      toast.error('Kunne ikke slette prestasjon: ' + error.message);
    }
  };

  // Parse reward for å se om det er en tittelbelønning
  const isTitleReward = (reward) => {
    if (!reward) return false;
    return reward.toLowerCase().includes('tittel:');
  };

  // Hent tittelnavnet fra belønningen
  const getTitleFromReward = (reward) => {
    if (!reward) return '';
    const lowerReward = reward.toLowerCase();
    if (!lowerReward.includes('tittel:')) return '';
    
    const titleStart = lowerReward.indexOf('tittel:') + 7;
    let titleEnd = lowerReward.indexOf(',', titleStart);
    if (titleEnd === -1) titleEnd = reward.length;
    
    return reward.substring(titleStart, titleEnd).trim();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-500">Prestasjonsadministrasjon</h2>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-yellow-400">Legg til ny prestasjon</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">ID (unik identifikator)</label>
              <input
                type="text"
                name="id"
                value={newAchievement.id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Navn</label>
              <input
                type="text"
                name="name"
                value={newAchievement.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300">Beskrivelse</label>
              <textarea
                name="description"
                value={newAchievement.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                rows="2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Kategori</label>
              <select
                name="category"
                value={newAchievement.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                required
              >
                <option value="generelt">Generelt</option>
                <option value="utforskning">Utforskning</option>
                <option value="oppdrag">Oppdrag</option>
                <option value="sosialt">Sosialt</option>
                <option value="kamp">Kamp</option>
                <option value="inventar">Inventar</option>
                <option value="handel">Handel</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Vanskelighetsgrad</label>
              <select
                name="difficulty"
                value={newAchievement.difficulty}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                required
              >
                <option value="lett">Lett</option>
                <option value="medium">Medium</option>
                <option value="vanskelig">Vanskelig</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Ikon (emoji)</label>
              <input
                type="text"
                name="icon"
                value={newAchievement.icon}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                placeholder="F.eks. 🏆, 🌟, 🎯"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Type telling</label>
              <select
                name="tracking_type"
                value={newAchievement.tracking_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
              >
                {trackingTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Velg hvilken statistikk som skal spores automatisk for denne prestasjonen
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Mål (antall)</label>
              <input
                type="number"
                name="total"
                value={newAchievement.total}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                min="1"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300">Belønning</label>
              <div className="flex space-x-2">
                <select
                  onChange={handleTitleSelect}
                  className="mt-1 flex-1 rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-yellow-500 focus:ring-yellow-500"
                >
                  <option value="">-- Velg belønning --</option>
                  <optgroup label="Titler">
                    {titles.map(title => (
                      <option key={title.name} value={title.name}>
                        Tittel: {title.name} ({title.rarity})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">Egendefinert belønning</option>
                </select>
                
                {useCustomReward && (
                  <input
                    type="text"
                    value={customReward}
                    onChange={handleCustomRewardChange}
                    className="mt-1 flex-1 rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    placeholder="F.eks. '100 XP, 50 Gull'"
                    required
                  />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Velg en tittel eller angi en egendefinert belønning
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md
                focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800
                transition-colors duration-200"
            >
              Legg til prestasjon
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">Alle prestasjoner</h3>
          {achievements.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Ingen prestasjoner funnet</p>
          ) : (
            <div className="space-y-4">
              {achievements.map(achievement => (
                <div key={achievement.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between">
                    <div className="flex">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-xl mr-3">
                        {achievement.icon || '🏆'}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{achievement.name}</h4>
                        <p className="text-sm text-gray-300 mt-1">{achievement.description}</p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-400">
                          <span>ID: {achievement.id}</span>
                          <span>Kategori: {achievement.category || 'N/A'}</span>
                          <span>Vanskelighetsgrad: {achievement.difficulty || 'N/A'}</span>
                          <span>Mål: {achievement.total || 1}</span>
                          <span>Belønning: {achievement.reward || 'Ingen'}</span>
                          {achievement.stat_key && (
                            <span>Sporer: {trackingTypes.find(t => t.value === achievement.stat_key)?.label || achievement.stat_key}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(achievement)}
                        className="text-blue-400 hover:text-blue-300 bg-gray-800 p-2 rounded-full
                          transition-colors duration-200"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(achievement.id)}
                        className="text-red-400 hover:text-red-300 bg-gray-800 p-2 rounded-full
                          transition-colors duration-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEditModal && editingAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-yellow-400">Rediger prestasjon</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">ID</label>
                  <input
                    type="text"
                    value={editingAchievement.id}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Navn</label>
                  <input
                    type="text"
                    name="name"
                    value={editingAchievement.name}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Kategori</label>
                  <select
                    name="category"
                    value={editingAchievement.category}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  >
                    <option value="generelt">Generelt</option>
                    <option value="utforskning">Utforskning</option>
                    <option value="oppdrag">Oppdrag</option>
                    <option value="sosialt">Sosialt</option>
                    <option value="kamp">Kamp</option>
                    <option value="inventar">Inventar</option>
                    <option value="handel">Handel</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">Beskrivelse</label>
                  <textarea
                    name="description"
                    value={editingAchievement.description}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    rows="2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Vanskelighetsgrad</label>
                  <select
                    name="difficulty"
                    value={editingAchievement.difficulty}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  >
                    <option value="lett">Lett</option>
                    <option value="medium">Medium</option>
                    <option value="vanskelig">Vanskelig</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Ikon (emoji)</label>
                  <input
                    type="text"
                    name="icon"
                    value={editingAchievement.icon}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Type telling</label>
                  <select
                    name="tracking_type"
                    value={editingAchievement.tracking_type}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                  >
                    {trackingTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Mål (antall)</label>
                  <input
                    type="number"
                    name="total"
                    value={editingAchievement.total}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    min="1"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">Belønning</label>
                  <div className="flex flex-col md:flex-row md:space-x-2 space-y-2 md:space-y-0">
                    <select
                      onChange={handleEditTitleSelect}
                      className="mt-1 w-full md:w-1/2 rounded-md bg-gray-700 border-gray-600 text-white
                        focus:border-yellow-500 focus:ring-yellow-500"
                      value={isTitleReward(editingAchievement.reward) ? getTitleFromReward(editingAchievement.reward) : 'custom'}
                    >
                      <optgroup label="Titler">
                        {titles.map(title => (
                          <option key={title.name} value={title.name}>
                            Tittel: {title.name} ({title.rarity})
                          </option>
                        ))}
                      </optgroup>
                      <option value="custom">Egendefinert belønning</option>
                    </select>
                    
                    <input
                      type="text"
                      name="reward"
                      value={editingAchievement.reward}
                      onChange={handleEditChange}
                      className="mt-1 w-full md:w-1/2 rounded-md bg-gray-700 border-gray-600 text-white
                        focus:border-yellow-500 focus:ring-yellow-500"
                      placeholder="F.eks. 'Tittel: Utforsker', '100 gull', etc."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="mr-2 px-4 py-2 text-sm font-medium text-gray-500 bg-gray-700 rounded-md border border-gray-600
                    hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md
                    hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  Lagre endringer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementAdmin; 