-- Oppdaterer travel_events-tabellen med manglende felt
ALTER TABLE travel_events 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'travel',
ADD COLUMN IF NOT EXISTS difficulty INTEGER NOT NULL DEFAULT 1;

-- Kommentar til feltene
COMMENT ON COLUMN travel_events.type IS 'Type hendelse (travel, exploration, city, dungeon)';
COMMENT ON COLUMN travel_events.difficulty IS 'Vanskelighetsgrad for hendelsen (1-10)';

-- Logger oppdateringen
DO $$
BEGIN
  RAISE NOTICE 'Travel_events-tabellen er oppdatert med type og difficulty felt';
END $$; 