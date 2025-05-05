import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getTravelLog } from '../lib/travel';
import { travelEvents } from '../lib/travel';
import campBackground from '../assets/Camp.jpg';

export default function TravelJournal() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [travelLog, setTravelLog] = useState([]);

  useEffect(() => {
    // Redirect hvis ikke logget inn
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    async function loadTravelLog() {
      if (!user) return;

      try {
        // Hent reiseloggen fra databasen
        const journalEntries = await getTravelLog(user.id);
        setTravelLog(journalEntries);
      } catch (error) {
        console.error('Error loading travel log:', error);
        // Bruk dummy-data hvis hentingen feiler
        const dummyTravelLog = [
          {
            id: 1,
            user_id: user.id,
            from_city_id: 1,
            from_city: { name: 'Nordvik' },
            to_city_id: 2,
            to_city: { name: 'Østmyr' },
            event_id: 1,
            journal_entry: 'På vei fra Nordvik til Østmyr ble jeg angrepet av landeveisrøvere. Jeg klarte å overvinne dem og fikk noen verdifulle gjenstander.',
            outcome_success: true,
            traveled_at: new Date(Date.now() - 86400000 * 3).toISOString() // 3 dager siden
          },
          {
            id: 2,
            user_id: user.id,
            from_city_id: 2,
            from_city: { name: 'Østmyr' },
            to_city_id: 3,
            to_city: { name: 'Sørby' },
            event_id: 3,
            journal_entry: 'Jeg møtte en mystisk reisende på veien til Sørby. Personen virket suspekt, så jeg takket høflig nei til hans tilbud om å slå følge.',
            outcome_success: true,
            traveled_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 dager siden
          },
          {
            id: 3,
            user_id: user.id,
            from_city_id: 3,
            from_city: { name: 'Sørby' },
            to_city_id: 4,
            to_city: { name: 'Vestfjell' },
            event_id: 4,
            journal_entry: 'Et uvær nærmet seg mens jeg reiste til Vestfjell. Jeg forsøkte å komme meg fram før stormen, men ble fanget i uværet og ankom Vestfjell gjennomvåt og sliten.',
            outcome_success: false,
            traveled_at: new Date(Date.now() - 86400000).toISOString() // 1 dag siden
          }
        ];
        setTravelLog(dummyTravelLog);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadTravelLog();
    }
  }, [user, authLoading, navigate]);

  // Formater dato for visning
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster reisedagbok...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 text-gray-300"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${campBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">Reisedagbok</h1>
            <p className="mt-2 text-gray-400">Dine opplevelser på reiser rundt i verden</p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md transition-colors"
          >
            Tilbake til kartet
          </button>
        </div>

        {travelLog.length === 0 ? (
          <div className="bg-gray-800 bg-opacity-80 rounded-lg p-6 border border-gray-700 shadow-lg text-center">
            <div className="text-4xl mb-4">📖</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Ingen reiser ennå</h2>
            <p className="text-gray-400">
              Din reisedagbok er tom. Reis mellom byer for å fylle den med eventyr og opplevelser!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {travelLog
              .sort((a, b) => new Date(b.traveled_at) - new Date(a.traveled_at))
              .map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-800 bg-opacity-80 rounded-lg p-6 border border-gray-700 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <div className="flex items-center mb-3 sm:mb-0">
                      <div className={`w-3 h-3 rounded-full mr-3 ${entry.outcome_success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <h2 className="text-xl font-semibold text-gray-200">
                        {entry.from_city?.name} → {entry.to_city?.name}
                      </h2>
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatDate(entry.traveled_at)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 mb-4 italic">
                    "{entry.journal_entry || 'Ingen notater skrevet for denne reisen.'}"
                  </div>
                  
                  <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-200 mb-2">Hendelse under reisen:</h3>
                    {(() => {
                      const event = travelEvents.find(e => e.id === entry.event_id);
                      if (!event) return null;
                      return (
                        <>
                          <p className="text-gray-300 font-medium mb-2">{event.title}</p>
                          <p className="text-gray-400 text-sm">{event.description}</p>
                        </>
                      );
                    })()}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className={`${entry.outcome_success ? 'text-green-400' : 'text-red-400'} font-medium`}>
                      {entry.outcome_success ? 'Vellykket reise' : 'Utfordringer underveis'}
                    </div>
                    <button
                      onClick={() => navigate(`/city/${entry.to_city_id}`)}
                      className="text-yellow-500 hover:text-yellow-400"
                    >
                      Besøk {entry.to_city?.name} igjen
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
} 