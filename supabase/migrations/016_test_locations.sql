-- Migration 016: Add location/lat/lng to a selection of demo listings so
-- they appear on the /kart map page.
--
-- We update the first 8 active demo listings (lowest IDs) with a spread of
-- Norwegian cities.  The CTE picks real listings; the CASE assigns a city
-- based on their row-rank so each run is stable regardless of actual IDs.

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM listings
  WHERE is_sold = false
  LIMIT 12
)
UPDATE listings l
SET
  location = v.location,
  lat      = v.lat,
  lng      = v.lng
FROM ranked r
JOIN (VALUES
  (1,  'Oslo',        59.9139,  10.7522),
  (2,  'Bergen',      60.3913,   5.3221),
  (3,  'Trondheim',   63.4305,  10.3951),
  (4,  'Stavanger',   58.9700,   5.7331),
  (5,  'Tromsø',      69.6489,  18.9551),
  (6,  'Drammen',     59.7440,  10.2045),
  (7,  'Kristiansand',58.1467,   7.9956),
  (8,  'Fredrikstad', 59.2181,  10.9298),
  (9,  'Ålesund',     62.4722,   6.1495),
  (10, 'Bodø',        67.2827,  14.3751),
  (11, 'Hamar',       60.7945,  11.0679),
  (12, 'Gjøvik',      60.7954,  10.6917)
) AS v(rn, location, lat, lng) ON r.rn = v.rn
WHERE l.id = r.id;
