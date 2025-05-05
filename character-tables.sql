-- Opprett og erstatt tabeller for spillet

-- player_locations tabell
DROP TABLE IF EXISTS public.player_locations CASCADE;
CREATE TABLE public.player_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  city_id INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX player_locations_user_id_idx 
ON public.player_locations (user_id);

-- characters tabell
DROP TABLE IF EXISTS public.characters CASCADE;
CREATE TABLE public.characters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  race_id INTEGER,
  class_id INTEGER,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 50,
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  energy INTEGER DEFAULT 100,
  max_energy INTEGER DEFAULT 100,
  strength INTEGER DEFAULT 5,
  knowledge INTEGER DEFAULT 5,
  agility INTEGER DEFAULT 5,
  magic INTEGER DEFAULT 5,
  skill_points INTEGER DEFAULT 0,
  avatar_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX characters_user_id_idx 
ON public.characters (user_id);

-- races tabell
DROP TABLE IF EXISTS public.races CASCADE;
CREATE TABLE public.races (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  strength_bonus INTEGER DEFAULT 0,
  knowledge_bonus INTEGER DEFAULT 0,
  agility_bonus INTEGER DEFAULT 0,
  magic_bonus INTEGER DEFAULT 0
);

-- Eksempeldata for raser
INSERT INTO public.races (name, description, strength_bonus, knowledge_bonus, agility_bonus, magic_bonus)
VALUES 
  ('Menneske', 'Mennesker er tilpasningsdyktige og ambisiøse. De er kjent for sin evne til å overleve og trives i ulike miljøer.', 1, 1, 1, 1),
  ('Alv', 'Alver er langtlevende skapninger med dyp tilknytning til magi og natur.', 0, 2, 1, 1),
  ('Dverg', 'Dverger er hardføre og sterke, med dyp kunnskap om håndverk og runer.', 2, 0, 0, 2),
  ('Ork', 'Orker er kraftige og utholdende krigere, med naturlig tilbøyelighet for kamp.', 3, 0, 1, 0);

-- classes tabell
DROP TABLE IF EXISTS public.classes CASCADE;
CREATE TABLE public.classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  starting_coins INTEGER DEFAULT 50
);

-- Eksempeldata for klasser
INSERT INTO public.classes (name, description, starting_coins)
VALUES 
  ('Eventyrer', 'En allsidig karakter som er god på litt av alt.', 100),
  ('Kriger', 'En mester i nærkamp og tunge våpen.', 75),
  ('Magiker', 'En mester i magiens kunster.', 50),
  ('Tyv', 'En smidig og listig karakter som er god på sniking og låsedirking.', 150);

-- cities tabell
DROP TABLE IF EXISTS public.cities CASCADE;
CREATE TABLE public.cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  race_name TEXT,
  population INTEGER,
  x_position FLOAT,
  y_position FLOAT
);

-- Eksempeldata for byer
INSERT INTO public.cities (id, name, description, race_name, population, x_position, y_position)
VALUES 
  (1, 'Nordhavn', 'Et handelssentrum ved kysten. Menneskene er kjent for sin tilpasningsdyktighet og nysgjerrighet. De søker kunnskap og makt.', 'Mennesker', 12500, 35, 25),
  (2, 'Eldoria', 'En skogskledd by skjult blant eldgamle trær. Alvene vokter naturens hemmeligheter og har en sterk tilknytning til magi.', 'Alver', 8200, 65, 45),
  (3, 'Tanak-dun', 'En fjellfestning gravd dypt i Bergrammene. Dvergene er mestere i smedkunst, gruvedrift og gamle runer.', 'Dverger', 7800, 20, 55),
  (4, 'Skyggeborg', 'En tidligere krigsby som nå forsøker å gjenoppbygge sitt rykte. Orkene var en gang under Skyggens kontroll, men søker nå en ny ære.', 'Orker', 9300, 50, 75); 