import { createContext, useContext, useState } from 'react';

// Sitater for hvert nivå
const levelQuotes = [
  "", // Nivå 0 (eksisterer ikke)
  "Selv den lengste reise begynner med et skritt.", // Nivå 1
  "Styrke kommer ikke fra hva du kan gjøre, men ved å overvinne det du trodde du ikke kunne klare.", // Nivå 2
  "I møte med motgang blir den sanne helt avslørt.", // Nivå 3
  "Kunnskap er et kraftig våpen. Bruk det klokt.", // Nivå 4
  "Vær tålmodig. Store bedrifter krever tid.", // Nivå 5
  "Selv det mørkeste rom har et lite glimt av lys.", // Nivå 6
  "De største skattene ligger der ingen har våget å lete.", // Nivå 7
  "Visdom er å lære av fortiden, men å leve i nåtiden.", // Nivå 8
  "Den som kjenner andre er klok; den som kjenner seg selv er opplyst.", // Nivå 9
  "Det krever styrke å følge hjertet ditt, men det krever mot å følge skjebnen din.", // Nivå 10
  "Sann makt kommer ikke fra å beseire andre, men fra å beseire seg selv.", // Nivå 11
  "Livet er ikke målt i antall pust du tar, men i øyeblikkene som tar pusten fra deg.", // Nivå 12
  "En sann kriger kjemper ikke fordi han hater det som er foran ham, men fordi han elsker det som er bak ham.", // Nivå 13
  "I enden av natten finnes alltid et nytt daggry.", // Nivå 14
  "Legender blir ikke født, de blir smidd gjennom prøvelser og utholdenhet.", // Nivå 15
  "Mot er å handle på tross av frykt, ikke fravær av den.", // Nivå 16
  "Det er ingen tilfeldigheter i en heltens reise.", // Nivå 17
  "Skjebnen favoriserer de modige, men belønner de forberedte.", // Nivå 18
  "En heltemodig ånd inspirerer andre til storhet.", // Nivå 19
  "Når du når toppen av fjellet, fortsetter du å klatre.", // Nivå 20
];

// Definer låsbare funksjoner og gjenstander for hvert nivå med fokus på ferdigheter
const levelUnlocks = {
  2: { text: "Nytt oppdragsområde: Skogens dybder" },
  3: { text: "Nye dialogalternativer basert på Overtalelse-ferdigheten" },
  4: { text: "Mulighet for å finne sjeldne ressurser med Utforskning-ferdigheten" },
  5: { text: "Ny kampferdighet: Kombinasjonsangrep (krever Nærkamp nivå 3)" },
  6: { text: "Tilgang til spesialbutikker basert på Håndverk-ferdigheten" },
  7: { text: "Nytt reisemål: Fjellpasset (krever Utholdenhet nivå 2)" },
  8: { text: "Reduserte energikostnader ved reising (basert på Utholdenhet)" },
  10: { text: "Spesial-teknikker for alle ferdigheter på nivå 5+" },
  12: { text: "Tilgang til unike dialogalternativer med Kunnskap nivå 5" },
  15: { text: "Avanserte magiske formler (krever Magi nivå 8)" },
  18: { text: "Tilgang til ekstremt sjeldne gjenstander med Skyteferdighet nivå 10" },
  20: { text: "Mesterferdighetene låses opp (nivå 10+ i alle ferdigheter)" },
};

const LevelUpContext = createContext();

export const LevelUpProvider = ({ children }) => {
  const [showModal, setShowModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);

  const showLevelUpModal = (characterData) => {
    setLevelUpData(characterData);
    setShowModal(true);
  };

  const hideLevelUpModal = () => {
    setShowModal(false);
    setLevelUpData(null);
  };

  // Henter sitat for nivået
  const getQuoteForLevel = (level) => {
    return levelQuotes[level] || "En ny utfordring venter...";
  };

  // Henter det som låses opp for nivået
  const getUnlocksForLevel = (level) => {
    return levelUnlocks[level] || null;
  };

  return (
    <LevelUpContext.Provider
      value={{
        showModal,
        levelUpData,
        showLevelUpModal,
        hideLevelUpModal,
        getQuoteForLevel,
        getUnlocksForLevel
      }}
    >
      {children}
    </LevelUpContext.Provider>
  );
};

export default function useLevelUpModal() {
  return useContext(LevelUpContext);
} 