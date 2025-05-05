import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const TitleAdmin = () => {
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(null);
  const [newTitle, setNewTitle] = useState({
    id: '',
    name: '',
    description: '',
    rarity: 'common',
    source: ''
  });

  useEffect(() => {
    fetchTitles();
  }, []);

  const fetchTitles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .order('id');
      
      if (error) throw error;
      setTitles(data || []);
    } catch (error) {
      toast.error('Kunne ikke laste titler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTitle({
      ...newTitle,
      [name]: value
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingTitle({
      ...editingTitle,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('titles')
        .insert([newTitle]);
      
      if (error) throw error;
      
      toast.success('Tittel lagt til!');
      setNewTitle({
        id: '',
        name: '',
        description: '',
        rarity: 'common',
        source: ''
      });
      fetchTitles();
    } catch (error) {
      toast.error('Kunne ikke legge til tittel: ' + error.message);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('titles')
        .update({
          name: editingTitle.name,
          description: editingTitle.description,
          rarity: editingTitle.rarity,
          source: editingTitle.source
        })
        .eq('id', editingTitle.id);
      
      if (error) throw error;
      
      toast.success('Tittel oppdatert!');
      setShowEditModal(false);
      
      // Oppdater listen med titler
      setTitles(titles.map(title => 
        title.id === editingTitle.id ? editingTitle : title
      ));
      
    } catch (error) {
      toast.error('Kunne ikke oppdatere tittel: ' + error.message);
    }
  };

  const handleEdit = (title) => {
    setEditingTitle({...title});
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Er du sikker på at du vil slette denne tittelen?')) return;
    
    try {
      const { error } = await supabase
        .from('titles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Tittel slettet!');
      fetchTitles();
    } catch (error) {
      toast.error('Kunne ikke slette tittel: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-yellow-500">Titteladministrasjon</h2>

      {/* Opprett ny tittel */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-yellow-400">Legg til ny tittel</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">ID (brukes som referanse)</label>
              <input
                type="text"
                name="id"
                value={newTitle.id}
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
                value={newTitle.name}
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
                value={newTitle.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                rows="2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Sjeldenhetsgrad</label>
              <select
                name="rarity"
                value={newTitle.rarity}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                required
              >
                <option value="common">Vanlig</option>
                <option value="uncommon">Uvanlig</option>
                <option value="rare">Sjelden</option>
                <option value="epic">Episk</option>
                <option value="legendary">Legendarisk</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300">Kilde</label>
              <input
                type="text"
                name="source"
                value={newTitle.source}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                  focus:border-yellow-500 focus:ring-yellow-500"
                placeholder="F.eks. Prestasjon, Oppdrag, osv."
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md
                focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800
                transition-colors duration-200"
            >
              Legg til tittel
            </button>
          </div>
        </form>
      </div>

      {/* Eksisterende titler */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-yellow-400">Eksisterende titler</h3>
          {titles.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Ingen titler funnet</p>
          ) : (
            <div className="space-y-4">
              {titles.map(title => (
                <div
                  key={title.id}
                  className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`
                        font-medium 
                        ${title.rarity === 'common' ? 'text-gray-200' : ''}
                        ${title.rarity === 'uncommon' ? 'text-green-400' : ''}
                        ${title.rarity === 'rare' ? 'text-blue-400' : ''}
                        ${title.rarity === 'epic' ? 'text-purple-400' : ''}
                        ${title.rarity === 'legendary' ? 'text-yellow-400' : ''}
                      `}>
                        {title.name}
                        <span className="ml-2 text-xs text-gray-400">({title.id})</span>
                      </h4>
                      <p className="text-sm text-gray-300 mt-1">{title.description}</p>
                      <div className="mt-2 text-sm text-gray-400">
                        <span>Kilde: {title.source}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(title)}
                        className="text-blue-400 hover:text-blue-300 bg-gray-800 p-2 rounded-full
                          transition-colors duration-200"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(title.id)}
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

      {/* Redigeringsmodal */}
      {showEditModal && editingTitle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 max-w-xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-yellow-400">Rediger tittel</h3>
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
                    value={editingTitle.id}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">ID kan ikke endres</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Navn</label>
                  <input
                    type="text"
                    name="name"
                    value={editingTitle.name}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Sjeldenhetsgrad</label>
                  <select
                    name="rarity"
                    value={editingTitle.rarity}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  >
                    <option value="common">Vanlig</option>
                    <option value="uncommon">Uvanlig</option>
                    <option value="rare">Sjelden</option>
                    <option value="epic">Episk</option>
                    <option value="legendary">Legendarisk</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">Beskrivelse</label>
                  <textarea
                    name="description"
                    value={editingTitle.description}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    rows="3"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300">Kilde</label>
                  <input
                    type="text"
                    name="source"
                    value={editingTitle.source}
                    onChange={handleEditChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white
                      focus:border-yellow-500 focus:ring-yellow-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md
                    focus:outline-none transition-colors duration-200"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
                    transition-colors duration-200"
                >
                  Oppdater
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TitleAdmin; 