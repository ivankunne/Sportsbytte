-- ============================================================
-- Sportsbyttet — Migration 010: Seed club announcements
-- Adds 1-2 realistic Norwegian announcements per club.
-- ============================================================

WITH
  af AS (SELECT id FROM clubs WHERE slug LIKE 'asker-fotball%'),
  ms AS (SELECT id FROM clubs WHERE slug LIKE 'molde-skiklubb%'),
  sh AS (SELECT id FROM clubs WHERE slug LIKE 'stavanger-handball%'),
  tf AS (SELECT id FROM clubs WHERE slug LIKE 'tromso-friluftslag%')
INSERT INTO announcements (club_id, title, body, type, author_name, created_at)
VALUES

  -- ── Asker Fotball ──────────────────────────────────────────

  (
    (SELECT id FROM af),
    'Sesongstart 2024 — viktig info til alle lag',
    'Oppstart for alle lag er satt til lørdag 6. april. Treningsplanen for vår/sommer legges ut på lagsidene i løpet av uken. Husk å registrere deg i Spond innen fredag. Kontakt leder Lars Eriksen hvis du har spørsmål om lagtilhørighet eller treningsavgift.',
    'announcement',
    'Lars Eriksen',
    NOW() - INTERVAL '3 days'
  ),

  (
    (SELECT id FROM af),
    'Utstyrsbytte — ledig utstyr til G12 og G14',
    'Vi samler inn utstyr barna har vokst ut av! Ta med ubrukte drakter, sko og benskinner til neste trening så legger vi dem ut på Sportsbyttet. Marte Olsen koordinerer innsamlingen. Perfekt mulighet til å skaffe rimeligere utstyr til neste sesong.',
    'gear',
    'Marte Olsen',
    NOW() - INTERVAL '1 week'
  ),

  -- ── Molde Skiklubb ─────────────────────────────────────────

  (
    (SELECT id FROM ms),
    'Flotte skiforhold i Romsdalen — kom deg ut!',
    'Snøen har endelig lagt seg skikkelig i Romsdalsfjella. Stiene mellom Nesset og Eresfjord er preparerte og i utmerket stand. Klubben organiserer fellestur neste søndag kl. 10:00 fra parkeringsplassen ved Eidsvåg. Alle nivåer er velkomne — ta kontakt med Petter Strand for å melde deg på.',
    'event',
    'Petter Strand',
    NOW() - INTERVAL '4 days'
  ),

  (
    (SELECT id FROM ms),
    'Utstyrsbyttedag — ski og alpintstøvler',
    'Lørdag 20. april holder vi utstyrsbyttedag på klubbhuset fra kl. 11–15. Ta med ski, støvler, hjelmer og annet utstyr du ikke trenger lenger. Alt registreres gratis på Sportsbyttet. Inntekter fra salg går til idrettsutøverne. Silje Dahl tar i mot utstyr fra kl. 10.',
    'gear',
    'Silje Dahl',
    NOW() - INTERVAL '5 days'
  ),

  -- ── Stavanger Håndball ─────────────────────────────────────

  (
    (SELECT id FROM sh),
    'Ny treningsplan vår 2024 — alle lag',
    'Oppdatert treningsplan for alle lag fra og med uke 15 er nå publisert. Damelagets kamper i 1. divisjon spilles annenhver lørdag — se kampkalenderen. Husk at hallen leies av Stavanger kommune og at oppmøte 15 min før trening er påkrevd. Spørsmål rettes til Ola Kristiansen.',
    'announcement',
    'Ola Kristiansen',
    NOW() - INTERVAL '2 days'
  ),

  (
    (SELECT id FROM sh),
    'Utstyrsbyttekveld — håndballsko og drakter',
    'Torsdag 25. april kl. 18:30 arrangerer vi byttekveld i garderoben etter trening. Ta med sko, drakter og keeperutstyr du er ferdig med. Hanne Bakke selger keeperhansker og kan hjelpe med størrelsesvalg. Alt legges også ut på Sportsbyttet for de som ikke kan møte.',
    'gear',
    'Hanne Bakke',
    NOW() - INTERVAL '10 days'
  ),

  -- ── Tromsø Friluftslag ─────────────────────────────────────

  (
    (SELECT id FROM tf),
    'Tur til Tromsdalstinden — 28. april',
    'Vi inviterer alle medlemmer til årets første fellestopptur til Tromsdalstinden (1238 moh). Oppmøte ved Telegrafbukta kl. 07:30. Turen tar ca. 5–6 timer tur/retur. Middels krevende terreng — ta med gode støvler, varm mat og lagdelt klesplagg. Meld deg på til Tomas Nygaard innen 24. april.',
    'event',
    'Tomas Nygaard',
    NOW() - INTERVAL '6 days'
  ),

  (
    (SELECT id FROM tf),
    'Søker: lettelt og sovepose til kommende turer',
    'Laget mangler utstyr til de yngre deltakerne på sommerprogrammet. Vi søker spesielt: 2-3 persons telt (helst 3-sesonger), soveposer til 0°C eller kaldere, og stormkjøkken. Har du noe du ikke bruker? Legg det ut på Sportsbyttet eller kontakt Else Vatne direkte. Godt betalt!',
    'gear',
    'Else Vatne',
    NOW() - INTERVAL '2 weeks'
  )

ON CONFLICT DO NOTHING;
