import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const StudentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStudent(null);

    const { data, error } = await supabase
      .from('characters')
      .select(`
        *,
        users:user_id (
          username,
          email
        )
      `)
      .ilike('users.username', `%${searchTerm}%`)
      .limit(1);

    if (error) {
      toast.error('Kunne ikke søke etter elev');
      setLoading(false);
      return;
    }

    if (data.length === 0) {
      toast.error('Ingen elev funnet');
      setLoading(false);
      return;
    }

    setStudent(data[0]);
    setLoading(false);

    // Hent items for dropdown
    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*');

    if (itemsError) {
      toast.error('Kunne ikke hente gjenstander');
      return;
    }

    setItems(itemsData);
  };

  const handleAddXP = async () => {
    const amount = parseInt(prompt('Hvor mye XP vil du gi?'));
    if (isNaN(amount) || amount <= 0) return;

    const { error } = await supabase
      .from('characters')
      .update({ xp: student.xp + amount })
      .eq('id', student.id);

    if (error) {
      toast.error('Kunne ikke gi XP');
      return;
    }

    setStudent({ ...student, xp: student.xp + amount });
    toast.success(`${amount} XP gitt til ${student.users.username}`);
  };

  const handleAddCoins = async () => {
    const amount = parseInt(prompt('Hvor mye gull vil du gi?'));
    if (isNaN(amount) || amount <= 0) return;

    const { error } = await supabase
      .from('characters')
      .update({ coins: student.coins + amount })
      .eq('id', student.id);

    if (error) {
      toast.error('Kunne ikke gi gull');
      return;
    }

    setStudent({ ...student, coins: student.coins + amount });
    toast.success(`${amount} gull gitt til ${student.users.username}`);
  };

  const handleAddItem = async () => {
    if (!selectedItem) {
      toast.error('Velg en gjenstand å gi');
      return;
    }

    const { error } = await supabase
      .from('character_items')
      .insert([{
        character_id: student.id,
        item_id: selectedItem,
        quantity: 1
      }]);

    if (error) {
      toast.error('Kunne ikke gi gjenstand');
      return;
    }

    toast.success('Gjenstand gitt til elev');
    setSelectedItem('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-500 mb-6">Elevstyring</h2>

      {/* Søkefelt */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-yellow-400">Søk etter elev</h3>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Brukernavn</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                focus:border-yellow-500 focus:ring-yellow-500"
              placeholder="Skriv brukernavn..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? 'bg-gray-600' : 'bg-yellow-600 hover:bg-yellow-700'
            } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200`}
          >
            {loading ? 'Søker...' : 'Søk'}
          </button>
        </form>
      </div>

      {/* Elevinfo */}
      {student && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">
            {student.users.username} - {student.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <p className="text-gray-300">Level: <span className="text-white">{student.level}</span></p>
              <p className="text-gray-300">XP: <span className="text-blue-400">{student.xp}</span></p>
              <p className="text-gray-300">Gull: <span className="text-yellow-400">{student.coins}</span></p>
            </div>
            <div className="space-y-2">
              <p className="text-gray-300">Styrke: <span className="text-red-400">{student.strength}</span></p>
              <p className="text-gray-300">Intelligens: <span className="text-blue-400">{student.intelligence}</span></p>
              <p className="text-gray-300">Smidighet: <span className="text-green-400">{student.dexterity}</span></p>
            </div>
          </div>

          {/* Handlingsknapper */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={handleAddXP}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  transition-colors duration-200"
              >
                Gi XP
              </button>
              <button
                onClick={handleAddCoins}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  transition-colors duration-200"
              >
                Gi Gull
              </button>
            </div>

            <div className="flex gap-4">
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="flex-1 rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
              >
                <option value="">Velg gjenstand...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <button
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                  transition-colors duration-200"
              >
                Gi Gjenstand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement; 