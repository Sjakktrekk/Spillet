import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import storeBackground from '../assets/store.jpg'
import { useItems } from '../components/Items/ItemContext'
import { getCharacterItems } from '../lib/characterData'
import useCharacter from '../hooks/useCharacter'

export default function Marketplace() {
  const { user, loading: authLoading } = useAuth()
  const { character } = useCharacter()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState([])
  const [userInventory, setUserInventory] = useState([])
  const [userGold, setUserGold] = useState(0)
  const [selectedItem, setSelectedItem] = useState(null)
  const [price, setPrice] = useState('')
  const [showSellModal, setShowSellModal] = useState(false)
  const [activeTab, setActiveTab] = useState('kjøp')
  const [sellSuccess, setSellSuccess] = useState(false)
  const [buySuccess, setBuySuccess] = useState(false)
  const { showItem } = useItems()
  
  // Redirect hvis ikke logget inn
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])
  
  // Hent data fra bruktmarkedet
  useEffect(() => {
    async function loadMarketplace() {
      if (!user || !character) return
      
      try {
        // Hent karakterens inventar fra items-tabellen
        const items = await getCharacterItems(character.id);
        
        // Sett inventar
        setUserInventory(items || []);
        
        // Hent gullbeholdning fra character
        setUserGold(character.coins || 0);
        
        // Hent aktive listinger fra markedsplassen
        const { data: listingsData, error: listingsError } = await supabase
          .from('market_listings')
          .select(`
            *,
            items:item_id (
              *
            )
          `);
        
        if (listingsError) throw listingsError;
        
        // Formater listinger for visning
        const formattedListings = listingsData.map(listing => ({
          id: listing.id,
          seller_id: listing.seller_id,
          seller_name: listing.seller_name,
          item: listing.items,
          price: listing.price,
          listed_at: listing.listed_at
        }));
        
        setListings(formattedListings);
        setLoading(false);
      } catch (error) {
        console.error('Error loading marketplace:', error);
        setLoading(false);
      }
    }
    
    if (!authLoading && character) {
      loadMarketplace();
    }
  }, [user, authLoading, character]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Nettopp';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} time${Math.floor(diffInHours) !== 1 ? 'r' : ''} siden`;
    } else {
      return `${Math.floor(diffInHours / 24)} dag${Math.floor(diffInHours / 24) !== 1 ? 'er' : ''} siden`;
    }
  };
  
  const handleSellClick = (item) => {
    setSelectedItem(item);
    setPrice(item.value.toString()); // Foreslå verdien som standard pris
    setShowSellModal(true);
  };
  
  const handleConfirmSell = async () => {
    if (!selectedItem || !price || isNaN(parseInt(price))) {
      return;
    }
    
    try {
      // Opprett ny listing i databasen
      const { data: newListing, error: insertError } = await supabase
        .from('market_listings')
        .insert([{
          seller_id: user.id,
          seller_name: character.name,
          item_id: selectedItem.id,
          price: parseInt(price)
        }])
        .select(`
          *,
          items:item_id (
            *
          )
        `)
        .single();
      
      if (insertError) throw insertError;
      
      // Formater den nye listingen for visning
      const formattedListing = {
        id: newListing.id,
        seller_id: newListing.seller_id,
        seller_name: newListing.seller_name,
        item: newListing.items,
        price: newListing.price,
        listed_at: newListing.listed_at
      };
      
      // Legg til den nye listingen i listen
      setListings([...listings, formattedListing]);
      
      // Fjern gjenstanden fra brukerens inventar
      setUserInventory(userInventory.filter(item => item.id !== selectedItem.id));
      
      // Tilbakestill og lukk modal
      setSelectedItem(null);
      setPrice('');
      setShowSellModal(false);
      
      // Vis suksessmelding
      setSellSuccess(true);
      setTimeout(() => setSellSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Det oppstod en feil ved opprettelse av annonsen. Prøv igjen senere.');
    }
  };
  
  const handleBuy = async (listing) => {
    if (userGold < listing.price) {
      alert('Du har ikke nok gull til å kjøpe denne gjenstanden!');
      return;
    }
    
    try {
      // Start en transaksjon
      const { error: transactionError } = await supabase.rpc('buy_market_item', {
        p_listing_id: listing.id,
        p_buyer_id: user.id,
        p_price: listing.price
      });
      
      if (transactionError) throw transactionError;
      
      // Oppdater lokalt state
      setUserGold(userGold - listing.price);
      setUserInventory([...userInventory, {...listing.item, quantity: 1}]);
      setListings(listings.filter(item => item.id !== listing.id));
      
      // Vis item-notifikasjon
      showItem(listing.item);
      
      // Vis suksessmelding
      setBuySuccess(true);
      setTimeout(() => setBuySuccess(false), 3000);
    } catch (error) {
      console.error('Error buying item:', error);
      alert('Det oppstod en feil ved kjøpet. Prøv igjen senere.');
    }
  };
  
  const cancelListing = async (listingId) => {
    try {
      // Finn listingen som skal kanselleres
      const listingToCancel = listings.find(listing => listing.id === listingId);
      
      if (!listingToCancel) return;
      
      // Slett listing fra databasen
      const { error: deleteError } = await supabase
        .from('market_listings')
        .delete()
        .eq('id', listingId);
      
      if (deleteError) throw deleteError;
      
      // Legg gjenstanden tilbake i brukerens inventar
      setUserInventory([...userInventory, {...listingToCancel.item, quantity: 1}]);
      
      // Fjern listingen fra markedsplassen
      setListings(listings.filter(listing => listing.id !== listingId));
    } catch (error) {
      console.error('Error canceling listing:', error);
      alert('Det oppstod en feil ved kansellering av annonsen. Prøv igjen senere.');
    }
  };
  
  const getUserListings = () => {
    return listings.filter(listing => listing.seller_id === user?.id);
  };
  
  const getOtherListings = () => {
    return listings.filter(listing => listing.seller_id !== user?.id);
  };
  
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-300';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster bruktmarked...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-screen py-6 text-gray-300"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${storeBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header med tittel */}
        <div className="text-center mb-8 bg-gradient-to-b from-yellow-900 to-yellow-950 rounded-lg p-6 border-2 border-yellow-800 shadow-xl">
          <h1 className="text-4xl font-medieval text-yellow-400 drop-shadow-md">Bruktmarked</h1>
          <p className="mt-2 text-yellow-200 italic">Kjøp og selg gjenstander med andre eventyrere</p>
          
          <div className="flex justify-center mt-6">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveTab('kjøp')}
                className={`px-6 py-3 text-base font-medium rounded-l-md border-y border-l border-yellow-800 transition-all ${
                  activeTab === 'kjøp'
                    ? 'bg-yellow-800 text-yellow-200 shadow-inner'
                    : 'bg-yellow-950 text-yellow-300 hover:bg-yellow-900'
                }`}
              >
                Kjøp gjenstander
              </button>
              <button
                onClick={() => setActiveTab('selg')}
                className={`px-6 py-3 text-base font-medium border-y border-yellow-800 transition-all ${
                  activeTab === 'selg'
                    ? 'bg-yellow-800 text-yellow-200 shadow-inner'
                    : 'bg-yellow-950 text-yellow-300 hover:bg-yellow-900'
                }`}
              >
                Selg gjenstander
              </button>
              <button
                onClick={() => setActiveTab('mine')}
                className={`px-6 py-3 text-base font-medium rounded-r-md border-y border-r border-yellow-800 transition-all ${
                  activeTab === 'mine'
                    ? 'bg-yellow-800 text-yellow-200 shadow-inner'
                    : 'bg-yellow-950 text-yellow-300 hover:bg-yellow-900'
                }`}
              >
                Mine annonser
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6 p-4 bg-yellow-950 bg-opacity-80 rounded-lg border border-yellow-900 shadow-md">
          <div className="flex items-center">
            <span className="text-yellow-400 text-2xl mr-3">💰</span>
            <span className="text-yellow-300 text-lg font-semibold">Din gullbeholdning: {userGold}</span>
          </div>
          <button 
            onClick={() => navigate('/home')} 
            className="px-4 py-2 bg-yellow-900 hover:bg-yellow-800 text-yellow-200 rounded-md transition-colors"
          >
            Tilbake til byen
          </button>
        </div>
        
        {/* Suksessmeldinger */}
        {sellSuccess && (
          <div className="mb-6 p-4 bg-green-900 bg-opacity-80 text-green-100 rounded-md border border-green-700 shadow-md animate-pulse">
            <div className="flex items-center">
              <span className="text-2xl mr-2">✅</span>
              <span>Gjenstanden din er nå lagt ut for salg på bruktmarkedet!</span>
            </div>
          </div>
        )}
        
        {buySuccess && (
          <div className="mb-6 p-4 bg-green-900 bg-opacity-80 text-green-100 rounded-md border border-green-700 shadow-md animate-pulse">
            <div className="flex items-center">
              <span className="text-2xl mr-2">✅</span>
              <span>Kjøpet er gjennomført! Gjenstanden er lagt til i ditt inventar.</span>
            </div>
          </div>
        )}
        
        {/* Kjøp gjenstander fane */}
        {activeTab === 'kjøp' && (
          <div className="bg-gray-900 bg-opacity-90 rounded-lg shadow-xl overflow-hidden border border-yellow-900">
            <div className="p-5 border-b border-yellow-900 bg-gradient-to-r from-yellow-950 to-gray-900">
              <h2 className="text-2xl font-semibold text-yellow-400">Tilgjengelige gjenstander</h2>
            </div>
            
            {getOtherListings().length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">🛒</div>
                <h3 className="text-xl text-yellow-400 mb-2">Ingen gjenstander til salg</h3>
                <p className="text-gray-400">Det er ingen gjenstander til salg for øyeblikket.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {getOtherListings().map(listing => (
                  <div key={listing.id} className="p-5 hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="text-3xl mr-4 bg-gray-800 p-3 rounded-full">{listing.item.icon}</div>
                        <div>
                          <h3 className={`text-lg font-medium ${getRarityColor(listing.item.rarity)}`}>
                            {listing.item.name}
                          </h3>
                          <p className="text-gray-400 text-sm">{listing.item.description}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span>Selger: {listing.seller_name}</span>
                            <span className="mx-2">•</span>
                            <span>Lagt ut: {formatDate(listing.listed_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="flex items-center mb-2">
                          <span className="text-yellow-400 text-lg font-bold">{listing.price}</span>
                          <span className="text-yellow-500 ml-1">🪙</span>
                        </div>
                        <button
                          onClick={() => handleBuy(listing)}
                          disabled={userGold < listing.price}
                          className={`px-4 py-2 rounded-md ${
                            userGold >= listing.price
                              ? 'bg-yellow-800 hover:bg-yellow-700 text-yellow-200'
                              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          } transition-colors`}
                        >
                          Kjøp nå
                        </button>
                      </div>
                    </div>
                    
                    {listing.item.type === 'weapon' && (
                      <div className="mt-3 bg-gray-800 bg-opacity-50 p-2 rounded text-sm">
                        <span className="text-red-400 mr-2">⚔️ Skade: {listing.item.damage}</span>
                        <span className="text-gray-400">Vekt: {listing.item.weight} kg</span>
                      </div>
                    )}
                    
                    {listing.item.type === 'armor' && (
                      <div className="mt-3 bg-gray-800 bg-opacity-50 p-2 rounded text-sm">
                        <span className="text-blue-400 mr-2">🛡️ Forsvar: {listing.item.defense}</span>
                        <span className="text-gray-400">Vekt: {listing.item.weight} kg</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Selg gjenstander fane */}
        {activeTab === 'selg' && (
          <div className="bg-gray-900 bg-opacity-90 rounded-lg shadow-xl overflow-hidden border border-yellow-900">
            <div className="p-5 border-b border-yellow-900 bg-gradient-to-r from-yellow-950 to-gray-900">
              <h2 className="text-2xl font-semibold text-yellow-400">Ditt inventar</h2>
              <p className="text-sm text-gray-400 mt-1">Velg en gjenstand du vil selge</p>
            </div>
            
            {userInventory.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">🎒</div>
                <h3 className="text-xl text-yellow-400 mb-2">Tomt inventar</h3>
                <p className="text-gray-400">Du har ingen gjenstander å selge.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {userInventory.map(item => (
                  <div key={item.id} className="p-5 hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="text-3xl mr-4 bg-gray-800 p-3 rounded-full">{item.icon}</div>
                        <div>
                          <h3 className={`text-lg font-medium ${getRarityColor(item.rarity)}`}>
                            {item.name}
                          </h3>
                          <p className="text-gray-400 text-sm">{item.description}</p>
                          <div className="flex items-center mt-1 text-xs">
                            <span className={`${getRarityColor(item.rarity)}`}>
                              {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="ml-2 text-gray-400">Antall: {item.quantity}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="flex items-center mb-2">
                          <span className="text-gray-400">Verdi: </span>
                          <span className="text-yellow-400 ml-1">{item.value}</span>
                          <span className="text-yellow-500 ml-1">🪙</span>
                        </div>
                        <button
                          onClick={() => handleSellClick(item)}
                          className="px-4 py-2 bg-yellow-800 hover:bg-yellow-700 text-yellow-200 rounded-md transition-colors"
                        >
                          Selg
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Mine annonser fane */}
        {activeTab === 'mine' && (
          <div className="bg-gray-900 bg-opacity-90 rounded-lg shadow-xl overflow-hidden border border-yellow-900">
            <div className="p-5 border-b border-yellow-900 bg-gradient-to-r from-yellow-950 to-gray-900">
              <h2 className="text-2xl font-semibold text-yellow-400">Mine annonser</h2>
              <p className="text-sm text-gray-400 mt-1">Gjenstander du har lagt ut for salg</p>
            </div>
            
            {getUserListings().length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">📜</div>
                <h3 className="text-xl text-yellow-400 mb-2">Ingen aktive annonser</h3>
                <p className="text-gray-400">Du har ikke lagt ut noen gjenstander for salg ennå.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {getUserListings().map(listing => (
                  <div key={listing.id} className="p-5 hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex items-center mb-3 sm:mb-0">
                        <div className="text-3xl mr-4 bg-gray-800 p-3 rounded-full">{listing.item.icon}</div>
                        <div>
                          <h3 className={`text-lg font-medium ${getRarityColor(listing.item.rarity)}`}>
                            {listing.item.name}
                          </h3>
                          <p className="text-gray-400 text-sm">{listing.item.description}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span>Lagt ut: {formatDate(listing.listed_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="flex items-center mb-2">
                          <span className="text-yellow-400 text-lg font-bold">{listing.price}</span>
                          <span className="text-yellow-500 ml-1">🪙</span>
                        </div>
                        <button
                          onClick={() => cancelListing(listing.id)}
                          className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-200 rounded-md transition-colors"
                        >
                          Avbryt salg
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Modal for å selge gjenstand */}
        {showSellModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border-2 border-yellow-800 shadow-xl">
              <h3 className="text-xl font-bold text-yellow-400 mb-4">Selg gjenstand</h3>
              
              {selectedItem && (
                <div className="mb-6 flex items-center">
                  <div className="text-3xl mr-3 bg-gray-800 p-3 rounded-full">{selectedItem.icon}</div>
                  <div>
                    <h4 className={`font-medium ${getRarityColor(selectedItem.rarity)}`}>{selectedItem.name}</h4>
                    <p className="text-gray-400 text-sm">{selectedItem.description}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-yellow-300 text-sm font-bold mb-2">
                  Pris (i gull)
                </label>
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-2">🪙</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-gray-800 text-yellow-200 border border-gray-700 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Foreslått pris: {selectedItem?.value} gull (basert på gjenstandens verdi)
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSellModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleConfirmSell}
                  className="flex-1 bg-yellow-800 hover:bg-yellow-700 text-yellow-200 py-2 px-4 rounded transition-colors"
                >
                  Legg ut for salg
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 