# Dokumentasjon: Reisehendelsessystem

## Oversikt
Reisehendelsessystemet lar spillere oppleve tilfeldige hendelser når de reiser mellom byer. Hver hendelse har flere valgalternativer, og utfallet avhenger av spillerens ferdigheter og terningkast.

## Databasestruktur
Reisehendelser lagres i tabellen `travel_events` med følgende struktur:

| Felt | Type | Beskrivelse |
|------|------|-------------|
| id | SERIAL PRIMARY KEY | Unik ID for hendelsen |
| title | TEXT | Tittel på hendelsen |
| description | TEXT | Beskrivelse av hendelsen |
| choices | JSONB | Array med valgalternativer |
| type | TEXT | Type hendelse (travel, exploration, city, dungeon) |
| difficulty | INTEGER | Vanskelighetsgrad for hendelsen (1-10) |
| created_at | TIMESTAMP | Tidspunkt for oppretting av hendelsen |
| updated_at | TIMESTAMP | Tidspunkt for siste oppdatering |

## Løsning på tidligere problemer

### Problem 1: Manglende tabellstruktur
**Løsning:** Kjør SQL-skriptet `travel_events_table.sql` for å opprette tabellen.

### Problem 2: Manglende felt i tabellen
**Løsning:** Kjør SQL-skriptet `update_travel_events_table.sql` for å legge til feltene `type` og `difficulty` i tabellen.

### Problem 3: Mangelfull datamodell
**Løsning:** `TravelEventsAdmin.jsx` er oppdatert til å inkludere og håndtere feltene `type` og `difficulty` korrekt, med validering og UI-elementer.

## Sannsynlighetsmodell for suksess

I `travel.js` er det implementert en sannsynlighetsmodell for å avgjøre om en handling lykkes:

```javascript
export const rollDice = (baseSkill, difficulty) => {
  // Beregn basissjanse: 50%
  let successChance = 50;
  
  // Legg til 2% per ferdighetsnivå
  successChance += baseSkill * 2;
  
  // Trekk fra 5% per vanskelighetsgrad over 5
  const difficultyModifier = difficulty > 5 ? (difficulty - 5) * 5 : 0;
  successChance -= difficultyModifier;
  
  // Sørg for at sjansen alltid er mellom 5% og 95%
  successChance = Math.min(95, Math.max(5, successChance));
  
  // Sjekk om handlingen lykkes
  const roll = Math.random() * 100;
  return roll < successChance;
};
```

Dette gir en balansert spillmekanikk der:
1. Basissjansen er 50%
2. Hver ferdighetsnivå øker sjansen med 2%
3. Høyere vanskelighetsgrad (over 5) reduserer sjansen med 5% per nivå
4. Sjansen er alltid mellom 5% og 95%

## Testing
For å verifisere at alt fungerer korrekt, kan du kjøre test-skriptet `test_travel_events.js` som sjekker tabellstrukturen og mulighet for å lagre hendelser med alle nødvendige felt.

## Flyt for reisehendelser

1. Spiller starter en reise mellom to byer
2. Systemet genererer en tilfeldig hendelse med `getRandomTravelEvent()`
3. Hendelsen presenteres med valgalternativer
4. Når spilleren velger et alternativ, rulles terninger basert på spillerens ferdigheter og vanskelighetsgraden
5. Resultatet (suksess eller feil) vises til spilleren med tilhørende belønning eller straff
6. Reisen logges i `travel_log`-tabellen for historikk

## Administrasjon av reisehendelser
Admin-siden lar administratorer:

1. Se alle eksisterende reisehendelser
2. Opprette nye hendelser
3. Redigere eksisterende hendelser
4. Slette hendelser
5. Importere standardhendelser

## Feilsøking
Hvis du møter problemer med reisehendelsessystemet:

1. Sjekk at `travel_events`-tabellen finnes i databasen
2. Verifiser at tabellen har alle nødvendige felt (`type` og `difficulty`)
3. Sjekk at data lagres og hentes korrekt med console.log
4. Bruk test-skriptet for å validere tabellstrukturen 