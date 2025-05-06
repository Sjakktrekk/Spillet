-- Oppretter travel_events-tabell for lagring av reisehendelser
CREATE TABLE IF NOT EXISTS travel_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks for raskere søk
CREATE INDEX IF NOT EXISTS idx_travel_events_id ON travel_events(id);

-- Trigger for å oppdatere updated_at
CREATE OR REPLACE FUNCTION update_travel_events_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_travel_events_timestamp
BEFORE UPDATE ON travel_events
FOR EACH ROW
EXECUTE FUNCTION update_travel_events_modified_column();

-- Kommentar
COMMENT ON TABLE travel_events IS 'Reisehendelser som kan skje under reise mellom byer'; 