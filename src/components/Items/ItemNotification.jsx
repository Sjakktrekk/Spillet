import { useState, useEffect, useRef } from 'react'
import { getItemRarityColor, getItemRarityBorderColor } from '../../lib/characterData'

export default function ItemNotification({ item, onClose }) {
  const [visible, setVisible] = useState(true)
  const [closing, setClosing] = useState(false)
  const closeTimeoutRef = useRef(null);
  const closeHandledRef = useRef(false);

  useEffect(() => {
    // Start timer for automatisk lukking
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => {
      clearTimeout(timer);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    }
  }, [])

  const handleClose = () => {
    // Forhindre flere kall til handleClose
    if (closeHandledRef.current || closing) return;
    
    closeHandledRef.current = true;
    setClosing(true)
    
    // Animasjon varer i 500ms
    closeTimeoutRef.current = setTimeout(() => {
      setVisible(false)
      if (onClose) onClose()
    }, 500)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-lg bg-gray-800 border-4 ${getItemRarityBorderColor(item.rarity)} shadow-2xl flex items-start max-w-2xl w-full transition-all duration-500 ${
        closing 
          ? 'opacity-0 scale-95' 
          : 'opacity-100 scale-100'
      }`}
    >
      <div className="bg-gray-700 p-4 rounded-full mr-4">
        <div className="text-3xl">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-12 h-12 object-contain"
            />
          ) : (
            item.icon
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-yellow-500 font-bold text-lg uppercase tracking-wider mb-2">Ny gjenstand funnet!</div>
            <h3 className={`font-bold text-2xl ${getItemRarityColor(item.rarity)}`}>{item.name}</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-300 text-lg my-2">{item.description}</p>
        
        <div className="mt-4">
          <div className="flex gap-3">
            <span className="text-sm bg-gray-700 px-3 py-1 rounded text-gray-300 capitalize">
              {item.type === 'consumable' && 'Forbruksvare'}
              {item.type === 'weapon' && 'Våpen'}
              {item.type === 'armor' && 'Rustning'}
              {item.type === 'accessory' && 'Tilbehør'}
              {item.type === 'material' && 'Materiale'}
              {item.type === 'food' && 'Mat'}
            </span>
            <span className={`text-sm px-3 py-1 rounded ${getItemRarityColor(item.rarity)} bg-opacity-20 bg-gray-700`}>
              {item.rarity === 'common' && 'Vanlig'}
              {item.rarity === 'uncommon' && 'Uvanlig'}
              {item.rarity === 'rare' && 'Sjelden'}
              {item.rarity === 'epic' && 'Episk'}
              {item.rarity === 'legendary' && 'Legendarisk'}
            </span>
          </div>
        </div>

        {(item.damage || item.defense || item.effect) && (
          <div className="mt-4 text-lg">
            {item.damage && (
              <div className="text-red-400">Skade: {item.damage}</div>
            )}
            {item.defense && (
              <div className="text-blue-400">Forsvar: {item.defense}</div>
            )}
            {item.effect && (
              <div className="text-green-400">
                Effekt: 
                {item.effect === 'restore_health' && ` Gjenoppretter ${item.effect_value} helse`}
                {item.effect === 'restore_energy' && ` Gjenoppretter ${item.effect_value} energi`}
                {item.effect === 'max_health' && ` +${item.effect_value} makshelse`}
                {item.effect === 'magic_power' && ` +${item.effect_value} magisk kraft`}
              </div>
            )}
          </div>
        )}

        {item.attributes && (
          <div className="mt-4 text-lg">
            {Object.entries(item.attributes).map(([attr, value]) => {
              switch(attr) {
                case 'magic':
                case 'magi':
                  return <div key={attr} className="text-blue-400">+{value} Magi</div>;
                case 'strength':
                case 'styrke':
                  return <div key={attr} className="text-red-400">+{value} Styrke</div>;
                case 'agility':
                case 'smidighet':
                  return <div key={attr} className="text-green-400">+{value} Smidighet</div>;
                case 'utholdenhet':
                  return <div key={attr} className="text-yellow-400">+{value} Utholdenhet</div>;
                case 'vitalitet':
                  return <div key={attr} className="text-pink-400">+{value} Vitalitet</div>;
                case 'intelligens':
                  return <div key={attr} className="text-indigo-400">+{value} Intelligens</div>;
                default:
                  return null;
              }
            })}
          </div>
        )}

        <div className="mt-6 text-lg text-gray-400">
          Verdi: <span className="text-yellow-400">{item.value} gull</span>
        </div>
      </div>
    </div>
  )
} 