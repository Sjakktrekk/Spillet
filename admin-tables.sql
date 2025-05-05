-- Tabeller for adminsiden

-- quests tabell
DROP TABLE IF EXISTS public.quests CASCADE;
CREATE TABLE public.quests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  coins_reward INTEGER NOT NULL,
  city_id INTEGER REFERENCES public.cities(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- quest_submissions tabell
DROP TABLE IF EXISTS public.quest_submissions CASCADE;
CREATE TABLE public.quest_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quest_id UUID REFERENCES public.quests(id),
  character_id UUID REFERENCES public.characters(id),
  status TEXT NOT NULL DEFAULT 'pending',
  xp_reward INTEGER NOT NULL,
  coins_reward INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- items tabell
DROP TABLE IF EXISTS public.items CASCADE;
CREATE TABLE public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  strength_bonus INTEGER DEFAULT 0,
  intelligence_bonus INTEGER DEFAULT 0,
  dexterity_bonus INTEGER DEFAULT 0,
  health_bonus INTEGER DEFAULT 0,
  mana_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- character_items tabell (mange-til-mange relasjon mellom characters og items)
DROP TABLE IF EXISTS public.character_items CASCADE;
CREATE TABLE public.character_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  character_id UUID REFERENCES public.characters(id),
  item_id UUID REFERENCES public.items(id),
  equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS-policyer for adminsiden
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_items ENABLE ROW LEVEL SECURITY;

-- Policy for quests (bare admin kan se og redigere)
CREATE POLICY "Admin kan se og redigere quests" ON public.quests
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Policy for quest_submissions (admin kan se og redigere, brukere kan bare se sine egne)
CREATE POLICY "Admin kan se og redigere alle innleveringer" ON public.quest_submissions
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Brukere kan se sine egne innleveringer" ON public.quest_submissions
  FOR SELECT
  TO authenticated
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Policy for items (admin kan se og redigere, brukere kan bare se)
CREATE POLICY "Admin kan se og redigere items" ON public.items
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Brukere kan se items" ON public.items
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for character_items (admin kan se og redigere, brukere kan bare se sine egne)
CREATE POLICY "Admin kan se og redigere alle karakter-items" ON public.character_items
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Brukere kan se sine egne karakter-items" ON public.character_items
  FOR SELECT
  TO authenticated
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Trigger for å oppdatere updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON public.quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quest_submissions_updated_at
  BEFORE UPDATE ON public.quest_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 