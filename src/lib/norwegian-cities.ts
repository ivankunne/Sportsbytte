export type NorwegianCity = {
  name: string;
  lat: number;
  lng: number;
};

export const NORWEGIAN_CITIES: NorwegianCity[] = [
  { name: "Oslo",          lat: 59.9139, lng: 10.7522 },
  { name: "Bergen",        lat: 60.3913, lng: 5.3221  },
  { name: "Trondheim",     lat: 63.4305, lng: 10.3951 },
  { name: "Stavanger",     lat: 58.9700, lng: 5.7331  },
  { name: "Tromsø",        lat: 69.6492, lng: 18.9553 },
  { name: "Fredrikstad",   lat: 59.2181, lng: 10.9298 },
  { name: "Drammen",       lat: 59.7440, lng: 10.2045 },
  { name: "Porsgrunn",     lat: 59.1406, lng: 9.6550  },
  { name: "Skien",         lat: 59.2091, lng: 9.6098  },
  { name: "Kristiansand",  lat: 58.1599, lng: 8.0182  },
  { name: "Ålesund",       lat: 62.4722, lng: 6.1495  },
  { name: "Tønsberg",      lat: 59.2677, lng: 10.4076 },
  { name: "Moss",          lat: 59.4350, lng: 10.6615 },
  { name: "Hamar",         lat: 60.7945, lng: 11.0679 },
  { name: "Arendal",       lat: 58.4622, lng: 8.7725  },
  { name: "Bodø",          lat: 67.2827, lng: 14.3751 },
  { name: "Sandefjord",    lat: 59.1330, lng: 10.2167 },
  { name: "Haugesund",     lat: 59.4138, lng: 5.2680  },
  { name: "Larvik",        lat: 59.0567, lng: 10.0301 },
  { name: "Halden",        lat: 59.1225, lng: 11.3877 },
  { name: "Lillehammer",   lat: 61.1153, lng: 10.4662 },
  { name: "Molde",         lat: 62.7375, lng: 7.1592  },
  { name: "Harstad",       lat: 68.7983, lng: 16.5411 },
  { name: "Gjøvik",        lat: 60.7956, lng: 10.6914 },
  { name: "Kongsberg",     lat: 59.6646, lng: 9.6504  },
  { name: "Alta",          lat: 69.9689, lng: 23.2716 },
  { name: "Narvik",        lat: 68.4385, lng: 17.4272 },
  { name: "Horten",        lat: 59.4131, lng: 10.4817 },
  { name: "Elverum",       lat: 60.8830, lng: 11.5633 },
  { name: "Steinkjer",     lat: 64.0146, lng: 11.4955 },
  { name: "Sarpsborg",     lat: 59.2839, lng: 11.1097 },
  { name: "Ski",           lat: 59.7214, lng: 10.8344 },
  { name: "Lørenskog",     lat: 59.9117, lng: 10.9559 },
  { name: "Sandnes",       lat: 58.8524, lng: 5.7352  },
  { name: "Askøy",         lat: 60.4000, lng: 5.1667  },
];

export function cityByName(name: string): NorwegianCity | undefined {
  return NORWEGIAN_CITIES.find((c) => c.name === name);
}
