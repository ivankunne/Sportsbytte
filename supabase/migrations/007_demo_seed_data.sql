-- ============================================================
-- Sportsbyttet — Migration 007: Demo seed data
-- Adds 4 new clubs, 10 sellers and 20 listings with realistic
-- Norwegian content for demos and screenshots.
-- ============================================================

-- ── Step 1: Clubs ────────────────────────────────────────────

INSERT INTO clubs (name, slug, initials, color, secondary_color, description, members, active_listings, total_sold, rating, invite_token)
VALUES
  ('Asker Fotball',       'asker-fotball',       'AF', '#1a3a6e', '#f39c12',
   'Askers største fotballklubb med lag fra 6 år og opp til senior. Vi spiller på kunst- og naturgress, og er stolte av et inkluderende miljø.',
   287, 8, 34, 4.7, gen_random_uuid()),

  ('Molde Skiklubb',      'molde-skiklubb',      'MS', '#8b0000', '#c0392b',
   'Skiklubb med lange tradisjoner i Romsdalsdistriktet. Tilbyr alpint, langrenn og telemark for alle aldersgrupper.',
   194, 6, 28, 4.8, gen_random_uuid()),

  ('Stavanger Håndball',  'stavanger-handball',  'SH', '#4a235a', '#8e44ad',
   'En av Stavangers ledende håndballklubber. Damelag i 1. divisjon, herrelag i 2. divisjon, og aktive barne- og ungdomslag.',
   231, 7, 19, 4.6, gen_random_uuid()),

  ('Tromsø Friluftslag',  'tromso-friluftslag',  'TF', '#1a5276', '#2e86c1',
   'Friluftslivsklubb for alle som elsker naturen i nord. Aktiviteter inkluderer fjellvandring, klatring, ski og padling.',
   156, 5, 22, 4.9, gen_random_uuid())
ON CONFLICT (slug) DO NOTHING;

-- ── Step 2: Profiles (sellers) ───────────────────────────────

WITH af AS (SELECT id FROM clubs WHERE slug = 'asker-fotball'),
     ms AS (SELECT id FROM clubs WHERE slug = 'molde-skiklubb'),
     sh AS (SELECT id FROM clubs WHERE slug = 'stavanger-handball'),
     tf AS (SELECT id FROM clubs WHERE slug = 'tromso-friluftslag')
INSERT INTO profiles (name, slug, avatar, bio, club_id, total_sold)
SELECT * FROM (VALUES
  ('Lars Eriksen',    'lars-eriksen',    'LE', 'Fotballspiller i 17 år. Selger utstyr barna mine har vokst ut av.',               (SELECT id FROM af), 3),
  ('Marte Olsen',     'marte-olsen',     'MO', 'Trener for G14-laget. Alltid på jakt etter godt brukt utstyr til laget.',         (SELECT id FROM af), 1),
  ('Jonas Berg',      'jonas-berg',      'JB', 'Aktiv i Asker-fotballmiljøet siden 2005. Selger og kjøper jevnlig.',              (SELECT id FROM af), 5),
  ('Ingrid Holm',     'ingrid-holm',     'IH', 'Spiller på A-laget. Selger utstyr jeg ikke lenger bruker.',                       (SELECT id FROM ms), 2),
  ('Petter Strand',   'petter-strand',   'PS', 'Alpinentusiast. Oppgraderer utstyr hvert annet år og selger det gamle.',          (SELECT id FROM ms), 4),
  ('Silje Dahl',      'silje-dahl',      'SD', 'Langrennsløper og friluftsliv-elsker fra Romsdal.',                               (SELECT id FROM ms), 1),
  ('Ola Kristiansen', 'ola-kristiansen', 'OK', 'Håndballspiller siden barneskolen. Nå trener for U16 i Stavanger.',               (SELECT id FROM sh), 3),
  ('Hanne Bakke',     'hanne-bakke',     'HB', 'Keeper på damelagets 1. divisjonslag. Alltid på utkikk etter godt keeperutstyr.', (SELECT id FROM sh), 2),
  ('Tomas Nygaard',   'tomas-nygaard',   'TN', 'Friluftsliv og fjellvandring er lidenskap. Turer i Troms og Finnmark.',           (SELECT id FROM tf), 6),
  ('Else Vatne',      'else-vatne',      'EV', 'Klatrer og toppturer. Selger utstyr mellom sesonger for å finansiere neste.',     (SELECT id FROM tf), 2)
) AS v(name, slug, avatar, bio, club_id, total_sold)
ON CONFLICT (slug) DO NOTHING;

-- ── Step 3: Listings ─────────────────────────────────────────

WITH
  af  AS (SELECT id FROM clubs    WHERE slug = 'asker-fotball'),
  ms  AS (SELECT id FROM clubs    WHERE slug = 'molde-skiklubb'),
  sh  AS (SELECT id FROM clubs    WHERE slug = 'stavanger-handball'),
  tf  AS (SELECT id FROM clubs    WHERE slug = 'tromso-friluftslag'),
  le  AS (SELECT id FROM profiles WHERE slug = 'lars-eriksen'),
  mo  AS (SELECT id FROM profiles WHERE slug = 'marte-olsen'),
  jb  AS (SELECT id FROM profiles WHERE slug = 'jonas-berg'),
  ih  AS (SELECT id FROM profiles WHERE slug = 'ingrid-holm'),
  ps  AS (SELECT id FROM profiles WHERE slug = 'petter-strand'),
  sd  AS (SELECT id FROM profiles WHERE slug = 'silje-dahl'),
  ok  AS (SELECT id FROM profiles WHERE slug = 'ola-kristiansen'),
  hb  AS (SELECT id FROM profiles WHERE slug = 'hanne-bakke'),
  tn  AS (SELECT id FROM profiles WHERE slug = 'tomas-nygaard'),
  ev  AS (SELECT id FROM profiles WHERE slug = 'else-vatne')
INSERT INTO listings (
  title, description, price, category, condition,
  images, specs, club_id, seller_id,
  listing_type, members_only, is_sold, views, created_at
)
VALUES

  -- ── Asker Fotball ──────────────────────────────────────────

  (
    'Nike Dri-FIT treningssett str M',
    'Komplett treningssett med shorts og topp. Brukt én sesong, ingen hull eller flekker. Vaskes alltid etter bruk. Perfekt for trening eller kamp.',
    350,
    'Fotball',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
          'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80'],
    '{"brand": "Nike", "size": "M", "color": "Blå/hvit", "type": "Treningssett"}'::jsonb,
    (SELECT id FROM af), (SELECT id FROM le),
    'regular', false, false, 47,
    NOW() - INTERVAL '3 days'
  ),

  (
    'Adidas Copa fotballsko str 42 FG',
    'Klassiske Copa i skinn. Brukt én sesong på naturgress. Sålen er i god stand og læroverflaten er behandlet. Passer FG-underlag.',
    650,
    'Fotball',
    'Godt brukt',
    ARRAY['https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80'],
    '{"brand": "Adidas", "size": "42", "sole": "FG", "material": "Skinn"}'::jsonb,
    (SELECT id FROM af), (SELECT id FROM le),
    'regular', false, false, 63,
    NOW() - INTERVAL '7 days'
  ),

  (
    'Keeperhansker Reusch Attrakt G3 str 9',
    'Profesjonelle keeperhansker med G3-latex. Brukt en halv sesong i 3. divisjon. Latteksen har litt slitasje på parmene, men grepet er fortsatt fremragende.',
    280,
    'Fotball',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80'],
    '{"brand": "Reusch", "model": "Attrakt G3", "size": "9", "cut": "Negative"}'::jsonb,
    (SELECT id FROM af), (SELECT id FROM mo),
    'regular', false, false, 29,
    NOW() - INTERVAL '12 days'
  ),

  (
    'Fotballdrikter (10 stk) str 152–164',
    'Fullsett med 10 matchdrikter, blå/hvit. Perfekt for et G12- eller G14-lag. Alle driktene er i god stand — noen har navnelapper innvendig.',
    1200,
    'Fotball',
    'Godt brukt',
    ARRAY['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'],
    '{"quantity": 10, "sizes": "152-164", "color": "Blå/hvit", "type": "Kamplegg"}'::jsonb,
    (SELECT id FROM af), (SELECT id FROM jb),
    'regular', false, false, 81,
    NOW() - INTERVAL '2 days'
  ),

  (
    'Nike Mercurial Vapor str 38 AG',
    'Lett og rask fotballsko for kunstgress. Datteren har vokst ut av dem. Brukt én sesong, veldig lite synlig slitasje på overdelen.',
    420,
    'Fotball',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80'],
    '{"brand": "Nike", "model": "Mercurial Vapor", "size": "38", "sole": "AG"}'::jsonb,
    (SELECT id FROM af), (SELECT id FROM jb),
    'regular', false, false, 38,
    NOW() - INTERVAL '18 days'
  ),

  -- ── Molde Skiklubb ─────────────────────────────────────────

  (
    'Atomic Redster ski 170 cm med Marker-binding',
    'Rask racerski for erfarne utøvere. Brukt 2 sesonger i alpinklubbrenn. Kanter slipt sist sesong, sklien er i god stand. Binding medfølger og er nylig justert.',
    1800,
    'Alpint',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1519466465910-56d78b5e6bb4?w=800&q=80',
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80'],
    '{"brand": "Atomic", "model": "Redster", "length": "170cm", "binding": "Marker"}'::jsonb,
    (SELECT id FROM ms), (SELECT id FROM ps),
    'regular', false, false, 55,
    NOW() - INTERVAL '5 days'
  ),

  (
    'Head hjelm og kjelke barnepakke',
    'Komplett pakke for barn 6–10 år: Head hjelm str S og kjelke som passer til slalåm og aking. Hjelmen er uten fall, kjelken har noen kosmetiske riper.',
    400,
    'Alpint',
    'Godt brukt',
    ARRAY['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80'],
    '{"helmet_brand": "Head", "helmet_size": "S (52-56cm)", "type": "Barnepakke"}'::jsonb,
    (SELECT id FROM ms), (SELECT id FROM ih),
    'regular', false, false, 22,
    NOW() - INTERVAL '20 days'
  ),

  (
    'Langrennsdress herre str L — Som ny',
    'Langrennsdress fra Swix i klasse-farger. Brukt kun i 2 renn. Uten flekker eller skader. Selges da jeg gikk opp en størrelse.',
    350,
    'Langrenn',
    'Som ny',
    ARRAY['https://images.unsplash.com/photo-1517166665-b0fc07a2f1d3?w=800&q=80'],
    '{"brand": "Swix", "size": "L", "gender": "Herre", "type": "Konkurransedress"}'::jsonb,
    (SELECT id FROM ms), (SELECT id FROM sd),
    'regular', false, false, 41,
    NOW() - INTERVAL '9 days'
  ),

  (
    'Bergans Hemsedal skijakke str M',
    'Varm og vindtett skijakke fra Bergans. Brukt 2 sesonger. Gore-Tex membran fungerer utmerket, tapen er hel. Lite synlig slitasje.',
    890,
    'Alpint',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1519466465910-56d78b5e6bb4?w=800&q=80'],
    '{"brand": "Bergans", "model": "Hemsedal", "size": "M", "material": "Gore-Tex"}'::jsonb,
    (SELECT id FROM ms), (SELECT id FROM ps),
    'regular', false, false, 67,
    NOW() - INTERVAL '14 days'
  ),

  (
    'Fischer XC-skis langrenn 195 cm + støvler 43',
    'Klassiskski med integrert bindingssystem. Inklusive Fischer støvler str 43. Godt smurt og vedlikeholdt gjennom 3 sesonger.',
    750,
    'Langrenn',
    'Godt brukt',
    ARRAY['https://images.unsplash.com/photo-1517166665-b0fc07a2f1d3?w=800&q=80'],
    '{"brand": "Fischer", "length": "195cm", "boots_size": "43", "style": "Klassisk"}'::jsonb,
    (SELECT id FROM ms), (SELECT id FROM ih),
    'regular', false, false, 33,
    NOW() - INTERVAL '25 days'
  ),

  -- ── Stavanger Håndball ─────────────────────────────────────

  (
    'SELECT håndball str 2 (dame) — Som ny',
    'Offisiell matchball i strl 2. Brukt kun i noen treninger, ingen synlige merker. Passer for damer og ungdomsspillere. Luftet og klar til bruk.',
    120,
    'Håndball',
    'Som ny',
    ARRAY['https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&q=80'],
    '{"brand": "SELECT", "size": "2", "gender": "Dame", "type": "Matchball"}'::jsonb,
    (SELECT id FROM sh), (SELECT id FROM ok),
    'regular', false, false, 18,
    NOW() - INTERVAL '6 days'
  ),

  (
    'Keeperhansker str 8 — Pent brukt',
    'Håndballhansker med god demping og grep. Brukt én sesong. Litt slitasje i fingrene, men støtdempingen er hel. Leveres med bag.',
    180,
    'Håndball',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&q=80'],
    '{"size": "8", "type": "Keeperhansker", "condition_detail": "Slitasje i fingre"}'::jsonb,
    (SELECT id FROM sh), (SELECT id FROM hb),
    'regular', false, false, 24,
    NOW() - INTERVAL '10 days'
  ),

  (
    'Hummel Aerocharge håndballsko str 41',
    'Lette og responsive håndballsko fra Hummel. Brukt én sesong i 1. divisjon. Sålen er lite slitt, overdelen er uten skader.',
    480,
    'Håndball',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'],
    '{"brand": "Hummel", "model": "Aerocharge", "size": "41", "gender": "Dame"}'::jsonb,
    (SELECT id FROM sh), (SELECT id FROM hb),
    'regular', false, false, 52,
    NOW() - INTERVAL '4 days'
  ),

  (
    'Trenerbag med utstyr — 2 baller, kjegler, bipper',
    'Komplett trenerbag med innhold: 2 SELECT håndballballer (str 3), 12 kjegler, 10 bipper og en fløyte. Alt du trenger til en treningsøkt.',
    650,
    'Håndball',
    'Godt brukt',
    ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
          'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&q=80'],
    '{"includes": "2 baller, 12 kjegler, 10 bipper, fløyte", "bag_brand": "SELECT"}'::jsonb,
    (SELECT id FROM sh), (SELECT id FROM ok),
    'regular', false, false, 76,
    NOW() - INTERVAL '1 days'
  ),

  -- ── Tromsø Friluftslag ─────────────────────────────────────

  (
    'Osprey Atmos 65 tursekk — Pent brukt',
    'Ergonomisk og komfortabel tursekk med justerbart bæresystem. Brukt på 3 lange turer. Alle lommer og stenger fungerer. Inkludert regntrekk.',
    1400,
    'Friluftsliv',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=800&q=80',
          'https://images.unsplash.com/photo-1544015501-7dbf9b5b2fde?w=800&q=80'],
    '{"brand": "Osprey", "model": "Atmos 65", "volume": "65L", "raincover": true}'::jsonb,
    (SELECT id FROM tf), (SELECT id FROM tn),
    'regular', false, false, 79,
    NOW() - INTERVAL '2 days'
  ),

  (
    'La Sportiva Boulder X klatresko str 43',
    'Allround klatresko som passer buldring og klatring i vegg. Brukt én sesong. Gummien er hel og klistereffekten er intakt. Passer bred fot.',
    550,
    'Friluftsliv',
    'Godt brukt',
    ARRAY['https://images.unsplash.com/photo-1544015501-7dbf9b5b2fde?w=800&q=80'],
    '{"brand": "La Sportiva", "model": "Boulder X", "size": "43", "type": "Allround"}'::jsonb,
    (SELECT id FROM tf), (SELECT id FROM ev),
    'regular', false, false, 44,
    NOW() - INTERVAL '16 days'
  ),

  (
    'Black Diamond Momentum klatresele str M — Som ny',
    'Komfortabel og justerbar klatresele. Brukt kun inne på klatresenteret noen ganger. Alle bøyler og låser er uten skader. Passer hofte 71–89 cm.',
    380,
    'Friluftsliv',
    'Som ny',
    ARRAY['https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=800&q=80'],
    '{"brand": "Black Diamond", "model": "Momentum", "size": "M", "hip_range": "71-89cm"}'::jsonb,
    (SELECT id FROM tf), (SELECT id FROM ev),
    'regular', false, false, 31,
    NOW() - INTERVAL '8 days'
  ),

  (
    'Fjällräven Kånken tursekk 16L',
    'Klassisk Kånken i vinrød. Passer dagsturer og skole. God stand, alle glidelåser fungerer. Noen kosmetiske flekker på bunnen.',
    600,
    'Friluftsliv',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=800&q=80'],
    '{"brand": "Fjällräven", "model": "Kånken", "volume": "16L", "color": "Vinrød"}'::jsonb,
    (SELECT id FROM tf), (SELECT id FROM tn),
    'regular', false, false, 57,
    NOW() - INTERVAL '22 days'
  ),

  (
    'Primus EtaExpress stormkjøkken — komplett sett',
    'Kompakt og effektivt stormkjøkken fra Primus. Inkl. gasspatron, titivere og bærepose. Brukt på 5 turer. Fungerer perfekt.',
    450,
    'Friluftsliv',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1544015501-7dbf9b5b2fde?w=800&q=80'],
    '{"brand": "Primus", "model": "EtaExpress", "includes": "Kjøkken, titivere, pose", "gas_included": true}'::jsonb,
    (SELECT id FROM tf), (SELECT id FROM tn),
    'regular', false, false, 36,
    NOW() - INTERVAL '28 days'
  ),

  (
    'Salomon XA Pro 3D løpesko str 44 — Pent brukt',
    'Allterreng løpesko med godt grep på teknisk underlag. Perfekt for terrengløp og trailsommer. Brukt én sesong på terreng i Troms.',
    580,
    'Løping',
    'Pent brukt',
    ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'],
    '{"brand": "Salomon", "model": "XA Pro 3D", "size": "44", "type": "Trail"}'::jsonb,
    (SELECT id FROM tf), (SELECT id FROM tn),
    'regular', false, false, 49,
    NOW() - INTERVAL '11 days'
  )

ON CONFLICT DO NOTHING;

-- ── Step 4: Refresh active_listings counts ────────────────────

UPDATE clubs
SET active_listings = (
  SELECT COUNT(*)
  FROM listings
  WHERE listings.club_id = clubs.id
    AND is_sold = false
);
