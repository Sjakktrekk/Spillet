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
    loginCount: 0
  })
  
  // State for å holde styr på låste titler
  const [unlockedTitles, setUnlockedTitles] = useState([])
  const [activeTitle, setActiveTitle] = useState(null)
  
  // Last inn brukerens stats fra databasen
  useEffect(() => {
    if (!user) return
    
    let isMounted = true;
    
    const loadStats = async () => {
      try {
        // Hent brukerens stats fra Supabase
        const { data: userStats, error: statsError } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (statsError && statsError.code !== 'PGRST116') {
          console.error('Feil ved henting av statistikk:', statsError)
          return
        }
        
        // Hvis brukeren ikke har stats ennå, opprett en ny rad
        if (!userStats) {
          const initialStats = {
            user_id: user.id,
            login_count: 1, // Første innlogging
            quests_completed: 0,
            messages_count: 0,
            items_collected: 0,
            monsters_killed: 0,
            gold_earned: 0,
            cities_visited: []
          }
          
          const { error: insertError } = await supabase
            .from('user_stats')
            .insert(initialStats)
          
          if (insertError) {
            console.error('Feil ved oppretting av brukerstatistikk:', insertError)
            return
          }
          
          setTrackedStats(initialStats)
          
          // For nye brukere, sett kun standard tittel
          const { error: titleError } = await supabase
            .from('user_titles')
            .upsert({
              user_id: user.id,
              title_name: 'Eventyrsøkeren',
              unlocked_at: new Date().toISOString(),
              is_active: true
            }, {
              onConflict: 'user_id,title_name'
            })
          
          if (titleError) {
            console.error('Feil ved oppretting av standard tittel:', titleError)
            return
          }
          
          setUnlockedTitles([{
            name: 'Eventyrsøkeren',
            description: 'Standard tittel for nye spillere',
            rarity: 'common',
            source: 'Grunnleggende',
            unlocked_at: new Date().toISOString(),
            is_active: true
          }])
          setActiveTitle('Eventyrsøkeren')
        } else {
          // Konverter cities_visited fra JSONB til array hvis det er nødvendig
          const formattedStats = {
            ...userStats,
            citiesVisited: Array.isArray(userStats.cities_visited) 
              ? userStats.cities_visited 
              : JSON.parse(userStats.cities_visited || '[]'),
            loginCount: userStats.login_count,
            questsCompleted: userStats.quests_completed,
            messagesCount: userStats.messages_count,
            itemsCollected: userStats.items_collected,
            monstersKilled: userStats.monsters_killed,
            goldEarned: userStats.gold_earned
          }
          
          setTrackedStats(formattedStats)
          
          // Hent brukerens achievements først
          const { data: userAchievements, error: achievementsError } = await supabase
            .from('user_achievements')
            .select('achievement_id, completed')
            .eq('user_id', user.id)
            .eq('completed', true)
          
          if (achievementsError) {
            console.error('Feil ved henting av achievements:', achievementsError)
            return
          }
          
          const completedAchievementIds = userAchievements?.map(a => a.achievement_id) || []
          
          // Finn hvilke titler som er tilgjengelige basert på oppnådde achievements
          const availableTitles = allAchievements
            .filter(achievement => 
              completedAchievementIds.includes(achievement.id) && 
              achievement.unlockTitle
            )
            .map(achievement => achievement.unlockTitle)
          
          // Legg til standard tittel hvis den ikke allerede er der
          if (!availableTitles.includes('Eventyrsøkeren')) {
            availableTitles.push('Eventyrsøkeren')
          }
          
          // Hent detaljer for tilgjengelige titler
          const { data: userTitles, error: titlesError } = await supabase
            .from('user_titles')
            .select(`
              title_name,
              is_active,
              unlocked_at,
              titles (
                name,
                description,
                rarity,
                source
              )
            `)
            .eq('user_id', user.id)
            .in('title_name', availableTitles)
          
          if (titlesError) {
            console.error('Feil ved henting av titler:', titlesError)
            return
          }
          
          if (userTitles && userTitles.length > 0) {
            // Formater titler for React state
            const formattedTitles = userTitles.map(title => ({
              name: title.title_name,
              description: title.titles.description,
              rarity: title.titles.rarity,
              source: title.titles.source,
              unlocked_at: title.unlocked_at,
              is_active: title.is_active
            }))
            
            setUnlockedTitles(formattedTitles)
            
            // Sett aktiv tittel hvis brukeren har valgt en
            const activeUserTitle = userTitles.find(title => title.is_active)
            if (activeUserTitle) {
              setActiveTitle(activeUserTitle.title_name)
            } else {
              // Hvis ingen aktiv tittel, sett standard tittel som aktiv
              setActiveTitle('Eventyrsøkeren')
            }
          } else {
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
  
  // Liste over alle mulige achievements i spillet
  const allAchievements = [
    {
      id: 'login1',
      name: 'Eventyrets begynnelse',
      description: 'Logg inn for første gang',
      category: 'generelt',
      icon: '🏆',
      reward: '50 XP',
      difficulty: 'lett',
      condition: stats => stats.loginCount >= 1,
      progress: stats => Math.min(stats.loginCount, 1),
      total: 1
    },
    {
      id: 'login10',
      name: 'Dedikert spiller',
      description: 'Logg inn 10 ganger',
      category: 'generelt',
      icon: '🌟',
      reward: '100 XP, 50 Gull',
      difficulty: 'medium',
      condition: stats => stats.loginCount >= 10,
      progress: stats => Math.min(stats.loginCount, 10),
      total: 10,
      unlockTitle: 'Den Dedikerte' // Ny tittel som låses opp
    },
    {
      id: 'cities3',
      name: 'Reisende',
      description: 'Besøk 3 forskjellige byer',
      category: 'utforskning',
      icon: '🗺️',
      reward: '100 XP, 50 Gull, Tittel: Reisende',
      difficulty: 'medium',
      condition: stats => stats.citiesVisited.length >= 3,
      progress: stats => stats.citiesVisited.length,
      total: 3,
      unlockTitle: 'Reisende'
    },
    {
      id: 'quests5',
      name: 'Oppdragstaker',
      description: 'Fullfør 5 oppdrag',
      category: 'oppdrag',
      icon: '📜',
      reward: '150 XP, 100 Gull, Tittel: Oppdragstaker',
      difficulty: 'medium',
      condition: stats => stats.questsCompleted >= 5,
      progress: stats => stats.questsCompleted,
      total: 5,
      unlockTitle: 'Oppdragstaker'
    },
    {
      id: 'quests10',
      name: 'Profesjonell oppdragstaker',
      description: 'Fullfør 10 oppdrag',
      category: 'oppdrag',
      icon: '📜',
      reward: '250 XP, 150 Gull, Tittel: Oppdragsmester',
      difficulty: 'hard',
      condition: stats => stats.questsCompleted >= 10,
      progress: stats => stats.questsCompleted,
      total: 10,
      unlockTitle: 'Oppdragsmester'
    },
    {
      id: 'items5',
      name: 'Samleren',
      description: 'Samle 5 sjeldne gjenstander',
      category: 'inventar',
      icon: '💎',
      reward: '200 XP, 1 Episk kiste, Tittel: Samler',
      difficulty: 'medium',
      condition: stats => stats.itemsCollected >= 5,
      progress: stats => stats.itemsCollected,
      total: 5,
      unlockTitle: 'Samler'
    },
    {
      id: 'chat50',
      name: 'Sosial sommerfugl',
      description: 'Send 50 chat-meldinger',
      category: 'sosialt',
      icon: '💬',
      reward: '100 XP, Tittel: Den Sosiale',
      difficulty: 'lett',
      condition: stats => stats.messagesCount >= 50,
      progress: stats => stats.messagesCount,
      total: 50,
      unlockTitle: 'Den Sosiale'
    },
    {
      id: 'gold1000',
      name: 'Mesterhandler',
      description: 'Tjene totalt 1000 gull',
      category: 'handel',
      icon: '💰',
      reward: '50 XP, 10% rabatt hos alle handelsmenn, Tittel: Gullsmed',
      difficulty: 'hard',
      condition: stats => stats.goldEarned >= 1000,
      progress: stats => stats.goldEarned,
      total: 1000,
      unlockTitle: 'Gullsmed'
    },
    {
      id: 'monsters100',
      name: 'Monstertemmeren',
      description: 'Beseire 100 monstre',
      category: 'kamp',
      icon: '⚔️',
      reward: '300 XP, Legendarisk våpen, Tittel: Monsterslakteren',
      difficulty: 'hard',
      condition: stats => stats.monstersKilled >= 100,
      progress: stats => stats.monstersKilled,
      total: 100,
      unlockTitle: 'Monsterslakteren'
    }
  ]
  
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
    if (!user) return
    
    let isMounted = true;
    let timeoutId;
    let lastCheck = 0;
    
    const updateAchievementProgress = async () => {
      if (!isMounted) return;
      
      try {
        // Oppdater fremgang for alle achievements
        for (const achievement of allAchievements) {
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
        
        const newUnlocks = allAchievements.filter(achievement => {
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
          
          // Lås opp tittel hvis achievement har en
          if (achievement.unlockTitle) {
            await unlockTitle(achievement.unlockTitle)
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
  }, [trackedStats, user, showAchievement])
  
  // Funksjon for å låse opp en ny tittel
  const unlockTitle = async (title) => {
    if (!user || !title) return;
    
    try {
      // Sjekk først om tittelen allerede er låst opp i unlockedTitles state
      if (unlockedTitles.some(t => t.name === title)) {
        return;
      }

      // Sjekk om tittelen allerede er låst opp i databasen
      const { data: existingTitle, error: checkError } = await supabase
        .from('user_titles')
        .select('*')
        .eq('user_id', user.id)
        .eq('title_name', title)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Feil ved sjekk av eksisterende tittel:', checkError);
        return;
      }

      // Hvis tittelen allerede finnes, ikke gjør noe
      if (existingTitle) {
        return;
      }

      // Legg til ny tittel med upsert for å håndtere konflikter
      const { error: insertError } = await supabase
        .from('user_titles')
        .upsert({
          user_id: user.id,
          title_name: title,
          unlocked_at: new Date().toISOString(),
          is_active: false
        }, {
          onConflict: 'user_id,title_name'
        });

      if (insertError) {
        console.error('Feil ved opplåsing av tittel:', insertError);
        return;
      }

      // Oppdater listen over låste opp titler
      setUnlockedTitles(prev => [...prev, {
        name: title,
        description: titleDetails[title]?.description || '',
        rarity: titleDetails[title]?.rarity || 'common',
        source: titleDetails[title]?.source || 'Ukjent',
        unlocked_at: new Date().toISOString(),
        is_active: false
      }]);
      
      // Vis en melding til brukeren
      toast.success(`Du har låst opp tittelen: ${title}!`);
    } catch (error) {
      console.error('Uventet feil ved opplåsing av tittel:', error);
    }
  };
  
  // Funksjon for å sette aktiv tittel
  const setActiveTitleForUser = async (titleName) => {
    if (!user) return
    
    try {
      // Sjekk først om brukeren har denne tittelen
      const { data: hasTitle, error: checkError } = await supabase
        .from('user_titles')
        .select('id')
        .eq('user_id', user.id)
        .eq('title_name', titleName)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Feil ved sjekking av tittel:', checkError)
        return
      }
      
      if (!hasTitle) {
        console.warn('Brukeren forsøker å sette en tittel de ikke har låst opp')
        return
      }
      
      // Oppdater alle titler til ikke aktive først
      const { error: updateAllError } = await supabase
        .from('user_titles')
        .update({ is_active: false })
        .eq('user_id', user.id)
      
      if (updateAllError) {
        console.error('Feil ved oppdatering av titler:', updateAllError)
        return
      }
      
      // Sett valgt tittel til aktiv
      const { error: updateError } = await supabase
        .from('user_titles')
        .update({ is_active: true })
        .eq('user_id', user.id)
        .eq('title_name', titleName)
      
      if (updateError) {
        console.error('Feil ved aktivering av tittel:', updateError)
        return
      }
      
      // Oppdater lokal state
      setActiveTitle(titleName)
    } catch (error) {
      console.error('Generell feil ved endring av aktiv tittel:', error)
    }
  }
  
  // Funksjon for å oppdatere en statistikk
  const updateStats = async (key, value) => {
    if (!user) return
    
    console.log(`Oppdaterer statistikk ${key} til ${value}`)
    
    const dbKey = convertToDatabaseKey(key)
    
    // Oppdater lokalt
    setTrackedStats(prev => {
      const oldValue = prev[key]
      console.log(`Lokalt oppdatert ${key} fra ${oldValue} til ${value}`)
      return { ...prev, [key]: value }
    })
    
    // Oppdater i databasen
    try {
      const { error } = await supabase
        .from('user_stats')
        .update({ 
          [dbKey]: value, 
          last_updated: new Date().toISOString() 
        })
        .eq('user_id', user.id)
      
      if (error) {
        console.error(`Feil ved oppdatering av statistikk ${key}:`, error)
        
        // Prøv å sette inn en ny rad hvis brukeren ikke finnes
        try {
          // Sjekk om brukeren finnes i user_stats
          const { data: existingUser } = await supabase
            .from('user_stats')
            .select('user_id')
            .eq('user_id', user.id)
            .single()
            
          if (!existingUser) {
            // Bruker finnes ikke, opprett ny statistikk
            const initialStats = {
              user_id: user.id,
              login_count: key === 'loginCount' ? value : 0,
              quests_completed: key === 'questsCompleted' ? value : 0,
              messages_count: key === 'messagesCount' ? value : 0,
              items_collected: key === 'itemsCollected' ? value : 0,
              monsters_killed: key === 'monstersKilled' ? value : 0,
              gold_earned: key === 'goldEarned' ? value : 0,
              cities_visited: []
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
        } catch (checkError) {
          console.error('Feil ved sjekk av bruker:', checkError)
        }
      } else {
        console.log(`Vellykket oppdatering av ${key} til ${value}`)
      }
    } catch (error) {
      console.error('Generell feil ved oppdatering av statistikk:', error)
    }
  }
  
  // Funksjon for å inkrementere en statistikk
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
  const addToArray = async (key, item) => {
    if (!user) return
    
    console.log(`Legger til ${item} i ${key}`)
    
    if (key !== 'citiesVisited') {
      console.error(`addToArray støttes bare for 'citiesVisited' for øyeblikket`)
      return
    }
    
    const dbKey = convertToDatabaseKey(key)
    
    // Oppdater lokalt først
    setTrackedStats(prev => {
      const currentArray = prev[key] || []
      // Sjekk om elementet allerede finnes
      if (currentArray.includes(item)) {
        return prev
      }
      return { ...prev, [key]: [...currentArray, item] }
    })
    
    // Oppdater i databasen
    try {
      // Bruk den nye database-funksjonen for å legge til byer
      const { data, error } = await supabase.rpc('add_city_to_visited', { 
        user_id_param: user.id,
        city_name: item
      })
      
      if (error) {
        console.error(`Feil ved oppdatering av ${key} med ${item}:`, error)
        
        // Fallback-løsning om funksjonen ikke fungerer
        try {
          console.log('Prøver fallback-metode...')
          // Hent nåværende data
          const { data: currentData, error: fetchError } = await supabase
            .from('user_stats')
            .select(dbKey)
            .eq('user_id', user.id)
            .single()
            
          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              // Bruker finnes ikke, opprett ny
              const newStats = {
                user_id: user.id,
                [dbKey]: [item]
              }
              
              const { error: insertError } = await supabase
                .from('user_stats')
                .insert(newStats)
                
              if (insertError) throw insertError
            } else {
              throw fetchError
            }
          } else {
            // Bruker finnes, oppdater array
            let currentCities = []
            
            if (currentData[dbKey]) {
              // Parse JSON hvis det er en string
              if (typeof currentData[dbKey] === 'string') {
                try {
                  currentCities = JSON.parse(currentData[dbKey])
                } catch (e) {
                  console.error('Feil ved parsing av JSON:', e)
                  currentCities = []
                }
              } else {
                currentCities = currentData[dbKey]
              }
            }
            
            // Legg til ny by hvis den ikke allerede er der
            if (!currentCities.includes(item)) {
              currentCities.push(item)
              
              const { error: updateError } = await supabase
                .from('user_stats')
                .update({ 
                  [dbKey]: currentCities,
                  last_updated: new Date().toISOString()
                })
                .eq('user_id', user.id)
                
              if (updateError) throw updateError
            }
          }
        } catch (fallbackError) {
          console.error('Fallback-metode feilet også:', fallbackError)
        }
      } else {
        console.log(`Vellykket oppdatering av ${key} med ${item}`, data)
      }
    } catch (error) {
      console.error('Generell feil ved oppdatering av array:', error)
    }
  }
  
  // Funksjon for å registrere besøk til en by
  const visitCity = (cityName) => {
    if (!cityName) return
    console.log(`Registrerer besøk til by: ${cityName}`)
    addToArray('citiesVisited', cityName)
  }
  
  // Hjelpefunksjoner for spesifikke handlinger
  
  const sendMessage = () => {
    console.log('Inkrementerer meldingsteller')
    incrementStat('messagesCount', 1)
  }
  
  const completeQuest = () => {
    incrementStat('questsCompleted', 1)
  }
  
  const collectItem = () => {
    incrementStat('itemsCollected', 1)
  }
  
  const killMonster = () => {
    incrementStat('monstersKilled', 1)
  }
  
  const earnGold = (amount) => {
    incrementStat('goldEarned', amount)
  }
  
  const login = () => {
    incrementStat('loginCount', 1)
  }
  
  // Hjelpefunksjon for å konvertere camelCase til snake_case for databasen
  const convertToDatabaseKey = (key) => {
    switch (key) {
      case 'loginCount': return 'login_count'
      case 'questsCompleted': return 'quests_completed'
      case 'messagesCount': return 'messages_count'
      case 'itemsCollected': return 'items_collected'
      case 'monstersKilled': return 'monsters_killed'
      case 'goldEarned': return 'gold_earned'
      case 'citiesVisited': return 'cities_visited'
      default: return key
    }
  }
  
  // Hent lagrede titler
  const getUnlockedTitles = () => unlockedTitles
  
  // Hent aktiv tittel
  const getActiveTitle = () => activeTitle
  
  // Eksporter funksjon for å sette aktiv tittel
  const updateActiveTitle = (titleName) => {
    if (!titleName) return
    setActiveTitleForUser(titleName)
  }
  
  return {
    trackedStats,
    updateStats,
    incrementStat,
    addToArray,
    visitCity,
    unlockTitle,
    getUnlockedTitles,
    getActiveTitle,
    setActiveTitle: updateActiveTitle,
    // Eksporter hjelpefunksjonene
    sendMessage,
    completeQuest,
    collectItem,
    killMonster,
    earnGold,
    login
  }
} 