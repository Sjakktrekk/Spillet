import { useState, useEffect } from 'react'
import { useAchievements } from '../components/Achievements/AchievementContext'
import { useAuth } from './useAuth.jsx'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

export default function useAchievementTracker() {
  const { user } = useAuth()
  const { showAchievement } = useAchievements()
  const [trackedStats, setTrackedStats] = useState({
    citiesVisited: [],
    questsCompleted: 0,
    messagesCount: 0,
    itemsCollected: 0,
    monstersKilled: 0,
    goldEarned: 0,
    loginCount: 0,
    distanceTraveled: 0,
    itemsCrafted: 0,
    resourcesGathered: 0,
    battlesWon: 0
  })
  
  // State for å holde styr på låste titler
  const [unlockedTitles, setUnlockedTitles] = useState([])
  const [activeTitle, setActiveTitle] = useState(null)
  
  // State for å holde dynamiske achievements lastet fra databasen
  const [databaseAchievements, setDatabaseAchievements] = useState([])
  
  // Last inn brukerens stats fra databasen
  useEffect(() => {
    if (!user) return
    
    let isMounted = true;
    
    const loadStats = async () => {
      try {
        // Hent brukerstatistikk
        const { data: stats, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (statsError && statsError.code !== 'PGRST116') {
          console.error('Feil ved henting av brukerstatistikk:', statsError)
          return
        }
        
        // Oppdater trackedStats med data fra databasen
        if (stats && isMounted) {
          setTrackedStats({
            citiesVisited: stats.cities_visited || [],
            questsCompleted: stats.quests_completed || 0,
            messagesCount: stats.messages_count || 0,
            itemsCollected: stats.items_collected || 0,
            monstersKilled: stats.monsters_killed || 0,
            goldEarned: stats.gold_earned || 0,
            loginCount: stats.login_count || 0,
            distanceTraveled: stats.distance_traveled || 0,
            itemsCrafted: stats.items_crafted || 0,
            resourcesGathered: stats.resources_gathered || 0,
            battlesWon: stats.battles_won || 0
          })
        } else if (isMounted) {
          // Hvis ingen stats finnes, oppdater login_count via RPC
          await supabase.rpc('increment_user_stat', {
            user_id_param: user.id,
            stat_key: 'login_count',
            increment_amount: 1
          })
        }
        
        // Hent brukerens titler
        const { data: titles, error: titlesError } = await supabase
          .from('user_titles')
          .select('title_name, is_active, unlocked_at')
          .eq('user_id', user.id)
        
        if (titlesError) {
          console.error('Feil ved henting av brukerens titler:', titlesError)
          return
        }
        
        // Hent full tittelinformasjon
        if (titles && titles.length > 0 && isMounted) {
          const titleNames = titles.map(t => t.title_name)
          
          const { data: titlesInfo, error: titlesInfoError } = await supabase
            .from('titles')
            .select('*')
            .in('name', titleNames)
          
          if (titlesInfoError) {
            console.error('Feil ved henting av tittler:', titlesInfoError)
            return
          }
          
          // Kombiner tittel-info med brukertitteldata
          const fullTitles = titles.map(userTitle => {
            const titleInfo = titlesInfo.find(t => t.name === userTitle.title_name)
            return {
              ...titleInfo,
              is_active: userTitle.is_active,
              unlocked_at: userTitle.unlocked_at
            }
          })
          
          if (isMounted) {
            setUnlockedTitles(fullTitles)
            
            // Finn aktiv tittel
            const activeT = fullTitles.find(t => t.is_active)
            if (activeT) {
              setActiveTitle(activeT.name)
            } else if (fullTitles.length > 0) {
              // Hvis ingen tittel er aktiv, sett den første som aktiv
              setActiveTitle(fullTitles[0].name)
              
              // Oppdater til aktiv i databasen
              await supabase
                .from('user_titles')
                .update({ is_active: true })
                .eq('user_id', user.id)
                .eq('title_name', fullTitles[0].name)
            }
          }
        } else if (isMounted) {
          // Hvis brukeren ikke har noen titler, sett standard tittel
          setUnlockedTitles([{
            name: 'Eventyrsøkeren',
            description: 'Standard tittel for nye spillere',
            rarity: 'common',
            source: 'Grunnleggende',
            unlocked_at: new Date().toISOString(),
            is_active: true
          }])
          setActiveTitle('Eventyrsøkeren')
        }
        
        // Last achievements fra databasen
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
        
        if (achievementsError) {
          console.error('Feil ved henting av achievements:', achievementsError)
          return
        }
        
        if (achievementsData && isMounted) {
          // Map database achievements to our format with condition and progress functions
          const formattedAchievements = achievementsData.map(achievement => {
            return {
              ...achievement,
              condition: (stats) => getProgressValue(stats, achievement.stat_key) >= achievement.total,
              progress: (stats) => getProgressValue(stats, achievement.stat_key)
            }
          })
          
          setDatabaseAchievements(formattedAchievements)
        }
      } catch (error) {
        console.error('Generell feil ved lastning av brukerdata:', error)
      }
    }
    
    loadStats()
    
    return () => {
      isMounted = false;
    }
  }, [user])
  
  // Hjelpefunksjon for å hente riktig statistikkverdi basert på databasenøkkel
  const getProgressValue = (stats, statKey) => {
    if (!statKey) return 0
    
    switch (statKey) {
      case 'login_count':
        return stats.loginCount || 0
      case 'quests_completed':
        return stats.questsCompleted || 0
      case 'messages_count':
        return stats.messagesCount || 0
      case 'items_collected':
        return stats.itemsCollected || 0
      case 'monsters_killed':
        return stats.monstersKilled || 0
      case 'gold_earned':
        return stats.goldEarned || 0
      case 'cities_visited':
        return (stats.citiesVisited || []).length
      case 'distance_traveled':
        return stats.distanceTraveled || 0
      case 'items_crafted':
        return stats.itemsCrafted || 0
      case 'resources_gathered':
        return stats.resourcesGathered || 0
      case 'battles_won':
        return stats.battlesWon || 0
      default:
        return 0
    }
  }
  
  // Mapping med titler og deres detaljer
  const titleDetails = {
    'Eventyrsøkeren': { 
      description: 'Standard tittel for nye spillere', 
      rarity: 'common',
      source: 'Grunnleggende'
    },
    'Reisende': { 
      description: 'Besøkt 3 forskjellige byer', 
      rarity: 'uncommon',
      source: 'Achievement: Reisende'
    },
    'Den Sosiale': { 
      description: 'Sendt 50 meldinger i chat', 
      rarity: 'uncommon',
      source: 'Achievement: Sosial sommerfugl' 
    },
    'Oppdragstaker': { 
      description: 'Fullført 5 oppdrag', 
      rarity: 'rare',
      source: 'Achievement: Oppdragstaker' 
    },
    'Oppdragsmester': { 
      description: 'Fullført 10 oppdrag', 
      rarity: 'epic',
      source: 'Achievement: Profesjonell oppdragstaker' 
    },
    'Samler': { 
      description: 'Samlet 5 sjeldne gjenstander', 
      rarity: 'rare',
      source: 'Achievement: Samleren' 
    },
    'Den Dedikerte': { 
      description: 'Logget inn 10 ganger', 
      rarity: 'uncommon',
      source: 'Achievement: Dedikert spiller' 
    },
    'Gullsmed': { 
      description: 'Tjent 1000 gull', 
      rarity: 'epic',
      source: 'Achievement: Mesterhandler' 
    },
    'Monsterslakteren': { 
      description: 'Beseiret 100 monstre', 
      rarity: 'legendary',
      source: 'Achievement: Monstertemmeren' 
    }
  }
  
  // Sjekk for nye achievements som bør låses opp
  useEffect(() => {
    if (!user || databaseAchievements.length === 0) return
    
    let isMounted = true;
    let timeoutId;
    let lastCheck = 0;
    
    const updateAchievementProgress = async () => {
      if (!isMounted) return;
      
      try {
        // Oppdater fremgang for alle achievements
        for (const achievement of databaseAchievements) {
          const progress = achievement.progress(trackedStats);
          
          // Oppdater fremgang i databasen
          const { error: updateError } = await supabase
            .from('user_achievements')
            .upsert({
              user_id: user.id,
              achievement_id: achievement.id,
              progress: progress,
              completed: achievement.condition(trackedStats),
              date_completed: achievement.condition(trackedStats) ? new Date().toISOString() : null
            }, {
              onConflict: 'user_id,achievement_id'
            });
            
          if (updateError) {
            console.error('Feil ved oppdatering av achievement fremgang:', updateError);
          }
        }
      } catch (error) {
        console.error('Feil ved oppdatering av achievements:', error);
      }
    };
    
    const checkForAchievements = async () => {
      if (!isMounted) return;
      
      const now = Date.now();
      // Sjekk bare hvis det har gått minst 5 sekunder siden siste sjekk
      if (now - lastCheck < 5000) return;
      lastCheck = now;
      
      try {
        // Oppdater fremgang først
        await updateAchievementProgress();
        
        // Hent brukerens låste achievements
        const { data: userAchievements, error: achievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id, completed')
          .eq('user_id', user.id)
        
        if (achievementsError) {
          console.error('Feil ved henting av achievements:', achievementsError)
          return
        }
        
        const completedAchievementIds = userAchievements
          ?.filter(a => a.completed)
          .map(a => a.achievement_id) || []
        
        // Finn achievements som skal låses opp
        const newUnlocks = databaseAchievements.filter(achievement => {
          // Sjekk om achievement allerede er oppnådd
          if (completedAchievementIds.includes(achievement.id)) return false
          
          // Sjekk om kriteriet er oppfylt
          return achievement.condition(trackedStats)
        })
        
        for (const achievement of newUnlocks) {
          if (!isMounted) return;
          
          const progress = achievement.progress(trackedStats)
          const total = achievement.total
          
          // Lag komplett achievement-objekt
          const completeAchievement = {
            ...achievement,
            progress,
            total,
            completed: true,
            date_completed: new Date().toISOString()
          }
          
          // Lagre achievement i databasen med upsert for å håndtere konflikter
          const { error: insertError } = await supabase
            .from('user_achievements')
            .upsert({
              user_id: user.id,
              achievement_id: achievement.id,
              progress: progress,
              completed: true,
              date_completed: new Date().toISOString()
            }, {
              onConflict: 'user_id,achievement_id'
            })
          
          if (insertError) {
            console.error('Feil ved lagring av achievement:', insertError)
            continue
          }
          
          // Finn tittelbelønning basert på reward-feltet
          let titleMatch = null
          if (achievement.reward) {
            const rewardText = achievement.reward.toLowerCase()
            const titlePrefix = 'tittel:'
            
            if (rewardText.includes(titlePrefix)) {
              const titleStart = rewardText.indexOf(titlePrefix) + titlePrefix.length
              let titleEnd = rewardText.indexOf(',', titleStart)
              if (titleEnd === -1) titleEnd = rewardText.length
              
              const titleName = rewardText.substring(titleStart, titleEnd).trim()
              if (titleName) {
                titleMatch = titleName
              }
            }
          }
          
          // Lås opp tittel hvis funnet
          if (titleMatch) {
            await unlockTitle(titleMatch)
          }
          
          // Vis achievement-melding
          showAchievement(completeAchievement)
        }
      } catch (error) {
        console.error('Feil ved sjekking av achievements:', error)
      }
    }
    
    // Bruk debounce for å unngå for mange kall
    timeoutId = setTimeout(checkForAchievements, 1000)
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    }
  }, [trackedStats, user, showAchievement, databaseAchievements])
  
  // Funksjon for å låse opp en ny tittel
  const unlockTitle = async (titleName) => {
    if (!user) return;
    
    // Sjekk om brukeren allerede har tittelen
    const { data: existingTitle, error: checkError } = await supabase
      .from('user_titles')
      .select('*')
      .eq('user_id', user.id)
      .eq('title_name', titleName)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Feil ved sjekking av eksisterende tittel:', checkError);
      return;
    }
    
    // Hvis brukeren ikke har tittelen, lås den opp
    if (!existingTitle) {
      // Sjekk først at tittelen finnes i tittel-tabellen
      const { data: titleExists, error: titleCheckError } = await supabase
        .from('titles')
        .select('name')
        .eq('name', titleName)
        .single();
      
      if (titleCheckError && titleCheckError.code !== 'PGRST116') {
        console.error('Feil ved sjekking av tittel:', titleCheckError);
        return;
      }
      
      // Hvis tittelen ikke finnes, lag den (med standard informasjon)
      if (!titleExists) {
        const titleData = titleDetails[titleName] || {
          description: 'Spesiell tittel',
          rarity: 'uncommon', 
          source: 'Achievement'
        };
        
        const { error: createTitleError } = await supabase
          .from('titles')
          .insert({
            name: titleName,
            description: titleData.description,
            rarity: titleData.rarity,
            source: titleData.source
          });
        
        if (createTitleError) {
          console.error('Feil ved opprettelse av tittel:', createTitleError);
          return;
        }
      }
      
      // Lås opp tittelen for brukeren
      const { error: unlockError } = await supabase
        .from('user_titles')
        .insert({
          user_id: user.id,
          title_name: titleName,
          is_active: false, // Ikke sett som aktiv automatisk
          unlocked_at: new Date().toISOString()
        });
      
      if (unlockError) {
        console.error('Feil ved opplåsing av tittel:', unlockError);
        return;
      }
      
      // Oppdater tittel-listen
      const { data: titleInfo, error: titleInfoError } = await supabase
        .from('titles')
        .select('*')
        .eq('name', titleName)
        .single();
      
      if (titleInfoError) {
        console.error('Feil ved henting av tittelinfo:', titleInfoError);
        return;
      }
      
      if (titleInfo) {
        const newTitle = {
          ...titleInfo,
          is_active: false,
          unlocked_at: new Date().toISOString()
        };
        
        setUnlockedTitles(prev => [...prev, newTitle]);
      }
    }
  };
  
  // Funksjon for å endre aktiv tittel
  const setTitle = async (titleName) => {
    if (!user) return;
    
    try {
      // Fjern aktiv status fra alle titler
      const { error: clearError } = await supabase
        .from('user_titles')
        .update({ is_active: false })
        .eq('user_id', user.id);
      
      if (clearError) throw clearError;
      
      // Sett ny aktiv tittel
      const { error: updateError } = await supabase
        .from('user_titles')
        .update({ is_active: true })
        .eq('user_id', user.id)
        .eq('title_name', titleName);
      
      if (updateError) throw updateError;
      
      // Oppdater lokalt
      setActiveTitle(titleName);
      setUnlockedTitles(prev => 
        prev.map(title => ({
          ...title,
          is_active: title.name === titleName
        }))
      );
      
      toast.success(`Tittel byttet til ${titleName}`);
    } catch (error) {
      console.error('Feil ved endring av tittel:', error);
      toast.error('Kunne ikke endre tittel');
    }
  };
  
  // Konverter camelCase stat keys til snake_case for databasen
  const convertToDatabaseKey = (key) => {
    switch (key) {
      case 'loginCount': return 'login_count';
      case 'questsCompleted': return 'quests_completed';
      case 'messagesCount': return 'messages_count';
      case 'itemsCollected': return 'items_collected';
      case 'monstersKilled': return 'monsters_killed';
      case 'goldEarned': return 'gold_earned';
      case 'citiesVisited': return 'cities_visited';
      case 'distanceTraveled': return 'distance_traveled';
      case 'itemsCrafted': return 'items_crafted';
      case 'resourcesGathered': return 'resources_gathered';
      case 'battlesWon': return 'battles_won';
      default: return key;
    }
  };
  
  // Inkrementere en numerisk statistikk
  const incrementStat = async (key, amount = 1) => {
    if (!user) {
      console.error('Kan ikke inkrementere statistikk: Bruker ikke logget inn')
      return
    }
    
    console.log(`Inkrementerer statistikk ${key} med ${amount}`, { userId: user.id })
    
    const dbKey = convertToDatabaseKey(key)
    
    // Oppdater lokalt
    setTrackedStats(prev => {
      const newValue = typeof prev[key] === 'number' ? prev[key] + amount : amount
      console.log(`Lokalt oppdatert ${key} fra ${prev[key]} til ${newValue}`)
      return { ...prev, [key]: newValue }
    })
    
    // Oppdater i databasen ved bruk av RPC-funksjon
    try {
      console.log(`Kaller increment_user_stat(${user.id}, ${dbKey}, ${amount})`)
      const { data, error } = await supabase.rpc('increment_user_stat', { 
        user_id_param: user.id,
        stat_key: dbKey,
        increment_amount: amount
      })
      
      if (error) {
        console.error(`Feil ved inkrementering av statistikk ${key}:`, error)
        
        // Fallback: Bruk direkte databaseoppdatering
        try {
          // Sjekk først om brukeren har en statistikk-rad
          const { data: userStats } = await supabase
            .from('user_stats')
            .select(dbKey)
            .eq('user_id', user.id)
            .single()
          
          if (userStats) {
            // Brukeren finnes, oppdater med direkte UPDATE
            let currentValue = userStats[dbKey] || 0
            const newValue = currentValue + amount
            
            const { error: updateError } = await supabase
              .from('user_stats')
              .update({ 
                [dbKey]: newValue,
                last_updated: new Date().toISOString() 
              })
              .eq('user_id', user.id)
            
            if (updateError) {
              console.error(`Feil ved direkte oppdatering av ${key}:`, updateError)
            } else {
              console.log(`Fallback: Oppdatert ${key} til ${newValue}`)
            }
          } else {
            // Brukeren finnes ikke, opprett ny rad
            const initialStats = {
              user_id: user.id,
              login_count: key === 'loginCount' ? amount : 0,
              quests_completed: key === 'questsCompleted' ? amount : 0,
              messages_count: key === 'messagesCount' ? amount : 0,
              items_collected: key === 'itemsCollected' ? amount : 0,
              monsters_killed: key === 'monstersKilled' ? amount : 0,
              gold_earned: key === 'goldEarned' ? amount : 0,
              cities_visited: [],
              distance_traveled: key === 'distanceTraveled' ? amount : 0,
              items_crafted: key === 'itemsCrafted' ? amount : 0,
              resources_gathered: key === 'resourcesGathered' ? amount : 0,
              battles_won: key === 'battlesWon' ? amount : 0,
              last_updated: new Date().toISOString()
            }
            
            const { error: insertError } = await supabase
              .from('user_stats')
              .insert(initialStats)
            
            if (insertError) {
              console.error('Feil ved oppretting av statistikk:', insertError)
            } else {
              console.log('Opprettet ny statistikk-rad for bruker')
            }
          }
        } catch (fallbackError) {
          console.error('Fallback-metode feilet også:', fallbackError)
        }
      } else {
        console.log(`Vellykket inkrementering av ${key}`, data)
      }
    } catch (error) {
      console.error('Generell feil ved inkrementering av statistikk:', error)
    }
  }
  
  // Funksjon for å legge til et element i et array (f.eks. byer besøkt)
  const addToArrayStat = async (key, value) => {
    if (!user) return;
    
    // Unngå duplikater
    if (key === 'citiesVisited' && trackedStats.citiesVisited.includes(value)) {
      return;
    }
    
    try {
      // Oppdater lokalt
      setTrackedStats(prev => {
        const updatedArray = [...prev[key], value];
        return { ...prev, [key]: updatedArray };
      });
      
      // Oppdater i databasen
      const dbKey = convertToDatabaseKey(key);
      
      if (key === 'citiesVisited') {
        // Bruk RPC for byer
        const { error } = await supabase.rpc('add_city_to_visited', {
          user_id_param: user.id,
          city_name: value
        });
        
        if (error) {
          console.error(`Feil ved oppdatering av ${key}:`, error);
          
          // Fallback: Direkte oppdatering
          const { data: existingStats } = await supabase
            .from('user_stats')
            .select('cities_visited')
            .eq('user_id', user.id)
            .single();
          
          if (existingStats) {
            const existingCities = existingStats.cities_visited || [];
            
            if (!existingCities.includes(value)) {
              const updatedCities = [...existingCities, value];
              
              await supabase
                .from('user_stats')
                .update({ 
                  cities_visited: updatedCities,
                  last_updated: new Date().toISOString() 
                })
                .eq('user_id', user.id);
            }
          } else {
            // Opprett ny statistikk
            await supabase
              .from('user_stats')
              .insert({
                user_id: user.id,
                cities_visited: [value],
                last_updated: new Date().toISOString()
              });
          }
        }
      }
    } catch (error) {
      console.error(`Feil ved oppdatering av array ${key}:`, error);
    }
  };
  
  return {
    trackedStats,
    unlockedTitles,
    activeTitle,
    getActiveTitle: () => activeTitle,
    getUnlockedTitles: () => unlockedTitles,
    unlockTitle,
    setTitle,
    incrementStat,
    addToArrayStat
  }
} 