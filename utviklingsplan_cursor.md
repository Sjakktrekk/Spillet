
# Utviklingsplan for Cursor – Hybrid Fantasy Rollespill

Dette dokumentet er laget for å brukes direkte i Cursor som veikart for utvikling av det hybridbaserte fantasy-rollespillet for 7. trinn. Det er strukturert i moduler som kan bygges separat og kobles sammen via Supabase.

---

## ✅ Grunnoppsett

- [ ] Sett opp React-prosjekt med Vite + Tailwind
- [ ] Installer Supabase JS SDK
- [ ] Sett opp routing (React Router) med `pages/`-struktur
- [ ] Konfigurer Supabase-URL og nøkkel i `.env`

---

## 🔐 Modul 1: Innlogging og registrering

**Fil:** `LoginScreen.jsx`

- [ ] Registrering via brukernavn + passord (fake e-post til Supabase)
- [ ] Innlogging med samme brukernavn
- [ ] Lag `profiles`-tabell for synlig brukernavn
- [ ] Lagre `auth.user.id` i `profiles`

---

## 🧙 Modul 2: Karakteropprettelse

**Fil:** `CharacterCreation.jsx`, `supabase/characters.js`

- [ ] Velg rase, klasse, navn
- [ ] Lag `characters`-tabell (raser, klasse, ferdigheter, XP, coins, skillpoints)
- [ ] Koble karakter til `auth.user.id`
- [ ] Lagre karakter i Supabase
- [ ] Redirect til Home når karakter er laget

---

## 🗺 Modul 3: Kartvisning

**Fil:** `Home.jsx`, `components/Map/MapView.jsx`

- [ ] Interaktivt kartbilde (div/SVG)
- [ ] Klikkbare bypunkter (hotspots)
- [ ] Tooltip/info ved hover
- [ ] Åpne byskjerm eller reiseskjerm ved klikk

---

## 💬 Modul 4: Global chat

**Fil:** `components/Chat/ChatBox.jsx`

- [ ] Supabase realtime subscription til `chat_messages`
- [ ] Ny melding → insert til `chat_messages`
- [ ] Live oppdatering og auto-scroll

---

## 📜 Modul 5: Questsystem

**Filer:** `QuestList.jsx`, `QuestDetailModal.jsx`, `supabase/quests.js`

- [ ] `quests`-tabell (navn, beskrivelse, XP, coins, by, aktiv)
- [ ] `quest_submissions`-tabell (student_id, quest_id, status)
- [ ] Liste over aktive quests
- [ ] Modal med quest-detaljer
- [ ] Knapp: “Levert fysisk” → lagre i `quest_submissions`
- [ ] Admin-godkjenning i egen komponent

---

## 🧭 Modul 6: Reisesystem

**Fil:** `TravelModal.jsx`, `supabase/travel.js`

- [ ] `travel_log` og `travel_events`
- [ ] Reise koster coins → sjekk balanse
- [ ] Random event med 2 valg → vis valg
- [ ] Utfallet baseres på ferdighet + terning
- [ ] Skriv dagbok → lagres i `travel_journal`

---

## 🎒 Modul 7: Inventory og utstyr

**Fil:** `InventoryGrid.jsx`, `EquipmentSlots.jsx`

- [ ] `items`, `items_owned`-tabeller
- [ ] Equip i slot → gir bonus
- [ ] Bonus vises i karakterkort
- [ ] Loot og quest-reward gir items

---

## 🔧 Modul 8: Adminpanel

**Fil:** `pages/AdminPanel.jsx`

- [ ] Vis liste over quests, items, oppskrifter
- [ ] Legg til/rediger quests
- [ ] Admin-godkjenning av quests
- [ ] Gi XP/coins manuelt

---

## 🛡 Modul 9: Ferdighetspoeng og level-up

- [ ] XP gir nivåøkning
- [ ] Hvert nivå gir 1 skillpoint
- [ ] Velg ferdighet å øke (STR, KUN, SMI, INS)
- [ ] Lag `add_skill_point()` RPC

---

## 🎖 Modul 10: Titler og achievements

- [ ] `titles`, `achievements`, `unlocked_titles`-tabeller
- [ ] Velg aktiv tittel
- [ ] Vis tittel under navn
- [ ] Trigger achievements automatisk via hooks

---

## 🎨 Modul 11: Kosmetikk

- [ ] `cosmetics` og `cosmetics_owned`
- [ ] Bakgrunner, pets, mounts, farger
- [ ] Vis kosmetikk i karakterkort og reise

---

## 💡 Ekstra / fase 2

- [ ] Minigames
- [ ] Fraksjoner og bypolitiske endringer
- [ ] Dynamisk event-system
- [ ] Tidsbegrensede quests og spesialkampanjer

---

> Prosjektet bygges modul for modul. Hver del skal fungere isolert, og kobles sammen via databasen og delte hooks.
