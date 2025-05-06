import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QuestAdmin from './QuestAdmin';
import QuestSubmissions from './QuestSubmissions';
import ItemTools from './ItemTools';
import StudentManagement from './StudentManagement';
import AchievementAdmin from './AchievementAdmin';
import TitleAdmin from './TitleAdmin';
import TravelEventsAdmin from './TravelEventsAdmin';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('quests');
  const [cities, setCities] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Sjekk admin-tilgang ved lasting
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Hardkodet løsning for admin-sjekk
        if (user.id === '4105763b-0041-498e-8d7f-a9448565903d') {
          console.log('Admin-bruker oppdaget i AdminDashboard');
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Hvis ikke hardkodet admin, prøv å sjekke admin_users-tabellen
        try {
          const { data, error } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', user.id)
            .single();
          
          if (error || !data) {
            toast.error('Du har ikke tilgang til adminsiden');
            navigate('/');
            return;
          }

          setIsAdmin(true);
        } catch (err) {
          console.error('Feil ved sjekk av admin-status:', err);
          toast.error('Du har ikke admin-tilgang');
          navigate('/');
          return;
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Feil ved sjekk av admin-status:', err);
        toast.error('En feil oppstod ved sjekk av tilgang');
        navigate('/');
      }
    };

    checkAdmin();
  }, [navigate]);

  // Hent byer ved lasting
  useEffect(() => {
    const fetchCities = async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*');
      
      if (error) {
        toast.error('Kunne ikke hente byer');
        return;
      }
      
      setCities(data);
    };
    
    if (isAdmin) {
      fetchCities();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Sjekker tilgang...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700">
          {/* Navigasjonsmeny */}
          <div className="border-b border-gray-700">
            <nav className="flex space-x-1 p-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('quests')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'quests'
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Quest-administrasjon
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'submissions'
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Quest-innleveringer
              </button>
              <button
                onClick={() => setActiveTab('items')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'items'
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Item-verktøy
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'students'
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Elevstyring
              </button>
              <button
                onClick={() => setActiveTab('travel')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'travel'
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Reisehendelser
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'achievements'
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Prestasjoner
              </button>
              <button
                onClick={() => setActiveTab('titles')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  activeTab === 'titles'
                    ? 'bg-yellow-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Titler
              </button>
            </nav>
          </div>

          {/* Innhold */}
          <div className="p-6">
            {activeTab === 'quests' && <QuestAdmin cities={cities} />}
            {activeTab === 'submissions' && <QuestSubmissions />}
            {activeTab === 'items' && <ItemTools />}
            {activeTab === 'students' && <StudentManagement />}
            {activeTab === 'achievements' && <AchievementAdmin />}
            {activeTab === 'titles' && <TitleAdmin />}
            {activeTab === 'travel' && <TravelEventsAdmin />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 