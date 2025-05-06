import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { SKILL_DATA } from '../../hooks/useSkills';

const QuestAdmin = ({ cities }) => {
  const [quests, setQuests] = useState([]);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    level: 1,
    reward_gold: 0,
    reward_xp: 0,
    reward_skill: null,
    location: '',
    quest_type: 'main',
    reward_items: []
  });
  
  // Skill reward state
  const [selectedSkill, setSelectedSkill] = useState('');
  const [skillAmount, setSkillAmount] = useState(1);
  
  // Liste over tilgjengelige ferdigheter
  const skillOptions = Object.keys(SKILL_DATA);
  
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
    
    // Oppdater reward_skill basert på valgt ferdighet og mengde
    let questData = { ...newQuest };
    
    if (selectedSkill && skillAmount > 0) {
      questData.reward_skill = {
        skill_name: selectedSkill,
        amount: skillAmount
      };
    } else {
      questData.reward_skill = null;
    }
    
    const { error } = await supabase
      .from('quests')
      .insert([questData]);

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
      reward_skill: null,
      location: '',
      quest_type: 'main',
      reward_items: []
    });
    setSelectedSkill('');
    setSkillAmount(1);
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
      .neq('id', 'placeholder'); // Sletter alle

    if (error) {
      toast.error('Kunne ikke slette oppdrag');
      return;
    }

    toast.success('Alle oppdrag slettet');
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
              <label className="block text-sm font-medium text-gray-300">Belønning (Ferdighetspoeng)</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-yellow-500 focus:ring-yellow-500"
                >
                  <option value="">Ingen ferdighetspoeng</option>
                  {skillOptions.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={skillAmount}
                  min="1"
                  max="10"
                  onChange={(e) => setSkillAmount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                    focus:border-yellow-500 focus:ring-yellow-500"
                  disabled={!selectedSkill}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {selectedSkill ? `Legg til ${skillAmount} ferdighetspoeng i ${selectedSkill}` : 'Velg en ferdighet for å gi ferdighetspoeng'}
              </p>
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
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-800">
            <tr>
              <th className="py-2 px-3 text-left">Tittel</th>
              <th className="py-2 px-3 text-left">Nivå</th>
              <th className="py-2 px-3 text-left">Belønning</th>
              <th className="py-2 px-3 text-left">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {quests.map(quest => (
              <tr key={quest.id} className="border-t border-gray-700">
                <td className="py-2 px-3">{quest.title}</td>
                <td className="py-2 px-3">{quest.level}</td>
                <td className="py-2 px-3">
                  <div>
                    <span className="text-yellow-400">{quest.reward_gold}</span> gull,{' '}
                    <span className="text-blue-400">{quest.reward_xp}</span> XP
                    {quest.reward_skill && (
                      <>, <span className="text-green-400">+{quest.reward_skill.amount} {quest.reward_skill.skill_name}</span></>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3">
                  <button 
                    onClick={() => handleDelete(quest.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Slett
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestAdmin; 