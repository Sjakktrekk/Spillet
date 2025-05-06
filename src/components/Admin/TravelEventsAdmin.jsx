import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { defaultTravelEvents } from '../../lib/travel';

const TravelEventsAdmin = () => {
  const [travelEvents, setTravelEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  
  // Items og ressurser
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  
  const skillOptions = ['Kamp', 'Utholdenhet', 'Utforskning', 'Overtalelse', 'Kunnskap'];
  
  // Ressurstyper
  const resourceTypes = [
    { id: 'wood', name: 'Tre' },
    { id: 'stone', name: 'Stein' },
    { id: 'herbs', name: 'Urter' },
    { id: 'ore', name: 'Malm' },
    { id: 'leather', name: 'Lær' },
    { id: 'fabric', name: 'Stoff' }
  ];
  
  // Array med antall for dropdown
  const quantityOptions = [1, 2, 3, 4, 5, 10, 15, 20];
  
  const emptyEvent = {
    id: null,
    title: '',
    description: '',
    type: 'travel',
    difficulty: 1,
    choices: [
      {
        id: 1,
        text: '',
        skill: 'Kamp',
        difficulty: 5,
        success: '',
        failure: '',
        successReward: { 
          gold: 0, 
          experience: 0, 
          health: 0, 
          energy: 0, 
          item: false, 
          item_id: null,
          item_quantity: 1,
          resource: false,
          resource_type: 'wood',
          resource_quantity: 1
        },
        failurePenalty: { gold: 0, experience: 0, health: 0, energy: 0 }
      },
      {
        id: 2,
        text: '',
        skill: 'Utforskning',
        difficulty: 5,
        success: '',
        failure: '',
        successReward: { 
          gold: 0, 
          experience: 0, 
          health: 0, 
          energy: 0, 
          item: false, 
          item_id: null,
          item_quantity: 1,
          resource: false,
          resource_type: 'wood',
          resource_quantity: 1
        },
        failurePenalty: { gold: 0, experience: 0, health: 0, energy: 0 }
      }
    ]
  };
  
  const [currentEvent, setCurrentEvent] = useState({...emptyEvent});
  
  // Hent reisehendelser - flyttet utenfor useEffect for gjenbruk
  const fetchTravelEvents = async () => {
    try {
      setLoading(true);
      // Sjekk om vi bruker en database eller lokal lagring
      const { data, error } = await supabase
        .from('travel_events')
        .select('*');
      
      if (error) {
        console.error('Kunne ikke hente reisehendelser fra databasen:', error);
        // Fall tilbake til lokale hendelser fra travel.js
        setTravelEvents([]);
      } else {
        // Sikre at choices-feltet er et array
        const validatedEvents = (data || []).map(event => {
          // Sjekk om choices er et array
          if (!Array.isArray(event.choices)) {
            console.warn(`Hendelse ${event.id} (${event.title}) har ikke choices som array. Setter tom array.`);
            return {...event, choices: []};
          }
          return event;
        });
        
        setTravelEvents(validatedEvents);
      }
    } catch (error) {
      console.error('Feil ved henting av reisehendelser:', error);
      setTravelEvents([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Hent reisehendelser ved lasting
  useEffect(() => {
    fetchTravelEvents();
  }, []);
  
  // Hent gjenstander
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('id, name, type, rarity')
          .order('name');
        
        if (error) {
          console.error('Kunne ikke hente gjenstander:', error);
          setItems([]);
        } else {
          setItems(data || []);
        }
      } catch (error) {
        console.error('Feil ved henting av gjenstander:', error);
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };
    
    fetchItems();
  }, []);
  
  const handleEditEvent = (event) => {
    setCurrentEvent(JSON.parse(JSON.stringify(event))); // Deep copy
    setIsEditing(true);
    setShowNewForm(true);
  };
  
  const handleCreateNew = () => {
    setCurrentEvent({...emptyEvent});
    setIsEditing(false);
    setShowNewForm(true);
  };
  
  const handleCancel = () => {
    setShowNewForm(false);
  };
  
  const handleSave = async () => {
    try {
      // Valider data
      if (!currentEvent.title || !currentEvent.description) {
        toast.error('Tittel og beskrivelse må fylles ut');
        return;
      }
      
      // Valider valg
      for (const choice of currentEvent.choices) {
        if (!choice.text || !choice.success || !choice.failure) {
          toast.error('Alle valg må ha tekst, suksessbeskrivelse og feilbeskrivelse');
          return;
        }
      }
      
      // Forbered data for lagring (bare de feltene tabellen forventer)
      const eventData = {
        title: currentEvent.title,
        description: currentEvent.description,
        choices: currentEvent.choices,
        type: currentEvent.type || 'travel',
        difficulty: currentEvent.difficulty || 1,
      };
      
      // Logger for debug
      console.log('Forsøker å lagre reisehendelse:', eventData);
      
      // Lagre til database
      if (isEditing) {
        const { error } = await supabase
          .from('travel_events')
          .update(eventData)
          .eq('id', currentEvent.id);
          
        if (error) {
          console.error('Detaljert feilinfo:', error);
          toast.error('Kunne ikke oppdatere reisehendelse: ' + error.message);
          return;
        }
        
        toast.success('Reisehendelse oppdatert');
      } else {
        // For nye hendelser, ikke inkluder ID-feltet (la databasen generere dette)
        const { data, error } = await supabase
          .from('travel_events')
          .insert(eventData)
          .select();
          
        if (error) {
          console.error('Detaljert feilinfo:', error);
          toast.error('Kunne ikke opprette reisehendelse: ' + error.message);
          return;
        }
        
        toast.success('Reisehendelse opprettet');
        
        // Legg til den nye hendelsen med ID fra databasen
        if (data && data.length > 0) {
          setTravelEvents([...travelEvents, data[0]]);
        } else {
          // Oppdater hele listen hvis vi ikke fikk ID tilbake
          fetchTravelEvents();
        }
      }
      
      setShowNewForm(false);
    } catch (error) {
      console.error('Unexpcted error during save:', error);
      toast.error('Feil ved lagring: ' + (error.message || 'Ukjent feil'));
    }
  };
  
  const handleChoiceChange = (index, field, value) => {
    const updatedChoices = [...currentEvent.choices];
    updatedChoices[index] = { ...updatedChoices[index], [field]: value };
    setCurrentEvent({ ...currentEvent, choices: updatedChoices });
  };
  
  const handleRewardChange = (index, isSuccess, field, value) => {
    const updatedChoices = [...currentEvent.choices];
    const rewardType = isSuccess ? 'successReward' : 'failurePenalty';
    
    // Spesialbehandling for checkbox-felter (item, resource)
    if (field === 'item' || field === 'resource') {
      updatedChoices[index] = { 
        ...updatedChoices[index], 
        [rewardType]: { 
          ...updatedChoices[index][rewardType],
          [field]: Boolean(value)
        } 
      };
    } 
    // Spesialbehandling for item_id, item_quantity, resource_type, resource_quantity
    else if (['item_id', 'item_quantity', 'resource_type', 'resource_quantity'].includes(field)) {
      updatedChoices[index] = { 
        ...updatedChoices[index], 
        [rewardType]: { 
          ...updatedChoices[index][rewardType],
          [field]: field.includes('quantity') ? Number(value) : value
        } 
      };
    }
    // Vanlige numeriske felter
    else {
      updatedChoices[index] = { 
        ...updatedChoices[index], 
        [rewardType]: { 
          ...updatedChoices[index][rewardType],
          [field]: Number(value)
        } 
      };
    }
    
    setCurrentEvent({ ...currentEvent, choices: updatedChoices });
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Er du sikker på at du vil slette denne reisehendelsen?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('travel_events')
        .delete()
        .eq('id', id);
        
      if (error) {
        toast.error('Kunne ikke slette reisehendelse: ' + error.message);
        return;
      }
      
      setTravelEvents(travelEvents.filter(event => event.id !== id));
      toast.success('Reisehendelse slettet');
    } catch (error) {
      toast.error('Feil ved sletting: ' + error.message);
    }
  };
  
  const handleImportDefaultEvents = async () => {
    if (!confirm('Dette vil importere standardhendelsene til databasen. Fortsette?')) {
      return;
    }
    
    try {
      // Sjekk om noen av hendelsene allerede eksisterer
      const { data: existingEvents, error: fetchError } = await supabase
        .from('travel_events')
        .select('id');
      
      if (fetchError) {
        toast.error('Kunne ikke sjekke eksisterende hendelser: ' + fetchError.message);
        return;
      }
      
      // Filtrer bare de hendelsene som ikke allerede finnes i databasen
      const existingIds = existingEvents.map(e => e.id);
      const eventsToImport = defaultTravelEvents.filter(event => !existingIds.includes(event.id));
      
      if (eventsToImport.length === 0) {
        toast.info('Alle standardhendelser er allerede importert');
        return;
      }
      
      // Importer hendelsene
      const { error: insertError } = await supabase
        .from('travel_events')
        .insert(eventsToImport);
        
      if (insertError) {
        toast.error('Feil ved import av hendelser: ' + insertError.message);
        return;
      }
      
      toast.success(`Importerte ${eventsToImport.length} standardhendelser`);
      
      // Last inn hendelsene på nytt
      const { data: updatedEvents } = await supabase
        .from('travel_events')
        .select('*');
        
      setTravelEvents(updatedEvents || []);
    } catch (error) {
      toast.error('Generell feil ved import: ' + error.message);
    }
  };
  
  if (loading) {
    return <div className="text-center p-4">Laster reisehendelser...</div>;
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Administrer reisehendelser</h2>
      
      {!showNewForm ? (
        <div>
          <div className="flex space-x-3 mb-4">
            <button 
              onClick={handleCreateNew}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Opprett ny reisehendelse
            </button>
            
            <button 
              onClick={handleImportDefaultEvents}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Importer standardhendelser
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {travelEvents.length === 0 ? (
              <p className="text-gray-400">Ingen reisehendelser funnet</p>
            ) : (
              travelEvents.map(event => (
                <div key={event.id} className="bg-gray-700 rounded-lg p-4 shadow">
                  <h3 className="text-xl font-semibold text-yellow-300">{event.title}</h3>
                  <p className="text-gray-300 mb-2">{event.description}</p>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="text-lg font-semibold text-gray-200">Valg:</h4>
                    {Array.isArray(event.choices) ? event.choices.map((choice, idx) => (
                      <div key={idx} className="pl-4 border-l-2 border-gray-600">
                        <p className="text-gray-200"><span className="text-gray-400">Valg {idx+1}:</span> {choice.text}</p>
                        <p className="text-green-400 text-sm"><span className="text-gray-400">Suksess:</span> {choice.success}</p>
                        <p className="text-red-400 text-sm"><span className="text-gray-400">Feil:</span> {choice.failure}</p>
                        <p className="text-gray-400 text-sm">Ferdighet: {choice.skill}, Vanskelighetsgrad: {choice.difficulty}</p>
                      </div>
                    )) : (
                      <p className="text-gray-400">Ingen valg definert</p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button 
                      onClick={() => handleEditEvent(event)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Rediger
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Slett
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">
            {isEditing ? 'Rediger reisehendelse' : 'Opprett ny reisehendelse'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-1">Tittel</label>
              <input 
                type="text" 
                value={currentEvent.title} 
                onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-1">Beskrivelse</label>
              <textarea 
                value={currentEvent.description} 
                onChange={(e) => setCurrentEvent({...currentEvent, description: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                rows="3"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-1">Type</label>
                <select
                  value={currentEvent.type} 
                  onChange={(e) => setCurrentEvent({...currentEvent, type: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                >
                  <option value="travel">Reise</option>
                  <option value="exploration">Utforskning</option>
                  <option value="city">By</option>
                  <option value="dungeon">Dungeon</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Vanskelighetsgrad (1-10)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  value={currentEvent.difficulty} 
                  onChange={(e) => setCurrentEvent({...currentEvent, difficulty: Number(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
            
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h4 className="text-lg font-semibold text-gray-200 mb-2">Valg</h4>
              
              {Array.isArray(currentEvent.choices) ? currentEvent.choices.map((choice, idx) => (
                <div key={idx} className="mb-6 bg-gray-700 p-4 rounded-lg">
                  <h5 className="text-yellow-300 font-medium mb-2">Valg {idx+1}</h5>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-300 mb-1">Valgalternativ tekst</label>
                      <input 
                        type="text" 
                        value={choice.text} 
                        onChange={(e) => handleChoiceChange(idx, 'text', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-300 mb-1">Ferdighetskrav</label>
                        <select 
                          value={choice.skill} 
                          onChange={(e) => handleChoiceChange(idx, 'skill', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                        >
                          {skillOptions.map(skill => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 mb-1">Vanskelighetsgrad (1-10)</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={choice.difficulty} 
                          onChange={(e) => handleChoiceChange(idx, 'difficulty', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Suksessbeskrivelse</label>
                      <textarea 
                        value={choice.success} 
                        onChange={(e) => handleChoiceChange(idx, 'success', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                        rows="2"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 mb-1">Feilbeskrivelse</label>
                      <textarea 
                        value={choice.failure} 
                        onChange={(e) => handleChoiceChange(idx, 'failure', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                        rows="2"
                      />
                    </div>
                    
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <h6 className="text-green-400 font-medium mb-2">Suksessbelønning</h6>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-gray-300 mb-1">Gull</label>
                          <input 
                            type="number" 
                            value={choice.successReward.gold} 
                            onChange={(e) => handleRewardChange(idx, true, 'gold', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 mb-1">Erfaring</label>
                          <input 
                            type="number" 
                            value={choice.successReward.experience} 
                            onChange={(e) => handleRewardChange(idx, true, 'experience', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 mb-1">Helse</label>
                          <input 
                            type="number" 
                            value={choice.successReward.health} 
                            onChange={(e) => handleRewardChange(idx, true, 'health', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 mb-1">Energi</label>
                          <input 
                            type="number" 
                            value={choice.successReward.energy} 
                            onChange={(e) => handleRewardChange(idx, true, 'energy', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 border border-gray-600 rounded bg-gray-700 bg-opacity-50">
                        <div className="flex items-center mb-3">
                          <input 
                            type="checkbox" 
                            id={`item-reward-${idx}`}
                            checked={choice.successReward.item} 
                            onChange={(e) => handleRewardChange(idx, true, 'item', e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`item-reward-${idx}`} className="text-gray-300">Gi gjenstand</label>
                        </div>
                        
                        {choice.successReward.item && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pl-6">
                            <div>
                              <label className="block text-gray-300 mb-1">Velg gjenstand</label>
                              <select
                                value={choice.successReward.item_id || ''}
                                onChange={(e) => handleRewardChange(idx, true, 'item_id', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                              >
                                <option value="">-- Velg gjenstand --</option>
                                {items.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {item.name} ({item.type}, {item.rarity})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-300 mb-1">Antall</label>
                              <select
                                value={choice.successReward.item_quantity || 1}
                                onChange={(e) => handleRewardChange(idx, true, 'item_quantity', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                              >
                                {quantityOptions.map(qty => (
                                  <option key={qty} value={qty}>{qty}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center mb-3">
                          <input 
                            type="checkbox" 
                            id={`resource-reward-${idx}`}
                            checked={choice.successReward.resource} 
                            onChange={(e) => handleRewardChange(idx, true, 'resource', e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`resource-reward-${idx}`} className="text-gray-300">Gi ressurs</label>
                        </div>
                        
                        {choice.successReward.resource && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                            <div>
                              <label className="block text-gray-300 mb-1">Velg ressurstype</label>
                              <select
                                value={choice.successReward.resource_type || 'wood'}
                                onChange={(e) => handleRewardChange(idx, true, 'resource_type', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                              >
                                {resourceTypes.map(resource => (
                                  <option key={resource.id} value={resource.id}>
                                    {resource.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-300 mb-1">Antall</label>
                              <select
                                value={choice.successReward.resource_quantity || 1}
                                onChange={(e) => handleRewardChange(idx, true, 'resource_quantity', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                              >
                                {quantityOptions.map(qty => (
                                  <option key={qty} value={qty}>{qty}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <h6 className="text-red-400 font-medium mb-2">Feiltap</h6>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-gray-300 mb-1">Gull (negativ for tap)</label>
                          <input 
                            type="number" 
                            value={choice.failurePenalty.gold} 
                            onChange={(e) => handleRewardChange(idx, false, 'gold', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 mb-1">Erfaring</label>
                          <input 
                            type="number" 
                            value={choice.failurePenalty.experience} 
                            onChange={(e) => handleRewardChange(idx, false, 'experience', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 mb-1">Helse (negativ for tap)</label>
                          <input 
                            type="number" 
                            value={choice.failurePenalty.health} 
                            onChange={(e) => handleRewardChange(idx, false, 'health', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 mb-1">Energi (negativ for tap)</label>
                          <input 
                            type="number" 
                            value={choice.failurePenalty.energy} 
                            onChange={(e) => handleRewardChange(idx, false, 'energy', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-600 focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400">Ingen valg definert</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Avbryt
              </button>
              <button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelEventsAdmin; 