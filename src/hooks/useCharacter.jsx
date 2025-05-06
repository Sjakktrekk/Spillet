import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import useLevelUpModal from './useLevelUpModal';

export default function useCharacter() {
  const { user } = useAuth();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showLevelUpModal } = useLevelUpModal();

  // Funksjon for å beregne utstyrsbonuser
  const calculateEquipmentBonuses = (equipment) => {
    if (!equipment) return { health: 0, energy: 0 };

    let totalBonuses = {
      utholdenhet: 0,
      vitality: 0,
      endurance: 0
    };

    // Gå gjennom alle utstyrte gjenstander
    Object.values(equipment).forEach(item => {
      if (item && item.attributes) {
        Object.entries(item.attributes).forEach(([attr, value]) => {
          const attrLower = attr.toLowerCase();
          
          // Støtte både gamle og nye attributtnavn
          if (attrLower === 'utholdenhet') totalBonuses.utholdenhet += value;
          if (attrLower === 'vitality' || attrLower === 'vitalitet') totalBonuses.vitality += value;
          if (attrLower === 'endurance' || attrLower === 'utholdenhet') totalBonuses.endurance += value;
        });
      }
    });

    // Prioriter utholdenhet-ferdighet over gamle attributter hvis tilgjengelig
    const healthBonus = totalBonuses.utholdenhet > 0 
      ? totalBonuses.utholdenhet * 5  // 5 helse per utholdenhet-poeng
      : totalBonuses.vitality * 5;    // Bakoverkompatibilitet
    
    const energyBonus = totalBonuses.utholdenhet > 0
      ? totalBonuses.utholdenhet * 4  // 4 energi per utholdenhet-poeng
      : totalBonuses.endurance * 5;   // Bakoverkompatibilitet

    // Beregn helse og energi bonuser
    return {
      health: healthBonus,
      energy: energyBonus
    };
  };

  // Beregn total forsvarsverdi fra utstyr
  const calculateTotalDefense = (equipment) => {
    if (!equipment) return 0;
    
    let totalDefense = 0;
    
    // Gå gjennom alle utstyrte gjenstander
    Object.values(equipment).forEach(item => {
      if (item && item.defense) {
        totalDefense += item.defense;
      }
    });
    
    return totalDefense;
  };

  // Oppdater karakterens helse og energi basert på utstyr
  const updateCharacterStats = (char) => {
    if (!char) return char;

    const equipmentBonuses = calculateEquipmentBonuses(char.equipment);
    const totalDefense = calculateTotalDefense(char.equipment);
    
    return {
      ...char,
      max_health: (char.base_max_health || 100) + equipmentBonuses.health,
      max_energy: (char.base_max_energy || 100) + equipmentBonuses.energy,
      defense: totalDefense,
      // Sørg for at nåværende helse/energi ikke overstiger maks
      health: Math.min(char.health || char.max_health, (char.base_max_health || 100) + equipmentBonuses.health),
      energy: Math.min(char.energy || char.max_energy, (char.base_max_energy || 100) + equipmentBonuses.energy)
    };
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchCharacter() {
      try {
        // Først prøv å hente fra localStorage for umiddelbar visning
        const cachedCharacter = localStorage.getItem(`character_${user.id}`);
        if (cachedCharacter) {
          try {
            const parsedCharacter = JSON.parse(cachedCharacter);
            // Oppdater stats basert på utstyr
            const updatedCharacter = updateCharacterStats(parsedCharacter);
            setCharacter(updatedCharacter);
            // Fortsett til databasehenting i bakgrunnen
          } catch (e) {
            console.error('Feil ved parsing av cachet karakter', e);
          }
        }

        // Prøv å hente fra databasen
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          // Hvis tabellen ikke eksisterer (42P01) eller annen feil
          console.error('Error fetching character from database, using dummy data', error);
          if (!character) { // Bare sett dummy hvis vi ikke har karakter fra cache
            // Ikke bruk dummy-karakter automatisk, la Home-siden sjekke og omdirigere
            // setDummyCharacter();
          }
          setLoading(false);
          return;
        }

        if (data) {
          // Oppdater stats basert på utstyr
          const updatedCharacter = updateCharacterStats(data);
          // Lagre til localStorage for raskere tilgang senere
          localStorage.setItem(`character_${user.id}`, JSON.stringify(updatedCharacter));
          setCharacter(updatedCharacter);
          setLoading(false);
        } else {
          // Ingen karakter funnet, ikke bruk dummy automatisk
          console.log('No character found in database');
          // if (!character) { // Bare sett dummy hvis vi ikke har karakter fra cache
          //   setDummyCharacter();
          // }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching character', err);
        setError(err.message);
        // Hvis feiler, ruller tilbake til original
        setCharacter(null);
      }
    }

    function setDummyCharacter() {
      // Dummy-karakter for testing og fallback
      const dummyCharacter = {
        id: 'dummy-id',
        user_id: user.id,
        name: user?.email?.split('@')[0] || 'Eventyrer',
        race_id: 1,
        class_id: 1,
        level: 1,
        experience: 125,
        coins: 50,
        base_max_health: 100,
        base_max_energy: 100,
        health: 100,
        max_health: 100,
        energy: 75,
        max_energy: 100,
        skill_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Oppdater stats basert på utstyr
      const updatedCharacter = updateCharacterStats(dummyCharacter);
      // Lagre dummy-karakteren til localStorage så den er konsistent
      localStorage.setItem(`character_${user.id}`, JSON.stringify(updatedCharacter));
      setCharacter(updatedCharacter);
    }

    fetchCharacter();
  }, [user]);

  const updateCharacter = async (updates) => {
    if (!user || !character) return;

    try {
      // Oppdater character state med de nye verdiene
      const updatedCharacter = { ...character, ...updates };
      // Oppdater stats basert på utstyr
      const finalCharacter = updateCharacterStats(updatedCharacter);
      setCharacter(finalCharacter);

      // I en reell app ville vi oppdatert i Supabase
      const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', character.id);

      if (error) {
        console.error('Error updating character:', error);
        // Hvis feiler, ruller tilbake til original
        setCharacter(character);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating character:', error);
      // Hvis feiler, ruller tilbake til original
      setCharacter(character);
      return false;
    }
  };

  const addCoins = async (amount) => {
    if (!character) return false;
    return await updateCharacter({ coins: character.coins + amount });
  };

  const removeCoins = async (amount) => {
    if (!character) return false;
    if (character.coins < amount) return false;
    return await updateCharacter({ coins: character.coins - amount });
  };

  // Funksjon for å beregne XP som trengs for et bestemt nivå
  // XP øker med 10% for hvert nivå
  const calculateExperienceForLevel = (level) => {
    // Basisverdi for nivå 1 er 1000 XP
    const baseExperience = 1000;
    
    // For nivå 1 returnerer vi basisverdien
    if (level <= 1) return baseExperience;
    
    // For høyere nivåer beregner vi med 10% økning per nivå
    // Vi bruker Math.round for å unngå desimaltall
    return Math.round(baseExperience * Math.pow(1.1, level - 1));
  };

  const addExperience = async (amount) => {
    if (!character) return false;
    
    // Legg til erfaringspoeng
    const newExperience = character.experience + amount;
    
    // Sjekk om spilleren skal gå opp i nivå
    const experienceForNextLevel = calculateExperienceForLevel(character.level);
    
    if (newExperience >= experienceForNextLevel) {
      // Beregn overskuddserfaringspoeng
      const remainingExperience = newExperience - experienceForNextLevel;
      
      // Opprett det nye nivået
      const newLevel = character.level + 1;
      
      // Oppdater karakteren med nytt nivå og overskuddserfaringspoeng
      // Fjerner attributtpoeng (skill_points) siden vi nå bruker ferdighetssystemet
      const result = await updateCharacter({
        level: newLevel,
        experience: remainingExperience,
        // Legg til 5 maks helse og 3 maks energi ved level up
        max_health: (character.max_health || 100) + 5,
        max_energy: (character.max_energy || 100) + 3,
      });
      
      // Vis level-up modal hvis oppdateringen var vellykket
      if (result) {
        showLevelUpModal({
          name: character.name || user?.email?.split('@')[0] || 'Eventyrer',
          avatar: character.avatar_url,
          newLevel,
          bonusHealth: 5,
          bonusEnergy: 3
        });
      }
      
      return result;
    } else {
      // Bare legg til erfaringspoeng, ingen nivåopprykk
      return await updateCharacter({ experience: newExperience });
    }
  };

  // Denne funksjonen fjernes siden attributter ikke lenger brukes
  const useSkillPoint = async (skill) => {
    console.warn('useSkillPoint er foreldet - bruk increaseSkillProgress fra useSkills i stedet');
    return false;
  };

  return {
    character,
    loading,
    error,
    updateCharacter,
    addCoins,
    removeCoins,
    addExperience,
    // useSkillPoint beholdes i API men er dummy-funksjon for bakoverkompatibilitet
    useSkillPoint,
    calculateExperienceForLevel,
    calculateTotalDefense
  };
} 