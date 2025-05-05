import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const QuestSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      // Først henter vi bare quest submissions uten relasjoner
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('quest_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        toast.error('Kunne ikke hente innleveringer');
        return;
      }

      // Logg data for debugging
      console.log('Submissions data:', submissionsData);

      // Nå henter vi quest-data for hver submission
      const submissionsWithQuests = await Promise.all(
        submissionsData.map(async (submission) => {
          const { data: questData, error: questError } = await supabase
            .from('quests')
            .select('title, description')
            .eq('id', submission.quest_id)
            .single();

          if (questError) {
            console.warn('Could not fetch quest data:', questError);
            return {
              ...submission,
              quests: { title: 'Ukjent oppdrag', description: '' }
            };
          }

          return {
            ...submission,
            quests: questData,
            user_email: 'Ukjent bruker' // Midlertidig
          };
        })
      );

      setSubmissions(submissionsWithQuests);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchSubmissions:', error);
      toast.error('Kunne ikke hente innleveringer');
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId) => {
    const { error } = await supabase
      .from('quest_submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId);

    if (error) {
      toast.error('Kunne ikke godkjenne innlevering');
      return;
    }

    toast.success('Innlevering godkjent!');
    fetchSubmissions();
  };

  const handleReject = async (submissionId) => {
    const { error } = await supabase
      .from('quest_submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId);

    if (error) {
      toast.error('Kunne ikke avvise innlevering');
      return;
    }

    toast.success('Innlevering avvist');
    fetchSubmissions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-500 mb-6">Quest-innleveringer</h2>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="space-y-4">
          {submissions.map(submission => (
            <div 
              key={submission.id} 
              className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <h4 className="text-lg font-medium text-white">{submission.quests.title}</h4>
                  <p className="text-sm text-gray-300 mt-1">{submission.quests.description}</p>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-400">Innlevert av: {submission.user_email}</p>
                    <p className="text-sm">
                      Status: <span className={`${
                        submission.status === 'approved' ? 'text-green-400' :
                        submission.status === 'rejected' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {submission.status === 'approved' ? 'Godkjent' :
                         submission.status === 'rejected' ? 'Avvist' :
                         'Venter på godkjenning'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Innlevert: {new Date(submission.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {submission.status === 'pending' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApprove(submission.id)}
                      className="text-green-400 hover:text-green-300 bg-gray-800 p-2 rounded-full
                        transition-colors duration-200"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleReject(submission.id)}
                      className="text-red-400 hover:text-red-300 bg-gray-800 p-2 rounded-full
                        transition-colors duration-200"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {submissions.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              Ingen innleveringer å vise
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestSubmissions; 