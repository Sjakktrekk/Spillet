import { createContext, useContext, useState, useCallback } from 'react'
import ItemNotification from './ItemNotification'

const ItemContext = createContext()

export function ItemProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const showItem = useCallback((item) => {
    // Sjekk om vi allerede har vist denne item nylig
    const itemKey = `item_shown_${item.id}`;
    const lastShown = localStorage.getItem(itemKey);
    const now = Date.now();
    
    // Ikke vis samme item mer enn én gang per 30 sekunder
    if (lastShown && (now - Number(lastShown) < 30000)) {
      return;
    }
    
    // Marker at denne item er vist nå
    localStorage.setItem(itemKey, now.toString());
    
    setNotifications(prev => {
      // Sjekk om denne item allerede er i listen
      const isDuplicate = prev.some(n => n.item.id === item.id);
      if (isDuplicate) return prev;
      
      return [...prev, { id: Date.now(), item }];
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, []);

  return (
    <ItemContext.Provider value={{ showItem }}>
      {children}
      
      {/* Vis alle notifikasjoner */}
      <div className="item-notifications-container">
        {notifications.map(({ id, item }) => (
          <ItemNotification 
            key={id}
            item={item}
            onClose={() => removeNotification(id)}
          />
        ))}
      </div>
    </ItemContext.Provider>
  )
}

export function useItems() {
  return useContext(ItemContext)
} 