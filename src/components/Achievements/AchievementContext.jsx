import { createContext, useContext, useState, useCallback } from 'react'
import AchievementNotification from './AchievementNotification'

const AchievementContext = createContext()

export function AchievementProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  // Bruk useCallback for å unngå unødvendige re-renders
  const showAchievement = useCallback((achievement) => {
    // Sjekk om vi allerede har vist denne achievement nylig
    const achievementKey = `achievement_shown_${achievement.id}`;
    const lastShown = localStorage.getItem(achievementKey);
    const now = Date.now();
    
    // Ikke vis samme achievement mer enn én gang per 30 sekunder
    if (lastShown && (now - Number(lastShown) < 30000)) {
      return;
    }
    
    // Marker at denne achievement er vist nå
    localStorage.setItem(achievementKey, now.toString());
    
    setNotifications(prev => {
      // Sjekk om denne achievement allerede er i listen
      const isDuplicate = prev.some(n => n.achievement.id === achievement.id);
      if (isDuplicate) return prev;
      
      return [...prev, { id: Date.now(), achievement }];
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, []);

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      
      {/* Vis alle notifikasjoner */}
      <div className="achievements-container">
        {notifications.map(({ id, achievement }) => (
          <AchievementNotification 
            key={id}
            achievement={achievement}
            onClose={() => removeNotification(id)}
          />
        ))}
      </div>
    </AchievementContext.Provider>
  )
}

export function useAchievements() {
  return useContext(AchievementContext)
} 