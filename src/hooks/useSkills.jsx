import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Konstante nivåtitler for ferdigheter
export const SKILL_RANKS = {
  1: { rank: 'Nybegynner', color: 'gray-400' },
  5: { rank: 'Lærling', color: 'green-400' },
  10: { rank: 'Erfaren', color: 'blue-400' },
  15: { rank: 'Ekspert', color: 'purple-500' },
  20: { rank: 'Mester', color: 'yellow-500' },
  25: { rank: 'Virtuos', color: 'orange-500' },
  30: { rank: 'Legendarisk', color: 'red-500' }
};

// Konstant for ferdighetsdata som kan gjenbrukes i hele applikasjonen
export const SKILL_DATA = {
  'Kamp': {
    name: 'Kamp',
    description: 'Evnen til å bruke ulike typer våpen og teknikker i kamp, både nær- og avstandskamp.',
    icon: '⚔️',
    primaryEffect: 'Øker skade med alle våpentyper med 8% per nivå',
    secondaryEffects: [
      'Øker sjanse for kritiske treff med 2% per nivå',
      'Øker maks helse med 2 per nivå',
      'Låser opp spesielle kampkombinasjoner på høyere nivåer'
    ],
    levelsUpBy: 'Kjempe med alle våpentyper, fullføre kamptrening',
    color: 'red-500',
    maxLevel: 30,
    rankDescriptions: {
      5: 'Kan håndtere grunnleggende våpen effektivt',
      10: 'Mestrer avanserte teknikker i kamp',
      15: 'Kan beseire de fleste motstandere med letthet',
      20: 'En fryktet kriger kjent i hele landet',
      25: 'Kampteknikker nærmer seg legendarisk status',
      30: 'En levende legende på slagmarken'
    }
  },
  'Utholdenhet': {
    name: 'Utholdenhet',
    description: 'Evnen til å holde ut under krevende forhold og økt fysisk kapasitet.',
    icon: '🛡️',
    primaryEffect: 'Øker maks helse med 5 per nivå og maks energi med 4 per nivå',
    secondaryEffects: [
      'Reduserer energiforbruk ved reising med 5% per nivå',
      'Øker bæreevne med 10% per nivå'
    ],
    levelsUpBy: 'Reise lange avstander, kjempe i lengre kamper',
    color: 'orange-500',
    maxLevel: 30,
    rankDescriptions: {
      5: 'Kan reise lengre strekninger uten å bli utmattet',
      10: 'Kroppen tåler ekstreme forhold bedre enn de fleste',
      15: 'Nesten utømmelig utholdenhet i kamp og på reiser',
      20: 'Kan utholde forhold som ville knekket vanlige krigere',
      25: 'Legendarisk stamina og motstandskraft',
      30: 'Kroppen din virker nesten uovervinnelig'
    }
  },
  'Utforskning': {
    name: 'Utforskning',
    description: 'Evnen til å finne skjulte steder og gjenstander.',
    icon: '🧭',
    primaryEffect: 'Øker sjansen for å finne sjeldne gjenstander med 5% per nivå',
    secondaryEffects: [
      'Avslører flere detaljer på kartet',
      'Låser opp skjulte stier ved høyere nivåer'
    ],
    levelsUpBy: 'Besøke nye steder, oppdage skjulte områder',
    color: 'blue-400',
    maxLevel: 30,
    rankDescriptions: {
      5: 'Kan spore skjulte stier og hemmeligheter i kjente områder',
      10: 'En dyktig utforsker som finner det andre overser',
      15: 'Har et sjette sans for skjulte skatter og sjeldne funn',
      20: 'Berømt for å avdekke gamle hemmeligheter og tapte steder',
      25: 'Kan lese landskap som andre leser bøker',
      30: 'Den største oppdageren i vår tid'
    }
  },
  'Kunnskap': {
    name: 'Kunnskap',
    description: 'Intelligens, læringsevne og generell kunnskap om verden.',
    icon: '📚',
    primaryEffect: 'Øker erfaringspoeng fra alle kilder med 5% per nivå',
    secondaryEffects: [
      'Låser opp flere dialogalternativer',
      'Gir tilgang til spesielle oppgaver og gåter'
    ],
    levelsUpBy: 'Lese bøker, løse gåter, fullføre oppdrag med kunnskapskrav',
    color: 'indigo-400',
    maxLevel: 30,
    rankDescriptions: {
      5: 'Besitter kunnskap om grunnleggende historiske hendelser og skikker',
      10: 'En lærd person med bred forståelse av verden',
      15: 'Din visdom søkes av både vanlige folk og lærde',
      20: 'Kunnskapen din gir deg innflytelse hos de mektige',
      25: 'Få i verden kan måle seg med din innsikt og forståelse',
      30: 'Din intellekt har nådd et nesten overnaturlig nivå'
    }
  },
  'Magi': {
    name: 'Magi',
    description: 'Evnen til å manipulere magiske krefter og bruke trylleformler.',
    icon: '✨',
    primaryEffect: 'Øker effekten av alle magiske effekter med 10% per nivå',
    secondaryEffects: [
      'Reduserer energikostnad ved bruk av magi med 3% per nivå',
      'Øker varigheten av magiske effekter med 8% per nivå'
    ],
    levelsUpBy: 'Bruke magiske gjenstander, kaste trylleformler',
    color: 'purple-500',
    maxLevel: 30,
    rankDescriptions: {
      5: 'Kontrollerer grunnleggende magiske formler',
      10: 'Kreftene dine vekker respekt blant andre magikere',
      15: 'Magien din kan endre slag og påvirke hele byer',
      20: 'Mektige vesener og eldgamle ordener følger dine magiske bragder',
      25: 'Din magi nærmer seg mytiske proporsjoner',
      30: 'Din magiske kraft har nådd et nesten guddommelig nivå'
    }
  },
  'Overtalelse': {
    name: 'Overtalelse',
    description: 'Evnen til å påvirke andre gjennom ord og karisma.',
    icon: '💬',
    primaryEffect: 'Forbedrer alle prisforhold ved kjøp og salg med 3% per nivå',
    secondaryEffects: [
      'Låser opp unike dialogalternativer',
      'Øker sjansen for å unngå konflikter med 5% per nivå'
    ],
    levelsUpBy: 'Forhandle med kjøpmenn, overtale NPCer',
    color: 'pink-400',
    maxLevel: 30,
    rankDescriptions: {
      5: 'Folk lytter når du snakker og vurderer dine ideer',
      10: 'Din karisma åpner dører og forhandler bedre avtaler',
      15: 'Selv fiender kan overtales av dine veltalende argumenter',
      20: 'Ledere og herskere søker ditt råd i viktige saker',
      25: 'Ordene dine kan påvirke hele regioner og riker',
      30: 'Din overtalelsesevne grenser til det overnaturlige'
    }
  },
  'Håndverk': {
    name: 'Håndverk',
    description: 'Evnen til å lage og reparere gjenstander.',
    icon: '🔨',
    primaryEffect: 'Øker kvaliteten på skapte gjenstander med 10% per nivå',
    secondaryEffects: [
      'Reduserer materialkostnader med 5% per nivå',
      'Låser opp nye oppskrifter og formler ved høyere nivåer'
    ],
    levelsUpBy: 'Lage gjenstander, reparere utstyr',
    color: 'yellow-600',
    maxLevel: 30,
    rankDescriptions: {
      5: 'Kan lage solide, funksjonelle gjenstander',
      10: 'Arbeider med sjeldne materialer og avanserte teknikker',
      15: 'Dine verk er ettertraktet blant eliten',
      20: 'Regnet som en mester blant mestre i håndverkslaugene',
      25: 'Skaper nesten magiske gjenstander av uovertruffen kvalitet',
      30: 'Dine kreasjoner overgår selv de eldgamle mestrenes verk'
    }
  }
};

// Mapping for å håndtere konvertering fra gamle til nye ferdigheter
export const SKILL_LEGACY_MAP = {
  'Nærkamp': 'Kamp',
  'Skyteferdighet': 'Kamp'
};

export default function useSkills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hent ferdigheter fra databasen
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let isInitialFetch = true;

    async function fetchSkills() {
      try {
        // Først prøv å hente fra localStorage for umiddelbar visning
        const cachedSkills = localStorage.getItem(`skills_${user.id}`);
        if (cachedSkills && isMounted) {
          try {
            const parsedSkills = JSON.parse(cachedSkills);
            setSkills(parsedSkills);
          } catch (e) {
            console.error('Feil ved parsing av cachede ferdigheter', e);
          }
        }

        // Unngå å gjøre flere API-kall hvis komponenten ikke lenger er montert
        if (!isMounted) return;

        // Deretter hent fra databasen
        const { data, error } = await supabase
          .from('player_skills')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Feil ved henting av ferdigheter:', error);
          if (isMounted) {
            setError(error.message);
            setLoading(false);
          }
          return;
        }

        // Oppdater bare state hvis komponenten fortsatt er montert
        if (!isMounted) return;

        if (data && data.length > 0) {
          // Oppdater ferdigheter i staten og localStorage - men bare ved første lasting
          if (isInitialFetch) {
            try {
              localStorage.setItem(`skills_${user.id}`, JSON.stringify(data));
            } catch (e) {
              console.error('Feil ved lagring i localStorage:', e);
            }
            
            setSkills(data);
            isInitialFetch = false;
          }
        } else if (isInitialFetch) {
          // Ingen ferdigheter funnet, initialiser standardferdigheter
          // (men bare hvis dette er første lasting)
          await initializeDefaultSkills();
          isInitialFetch = false;
        }

        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Feil ved henting av ferdigheter:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    async function initializeDefaultSkills() {
      if (!isMounted) return;
      
      try {
        const defaultSkills = Object.keys(SKILL_DATA).map(skillName => ({
          user_id: user.id,
          skill_name: skillName,
          level: 1,
          progress: 0
        }));

        // Opprett standardferdigheter i databasen
        for (const skill of defaultSkills) {
          if (!isMounted) return;
          await supabase
            .from('player_skills')
            .insert(skill)
            .catch(err => console.error(`Feil ved opprettelse av ferdighet ${skill.skill_name}:`, err));
        }

        // Oppdater lokalt
        if (isMounted) {
          setSkills(defaultSkills);
          try {
            localStorage.setItem(`skills_${user.id}`, JSON.stringify(defaultSkills));
          } catch (e) {
            console.error('Feil ved lagring i localStorage:', e);
          }
        }
      } catch (err) {
        console.error('Feil ved initialisering av standardferdigheter:', err);
        if (isMounted) {
          setError(err.message);
        }
      }
    }

    fetchSkills();

    // Cleanup function for å forhindre state-oppdateringer etter at komponenten er unmounted
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Beregn nødvendig progresjon for et bestemt nivå
  const getRequiredProgressForLevel = (level) => {
    // Standardverdi for nivå 1-3: 5 poeng
    if (level <= 3) return 5;
    // Øk progresjonen for høyere nivåer
    if (level <= 5) return 7;
    if (level <= 7) return 10;
    if (level <= 9) return 15;
    if (level <= 15) return 20;
    if (level <= 20) return 25;
    if (level <= 25) return 30;
    return 40; // For nivå 25+
  };

  // Finn riktig rang og farge basert på nivå
  const getSkillRank = (level) => {
    // Finn det høyeste rangnivået som ikke er høyere enn det faktiske nivået
    const rankLevels = Object.keys(SKILL_RANKS).map(Number).sort((a, b) => b - a);
    for (const rankLevel of rankLevels) {
      if (level >= rankLevel) {
        return SKILL_RANKS[rankLevel];
      }
    }
    return SKILL_RANKS[1]; // Standard for nivå 1
  };

  // Få beskrivelse av hva ferdigheten kan gjøre på nåværende nivå
  const getSkillRankDescription = (skillName, level) => {
    const skill = SKILL_DATA[skillName];
    if (!skill || !skill.rankDescriptions) return null;
    
    // Finn den høyeste beskrivelsen som passer nivået
    const rankLevels = Object.keys(skill.rankDescriptions)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const rankLevel of rankLevels) {
      if (level >= rankLevel) {
        return skill.rankDescriptions[rankLevel];
      }
    }
    
    return null; // Ingen beskrivelse funnet for dette nivået
  };

  // Øk fremgang for en ferdighet - med bedre håndtering av uendelige looper
  const increaseSkillProgress = async (skillName, amount = 1) => {
    if (!user || !skills.length) return false;
    
    // Hindre kjøring hvis vi ikke har tilkobling til UI
    if (document.hidden) return false;
    
    // Sjekk om dette er en legacy-ferdighet som har blitt slått sammen
    if (SKILL_LEGACY_MAP[skillName]) {
      skillName = SKILL_LEGACY_MAP[skillName];
    }

    // Finn ferdigheten
    const skill = skills.find(s => s.skill_name === skillName);
    if (!skill) return false;

    // Sjekk om ferdigheten allerede er på maks nivå
    const maxLevel = SKILL_DATA[skillName]?.maxLevel || 30;
    if (skill.level >= maxLevel) {
      return { success: true, leveledUp: false, newLevel: skill.level, skillName };
    }

    // Beregn ny fremgang og nivå
    let newProgress = skill.progress + amount;
    let newLevel = skill.level;
    
    // Sjekk om nivået skal økes
    const maxProgress = getRequiredProgressForLevel(skill.level);
    if (newProgress >= maxProgress) {
      newLevel += 1;
      newProgress = 0;
    }

    try {
      // Oppdater i databasen
      const { error } = await supabase
        .from('player_skills')
        .update({
          level: newLevel,
          progress: newProgress,
          updated_at: new Date().toISOString()
        })
        .eq('id', skill.id);

      if (error) {
        console.error('Feil ved oppdatering av ferdighet:', error);
        return false;
      }

      // Lagre verdien vi vil oppdatere til
      const updatedSkill = { ...skill, level: newLevel, progress: newProgress };
      
      // For å unngå multiple oppdateringer, oppdater bare state én gang og lokalt
      // Vi bruker en referanse til det oppdaterte objektet og lagrer det i en lokal variabel først
      const updatedSkills = skills.map(s => 
        s.id === skill.id ? updatedSkill : s
      );
      
      // Oppdater state med den nye arrayen - bruk en enkel oppdatering uten referanse til den forrige staten
      setSkills(updatedSkills);
      
      // Oppdater localStorage med den nye arrayen uten å gjøre det i state-oppdateringsfunksjonen
      // Bruk requestAnimationFrame for å forhindre at denne koden kjører for ofte i render-syklusen
      requestAnimationFrame(() => {
        try {
          localStorage.setItem(`skills_${user.id}`, JSON.stringify(updatedSkills));
        } catch (err) {
          console.error('Feil ved lagring i localStorage:', err);
        }
      });
      
      return { 
        success: true, 
        leveledUp: newLevel > skill.level,
        newLevel,
        skillName 
      };
    } catch (err) {
      console.error('Feil ved oppdatering av ferdighet:', err);
      return false;
    }
  };

  // Hent en bestemt ferdighet
  const getSkill = (skillName) => {
    // Sjekk om dette er en legacy-ferdighet som har blitt slått sammen
    if (SKILL_LEGACY_MAP[skillName]) {
      skillName = SKILL_LEGACY_MAP[skillName];
    }
    return skills.find(s => s.skill_name === skillName) || null;
  };

  // Hent nivå for en bestemt ferdighet
  const getSkillLevel = (skillName) => {
    // Sjekk om dette er en legacy-ferdighet som har blitt slått sammen
    if (SKILL_LEGACY_MAP[skillName]) {
      skillName = SKILL_LEGACY_MAP[skillName];
    }
    const skill = getSkill(skillName);
    return skill ? skill.level : 0;
  };

  // Beregn ferdighetsbonuser fra utstyr
  const calculateSkillBonusesFromEquipment = (equipment) => {
    if (!equipment) return {};

    const bonuses = {};
    
    // Initialiser alle ferdigheter til 0
    Object.keys(SKILL_DATA).forEach(skill => {
      bonuses[skill] = 0;
    });

    // Gå gjennom alle utstyrte gjenstander
    Object.values(equipment).forEach(item => {
      if (item && item.attributes) {
        Object.entries(item.attributes).forEach(([attr, value]) => {
          // Sjekk om dette er en legacy-ferdighet som har blitt slått sammen
          if (SKILL_LEGACY_MAP[attr]) {
            const mappedSkill = SKILL_LEGACY_MAP[attr];
            bonuses[mappedSkill] = (bonuses[mappedSkill] || 0) + value;
          } else {
            const skillName = attr.charAt(0).toUpperCase() + attr.slice(1).toLowerCase();
            if (bonuses.hasOwnProperty(skillName)) {
              bonuses[skillName] += value;
            }
          }
        });
      }
    });

    return bonuses;
  };

  return {
    skills,
    loading,
    error,
    increaseSkillProgress,
    getSkill,
    getSkillLevel,
    getSkillRank,
    getSkillRankDescription,
    getRequiredProgressForLevel,
    calculateSkillBonusesFromEquipment,
    skillData: SKILL_DATA,
    SKILL_LEGACY_MAP
  };
} 