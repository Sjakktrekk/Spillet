import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useParams } from 'react-router-dom'
import useCharacter from '../hooks/useCharacter'
import useSkills from '../hooks/useSkills'
import { supabase } from '../lib/supabase'
import BattleArena from '../components/Combat/BattleArena'
import MonsterSelector from '../components/Combat/MonsterSelector'
import MathProblemGenerator from '../components/Combat/MathProblemGenerator'
import CombatResults from '../components/Combat/CombatResults'
import combatBackground from '../assets/Arena.jpg'
import { format, addHours } from 'date-fns'
import { nb } from 'date-fns/locale'

export default function CombatArena() {
  const { user, loading: authLoading } = useAuth()
  const { character, loading: characterLoading, updateCharacter } = useCharacter()
  const { skills, loading: skillsLoading, getSkillLevel, increaseSkillProgress } = useSkills()
  const navigate = useNavigate()
  const { monsterLevel } = useParams()
  
  const [selectedMonsterLevel, setSelectedMonsterLevel] = useState(monsterLevel ? parseInt(monsterLevel) : 1)
  const [currentMonster, setCurrentMonster] = useState(null)
  const [combatActive, setCombatActive] = useState(false)
  const [combatResults, setCombatResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [damageTaken, setDamageTaken] = useState(0)
  const [defeatedMonsters, setDefeatedMonsters] = useState([])
  
  // Last inn monsterdata
  useEffect(() => {
    async function fetchMonsters() {
      try {
        const { data, error } = await supabase
          .from('monsters')
          .select('*')
          .eq('level', selectedMonsterLevel)
          .single()
          
        if (error) {
          console.error('Feil ved henting av monster:', error)
          return
        }
        
        if (data) {
          setCurrentMonster(data)
        }
      } catch (err) {
        console.error('Feil ved henting av monstre:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMonsters()
  }, [selectedMonsterLevel])
  
  // Hent liste over beseirede monstre
  useEffect(() => {
    if (!user) return;
    
    async function fetchDefeatedMonsters() {
      try {
        const { data, error } = await supabase
          .from('defeated_monsters')
          .select('monster_id, monster_level, defeated_at, respawn_at')
          .eq('user_id', user.id)
          
        if (error) {
          console.error('Feil ved henting av beseirede monstre:', error)
          return
        }
        
        if (data) {
          setDefeatedMonsters(data)
        }
      } catch (err) {
        console.error('Feil ved henting av beseirede monstre:', err)
      }
    }
    
    fetchDefeatedMonsters()
  }, [user])
  
  // Sjekk om brukeren er autentisert
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])
  
  // Funksjon for å starte kampmodusen
  const startCombat = async () => {
    if (!character || character.energy < 10) {
      console.error('Ikke nok energi til å starte kamp')
      return
    }
    
    try {
      // Trekk 10 energi fra karakteren
      await updateCharacter({
        energy: character.energy - 10
      })
      
      // Tilbakestill skade-telleren og start kampen
      setDamageTaken(0)
      setCombatActive(true)
      setCombatResults(null)
    } catch (error) {
      console.error('Feil ved start av kamp:', error)
    }
  }
  
  // Funksjon for å avslutte kamp og returnere til velgerskjermen
  const endCombat = () => {
    setCombatActive(false)
    setCombatResults(null)
    
    // Oppdater listen over beseirede monstre
    if (user) {
      fetchDefeatedMonsters()
    }
  }
  
  // Hjelpefunksjon for å hente beseirede monstre
  const fetchDefeatedMonsters = async () => {
    try {
      const { data, error } = await supabase
        .from('defeated_monsters')
        .select('monster_id, monster_level, defeated_at, respawn_at')
        .eq('user_id', user.id)
        
      if (error) {
        console.error('Feil ved oppdatering av beseirede monstre:', error)
        return
      }
      
      if (data) {
        setDefeatedMonsters(data)
      }
    } catch (err) {
      console.error('Feil ved oppdatering av beseirede monstre:', err)
    }
  }
  
  // Funksjon for å registrere skade tatt under kampen
  const onPlayerDamage = (damage) => {
    setDamageTaken(prev => prev + damage)
  }
  
  // Funksjon for å håndtere kamputfall
  const handleCombatResult = async (results) => {
    setCombatResults(results)
    setCombatActive(false)
    
    try {
      let updates = {};
      
      if (results.result === 'retreat') {
        // Ved retrett: trekk 50% av total energi og behold skaden tatt under kampen
        const energyPenalty = Math.floor(character.max_energy * 0.5);
        const newEnergy = Math.max(0, character.energy - energyPenalty);
        const newHealth = Math.max(0, character.health - damageTaken);
        
        updates = {
          health: newHealth,
          energy: newEnergy,
          experience: character.experience + results.rewards.xp
        };
        
        console.log(`Retrett: -${energyPenalty} energi, -${damageTaken} helse`);
      } else {
        // Seier eller nederlag
        const newHealth = Math.max(0, character.health - damageTaken);
        
        updates = {
          health: newHealth,
          experience: character.experience + results.rewards.xp,
          coins: character.coins + results.rewards.gold
        };
        
        console.log(`Kamp ferdig (${results.result}). Skade tatt: ${damageTaken}, Ny helse: ${newHealth}`);
        
        // Ved seier: registrer det beseirede monsteret
        if (results.result === 'victory' && currentMonster && user) {
          const now = new Date();
          const respawnTime = addHours(now, 10);
          
          // Registrer det beseirede monsteret i databasen
          const { error: upsertError } = await supabase
            .from('defeated_monsters')
            .upsert({
              user_id: user.id,
              monster_id: currentMonster.id,
              monster_level: currentMonster.level,
              defeated_at: now.toISOString(),
              respawn_at: respawnTime.toISOString()
            }, {
              onConflict: 'user_id,monster_id',
              ignoreDuplicates: false
            });
            
          if (upsertError) {
            console.error('Feil ved registrering av beseiret monster:', upsertError);
          } else {
            console.log(`Monster (nivå ${currentMonster.level}) registrert som beseiret, respawner ${format(respawnTime, 'PPPp', { locale: nb })}`);
          }
        }
      }
      
      // Oppdater karakteren
      await updateCharacter(updates);
      
      // Ved seier eller nederlag: oppdater kampferdighet
      if (results.result !== 'retreat' && results.rewards.skillProgress > 0) {
        await increaseSkillProgress('Kamp', results.rewards.skillProgress);
      }
      
    } catch (error) {
      console.error('Feil ved lagring av kampresultater:', error)
    }
  }
  
  // Funksjon for å endre monsterlevel
  const handleMonsterLevelChange = (level) => {
    setSelectedMonsterLevel(level)
    navigate(`/combat/${level}`)
  }
  
  // Sjekk om et monster kan bekjempes (ikke beseiret eller respawntid har gått ut)
  const canFightMonster = (monster) => {
    if (!monster || !defeatedMonsters || defeatedMonsters.length === 0) return true;
    
    const defeatedMonster = defeatedMonsters.find(
      dm => dm.monster_id === monster.id
    );
    
    if (!defeatedMonster) return true;
    
    const respawnTime = new Date(defeatedMonster.respawn_at);
    const now = new Date();
    
    return now >= respawnTime;
  }
  
  // Få respawn-tiden for et monster
  const getMonsterRespawnTime = (monster) => {
    if (!monster || !defeatedMonsters || defeatedMonsters.length === 0) return null;
    
    const defeatedMonster = defeatedMonsters.find(
      dm => dm.monster_id === monster.id
    );
    
    if (!defeatedMonster) return null;
    
    return new Date(defeatedMonster.respawn_at);
  }
  
  if (authLoading || characterLoading || skillsLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <div className="text-yellow-500 text-xl">Laster kampområdet...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      className="min-h-screen bg-gray-900 py-8 px-4"
      style={{
        backgroundImage: `url(${combatBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="max-w-6xl mx-auto bg-gray-800 bg-opacity-90 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-medieval text-yellow-400 mb-6 text-center">
            Kampområde - Tallenes Tårn
          </h1>
          
          {combatResults ? (
            <CombatResults 
              results={combatResults} 
              character={character}
              damageTaken={damageTaken}
              onContinue={endCombat}
            />
          ) : combatActive ? (
            <BattleArena
              character={character}
              monster={currentMonster}
              combatSkillLevel={getSkillLevel('Kamp')}
              onCombatEnd={handleCombatResult}
              onCancel={endCombat}
              onPlayerDamage={onPlayerDamage}
            />
          ) : (
            <MonsterSelector
              onStart={startCombat}
              selectedLevel={selectedMonsterLevel}
              onLevelChange={handleMonsterLevelChange}
              monster={currentMonster}
              character={character}
              canFight={canFightMonster(currentMonster)}
              respawnTime={getMonsterRespawnTime(currentMonster)}
            />
          )}
        </div>
      </div>
    </div>
  )
} 