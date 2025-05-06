-- SQL-skript for å legge til grunnleggende gjenstander i items-tabellen
-- Kjør denne SQL-koden i Supabase SQL Editor

-- Hodeplagg (head slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Lærkappe', 'En enkel hette av lær som beskytter mot regn.', 'armor', 'head', 'common', 2, 0, 15),
('Jernhjelm', 'En solid jernhjelm som gir god beskyttelse.', 'armor', 'head', 'uncommon', 5, 1, 40),
('Runemesterens Krone', 'En mystisk krone dekorert med gamle runer som gir bæreren økt utholdenhet.', 'armor', 'head', 'rare', 8, 3, 120);

-- Brystplate (chest slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Stofftunika', 'En enkel tunika av grovt stoff.', 'armor', 'chest', 'common', 3, 0, 20),
('Forsterket Lærjakke', 'En jakke av herdet lær med metallforsterkninger.', 'armor', 'chest', 'uncommon', 7, 2, 65),
('Brynje av Drakeskjell', 'En sjelden brynje laget av skjell fra en fallen drage, ekstremt solid og lett.', 'armor', 'chest', 'rare', 12, 4, 180);

-- Bukser (pants slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Tøybukser', 'Enkle bukser av grovvevd stoff.', 'armor', 'pants', 'common', 2, 0, 12),
('Forsterkede Lærbukser', 'Bukser laget av herdet lær med ekstra lag på knærne.', 'armor', 'pants', 'uncommon', 5, 1, 45),
('Legendevevers Silkebukser', 'Bukser vevd av magiske silketråder som styrker bærerens vitalitet.', 'armor', 'pants', 'rare', 8, 3, 130);

-- Støvler (boots slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Lærstøvler', 'Enkle støvler av grovt lær.', 'armor', 'boots', 'common', 2, 0, 18),
('Jernbeslåtte Støvler', 'Støvler forsterket med jernplater som gir ekstra beskyttelse.', 'armor', 'boots', 'uncommon', 4, 1, 50),
('Vindvandrerens Støvler', 'Lette, men utrolig robuste støvler som sies å ha blitt laget av skogsalver.', 'armor', 'boots', 'rare', 7, 3, 145);

-- Hansker (gloves slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Stoffhansker', 'Enkle hansker av grovvevd stoff.', 'armor', 'gloves', 'common', 1, 0, 10),
('Lærhansker', 'Robuste hansker laget av herdet lær.', 'armor', 'gloves', 'uncommon', 3, 1, 35),
('Krigerens Jernhansker', 'Hansker av fint smidd jern som gir utmerket beskyttelse.', 'armor', 'gloves', 'rare', 6, 2, 115);

-- Armringer (bracers slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Lærbindinger', 'Enkle armbeskyttere av lær.', 'armor', 'bracers', 'common', 1, 0, 12),
('Jernarmringer', 'Armringer av solid jern som beskytter underarmene.', 'armor', 'bracers', 'uncommon', 3, 1, 40),
('Vokterens Armbeskyttere', 'Legendaryiske armbeskyttere med innlagte beskyttelsessymboler.', 'armor', 'bracers', 'rare', 6, 3, 125);

-- Skulderbeskyttere (shoulder slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Lærskulderbeskyttere', 'Enkle skulderbeskyttere av herdet lær.', 'armor', 'shoulder', 'common', 2, 0, 15),
('Jernbelagte Skulderbeskyttere', 'Skulderbeskyttere av lær med jernforsterkninger.', 'armor', 'shoulder', 'uncommon', 4, 1, 45),
('Berserkerskuldrer', 'Massive skulderbeskyttere dekorert med mystiske runer som gir styrke.', 'armor', 'shoulder', 'rare', 7, 3, 135);

-- Belter (belt slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Stoffbelte', 'Et enkelt belte av vevd stoff.', 'armor', 'belt', 'common', 1, 0, 8),
('Lærbelte med Spenner', 'Et solid lærbelte med metallspenner.', 'armor', 'belt', 'uncommon', 2, 1, 30),
('Kraftens Lenke', 'Et belte laget av sjeldne metaller som styrker bærerens vitalitet.', 'armor', 'belt', 'rare', 4, 3, 100);

-- Våpen (mainHand slot)
INSERT INTO items (name, description, type, slot, rarity, damage, vitality_bonus, value)
VALUES
('Tresverd', 'Et enkelt treningsvåpen laget av hardved.', 'weapon', 'mainHand', 'common', 3, 0, 15),
('Jernsverd', 'Et solid sverd av smidd jern.', 'weapon', 'mainHand', 'uncommon', 6, 0, 50),
('Flammekutt', 'Et legendarisk sverd som gløder med mystisk flammeenergi.', 'weapon', 'mainHand', 'rare', 10, 2, 160);

-- Buer (mainHand slot for ranged)
INSERT INTO items (name, description, type, slot, rarity, damage, vitality_bonus, value)
VALUES
('Treningsbue', 'En enkel bue laget for nybegynnere.', 'weapon', 'mainHand', 'common', 2, 0, 18),
('Sammensatt Bue', 'En kraftig bue laget av forskjellige tresorter.', 'weapon', 'mainHand', 'uncommon', 5, 0, 55),
('Vindpiskeren', 'En sjelden bue smidd med magiske vinder, pilene flyr raskere.', 'weapon', 'mainHand', 'rare', 9, 1, 165);

-- Skjold (offHand slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Treskjold', 'Et enkelt skjold av tre forsterket med lær.', 'armor', 'offHand', 'common', 3, 0, 20),
('Jernskjold', 'Et solid skjold laget av jernplater.', 'armor', 'offHand', 'uncommon', 6, 1, 60),
('Tårnskjold', 'Et massivt skjold som gir overlegen beskyttelse.', 'armor', 'offHand', 'rare', 10, 2, 150);

-- Ringer (ring slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Kobbering', 'En enkel ring av kobber uten spesielle egenskaper.', 'accessory', 'ring', 'common', 0, 0, 10),
('Sølvring', 'En vakkert utformet ring av rent sølv.', 'accessory', 'ring', 'uncommon', 0, 2, 45),
('Vitalitetsring', 'En sjelden ring som styrker bærerens livskraft betraktelig.', 'accessory', 'ring', 'rare', 0, 5, 120);

-- Amuletter (amulet slot)
INSERT INTO items (name, description, type, slot, rarity, defense, vitality_bonus, value)
VALUES
('Treanheng', 'Et enkelt anheng utskåret av tre.', 'accessory', 'amulet', 'common', 0, 1, 12),
('Beskyttelsesamulett', 'En amulett med enkle beskyttelsesruner.', 'accessory', 'amulet', 'uncommon', 1, 3, 55),
('Vokterens Øye', 'En mystisk amulett som sies å våke over bæreren og gi økt vitalitet.', 'accessory', 'amulet', 'rare', 2, 6, 140);

-- Tohånds våpen (twoHand slot)
INSERT INTO items (name, description, type, slot, rarity, damage, vitality_bonus, value)
VALUES
('Treningsøks', 'En stor trøksøks laget for å øve på tohånds teknikker.', 'weapon', 'twoHand', 'common', 5, 0, 25),
('Stridshammer', 'En kraftig tohånds hammer som kan slå gjennom rustninger.', 'weapon', 'twoHand', 'uncommon', 9, 1, 70),
('Frostbringer', 'Et legendarisk tohånds sverd som sender frost gjennom motstanderne.', 'weapon', 'twoHand', 'rare', 15, 3, 195);

-- Materialer (misc)
INSERT INTO items (name, description, type, rarity, value)
VALUES
('Jernmalm', 'Rå jernmalm som kan smeltes til barrer.', 'material', 'common', 5),
('Sølvmalm', 'Sjelden sølvmalm av høy kvalitet.', 'material', 'uncommon', 15),
('Drakeskjell', 'Et sjeldent skjell fra en drage, brukes i eksotiske rustninger.', 'material', 'rare', 45);

-- Forbruksvarer
INSERT INTO items (name, description, type, rarity, effect, effect_value, value)
VALUES
('Liten Helsepotion', 'En enkel brygg som gjenoppretter litt helse.', 'consumable', 'common', 'restore_health', 20, 10),
('Medium Helsepotion', 'En potent brygg som gjenoppretter god helse.', 'consumable', 'uncommon', 'restore_health', 50, 25),
('Stor Helsepotion', 'En sjelden og kraftig helbredende mikstur.', 'consumable', 'rare', 'restore_health', 100, 60);

-- Matgjenstander
INSERT INTO items (name, description, type, rarity, effect, effect_value, value)
VALUES
('Brød', 'Et enkelt brød som stilner sulten og gir litt energi.', 'food', 'common', 'restore_energy', 10, 5),
('Kjøttgryte', 'En næringsrik gryte som gir god energi.', 'food', 'uncommon', 'restore_energy', 25, 15),
('Kongelig Festmåltid', 'Et sjeldent måltid verdig en konge, gir masse energi.', 'food', 'rare', 'restore_energy', 50, 35); 