-- Migrasjonsfil for å legge til skill rewards i quests-tabellen

-- Legg til kolonne for ferdighetbelønning i quests-tabellen
ALTER TABLE public.quests
ADD COLUMN IF NOT EXISTS reward_skill JSONB DEFAULT NULL;

-- Kommentar for kolonnen
COMMENT ON COLUMN public.quests.reward_skill IS 'JSON-objekt med ferdighetsnavn og mengde fremgang som belønning: {"skill_name": "Kamp", "amount": 5}'; 