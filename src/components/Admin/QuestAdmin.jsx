import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const QuestAdmin = ({ cities }) => {
  const [quests, setQuests] = useState([]);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    level: 1,
    reward_gold: 0,
    reward_xp: 0,
    location: '',
    quest_type: 'main',
    reward_items: []
  });

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Kunne ikke hente oppdrag');
      return;
    }

    setQuests(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('quests')
      .insert([newQuest]);

    if (error) {
      toast.error('Kunne ikke opprette oppdrag');
      return;
    }

    toast.success('Oppdrag opprettet!');
    setNewQuest({
      title: '',
      description: '',
      level: 1,
      reward_gold: 0,
      reward_xp: 0,
      location: '',
      quest_type: 'main',
      reward_items: []
    });
    fetchQuests();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Er du sikker på at du vil slette dette oppdraget?')) return;

    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Kunne ikke slette oppdrag');
      return;
    }

    toast.success('Oppdrag slettet');
    fetchQuests();
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Er du sikker på at du vil slette ALLE oppdrag? Dette kan ikke angres.')) return;

    const { error } = await supabase
      .from('quests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Sletter alle oppdrag

    if (error) {
      toast.error('Kunne ikke slette oppdrag');
      return;
    }

    toast.success('Alle oppdrag er slettet');
    fetchQuests();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-yellow-500">Quest-administrasjon</h2>
        <button
          onClick={handleDeleteAll}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800
            transition-colors duration-200"
        >
          Slett alle oppdrag
        </button>
      </div>
      
      {/* Opprett ny quest */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-yellow-400">Opprett nytt oppdrag</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Tittel</label>
              <input
                type="text"
                value={newQuest.title}
                onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Nivå</label>
              <input
                type="number"
                value={newQuest.level}
                onChange={(e) => setNewQuest({ ...newQuest, level: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                min="1"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300">Beskrivelse</label>
              <textarea
                value={newQuest.description}
                onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                rows="3"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Belønning (Gull)</label>
              <input
                type="number"
                value={newQuest.reward_gold}
                onChange={(e) => setNewQuest({ ...newQuest, reward_gold: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Belønning (XP)</label>
              <input
                type="number"
                value={newQuest.reward_xp}
                onChange={(e) => setNewQuest({ ...newQuest, reward_xp: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Lokasjon</label>
              <select
                value={newQuest.location}
                onChange={(e) => setNewQuest({ ...newQuest, location: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                required
              >
                <option value="">Velg lokasjon</option>
                {cities.map(city => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Type</label>
              <select
                value={newQuest.quest_type}
                onChange={(e) => setNewQuest({ ...newQuest, quest_type: e.target.value })}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                required
              >
                <option value="main">Hovedoppdrag</option>
                <option value="side">Sideoppdrag</option>
                <option value="daily">Daglig oppdrag</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md
                focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800
                transition-colors duration-200"
            >
              Opprett oppdrag
            </button>
          </div>
        </form>
      </div>

      {/* Eksisterende oppdrag */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-yellow-400">Eksisterende oppdrag</h3>
        <div className="space-y-4">
          {quests.map(quest => (
            <div 
              key={quest.id} 
              className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-white">{quest.title}</h4>
                  <p className="text-sm text-gray-300 mt-1">{quest.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <span className="text-sm text-gray-400">Nivå: {quest.level}</span>
                    <span className="text-sm text-yellow-400">Gull: {quest.reward_gold}</span>
                    <span className="text-sm text-blue-400">XP: {quest.reward_xp}</span>
                    <span className="text-sm text-gray-400">Lokasjon: {quest.location}</span>
                    <span className="text-sm text-gray-400">Type: {quest.quest_type}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(quest.id)}
                  className="text-red-400 hover:text-red-300 bg-gray-800 p-2 rounded-full
                    transition-colors duration-200"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestAdmin; 