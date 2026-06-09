// City Tycoon — South Adelaide / Seaford line 40-space board
// Corner positions: 0=GO, 10=JAIL, 20=FREE PARKING, 30=GO TO JAIL
// Route theme: main roads between Happy Valley and Seaford + Adelaide CBD to Seaford train line.

export const SPACES = [
  { pos: 0, type: 'corner', name: 'GO', sub: 'Collect ⬡200', icon: '🚦', bg: '#001800' },
  { pos: 10, type: 'corner', name: 'JAIL', sub: 'Just visiting / in jail', icon: '🚓', bg: '#100010' },
  { pos: 20, type: 'corner', name: 'FREE PARKING', sub: 'Rest stop', icon: '🅿️', bg: '#100000' },
  { pos: 30, type: 'corner', name: 'GO TO JAIL', sub: 'Go directly to Jail', icon: '🚨', bg: '#200000' },

  // Happy Valley start
  { pos: 1, type: 'property', name: 'Happy Valley Drive', district: 'happy', price: 60, mortgage: 30 },
  { pos: 2, type: 'property', name: 'Education Road', district: 'happy', price: 60, mortgage: 30 },
  { pos: 3, type: 'event', name: 'CHANCE', icon: '❔', deck: 'outbreak' },
  { pos: 4, type: 'property', name: 'Chandlers Hill Road', district: 'chandlers', price: 100, mortgage: 50 },
  { pos: 5, type: 'property', name: 'Black Road', district: 'chandlers', price: 100, mortgage: 50 },
  { pos: 6, type: 'property', name: 'States Road', district: 'chandlers', price: 120, mortgage: 60 },
  { pos: 7, type: 'transport', name: 'Adelaide Railway Station', icon: '🚆', price: 200, mortgage: 100 },
  { pos: 8, type: 'property', name: 'Panalatinga Road', district: 'mainSouth', price: 140, mortgage: 70 },
  { pos: 9, type: 'event', name: 'CHANCE', icon: '❔', deck: 'outbreak' },

  // Main South Road corridor
  { pos: 11, type: 'property', name: 'Kenihans Road', district: 'mainSouth', price: 140, mortgage: 70 },
  { pos: 12, type: 'utility', name: 'SA Power Network', icon: '⚡', price: 150, mortgage: 75 },
  { pos: 13, type: 'property', name: 'Main South Road', district: 'mainSouth', price: 160, mortgage: 80 },
  { pos: 14, type: 'property', name: 'Southern Expressway', district: 'expressway', price: 180, mortgage: 90 },
  { pos: 15, type: 'transport', name: 'Goodwood Station', icon: '🚉', price: 200, mortgage: 100 },
  { pos: 16, type: 'property', name: 'Beach Road', district: 'expressway', price: 180, mortgage: 90 },
  { pos: 17, type: 'property', name: 'Dyson Road', district: 'expressway', price: 200, mortgage: 100 },
  { pos: 18, type: 'tax', name: 'Council Rates', icon: '💸', amount: 100, alt: '10%' },
  { pos: 19, type: 'property', name: 'Noarlunga Centre', district: 'noarlunga', price: 220, mortgage: 110 },

  // Noarlunga to Seaford
  { pos: 21, type: 'property', name: 'Honeypot Road', district: 'noarlunga', price: 220, mortgage: 110 },
  { pos: 22, type: 'property', name: 'Commercial Road', district: 'noarlunga', price: 240, mortgage: 120 },
  { pos: 23, type: 'utility', name: 'SA Water', icon: '💧', price: 150, mortgage: 75 },
  { pos: 24, type: 'property', name: 'Bains Road', district: 'seafordLine', price: 260, mortgage: 130 },
  { pos: 25, type: 'transport', name: 'Noarlunga Centre Station', icon: '🚉', price: 200, mortgage: 100 },
  { pos: 26, type: 'property', name: 'Griffiths Drive', district: 'seafordLine', price: 260, mortgage: 130 },
  { pos: 27, type: 'event', name: 'CHANCE', icon: '❔', deck: 'outbreak' },
  { pos: 28, type: 'property', name: 'Seaford Road', district: 'seafordLine', price: 280, mortgage: 140 },
  { pos: 29, type: 'property', name: 'Grand Boulevard', district: 'seafordCoast', price: 300, mortgage: 150 },

  // Seaford coast / premium end
  { pos: 31, type: 'transport', name: 'Seaford Station', icon: '🚆', price: 200, mortgage: 100 },
  { pos: 32, type: 'event', name: 'CHANCE', icon: '❔', deck: 'outbreak' },
  { pos: 33, type: 'tax', name: 'Luxury Tax', icon: '💰', amount: 75 },
  { pos: 34, type: 'property', name: 'O’Sullivan Beach Road', district: 'seafordCoast', price: 300, mortgage: 150 },
  { pos: 35, type: 'property', name: 'Esplanade Seaford', district: 'seafordCoast', price: 320, mortgage: 160 },
  { pos: 36, type: 'event', name: 'CHANCE', icon: '❔', deck: 'outbreak' },
  { pos: 37, type: 'property', name: 'Victor Harbor Road', district: 'premium', price: 350, mortgage: 175 },
  { pos: 38, type: 'property', name: 'Seaford Meadows', district: 'premium', price: 350, mortgage: 175 },
  { pos: 39, type: 'event', name: 'CHANCE', icon: '❔', deck: 'outbreak' },
];

export function getSpaceByIndex(index) {
  return SPACES.find(s => s.pos === index);
}

export function isPurchasableSpace(space) {
  if (!space) return false;
  return space.type === 'property' || space.type === 'transport' || space.type === 'utility';
}
