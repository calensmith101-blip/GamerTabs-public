// City Tycoon — South Adelaide Districts with rent tables and building costs
// Rent table format: [unimproved, 1 house, 2 houses, 3 houses, 4 houses, hotel]

export const DISTRICTS = {
  happy: {
    name: 'Happy Valley', colorHex: '#8b0000', colorDark: '#3d0000', colorText: '#ff6666', colorGlow: 'rgba(139,0,0,.6)', buildingCost: 50, positions: [1, 2],
    rents: { 'Happy Valley Drive': [2, 10, 30, 90, 160, 250], 'Education Road': [4, 20, 60, 180, 320, 450] }, groupBonusRent: true,
  },
  chandlers: {
    name: 'Chandlers Hill', colorHex: '#003d7a', colorDark: '#001e3d', colorText: '#66aaff', colorGlow: 'rgba(0,61,122,.6)', buildingCost: 50, positions: [4, 5, 6],
    rents: { 'Chandlers Hill Road': [6, 30, 90, 270, 400, 550], 'Black Road': [6, 30, 90, 270, 400, 550], 'States Road': [8, 40, 100, 300, 450, 600] },
  },
  mainSouth: {
    name: 'Main South Run', colorHex: '#7a3800', colorDark: '#3d1c00', colorText: '#ff9955', colorGlow: 'rgba(122,56,0,.6)', buildingCost: 100, positions: [8, 11, 13],
    rents: { 'Panalatinga Road': [10, 50, 150, 450, 625, 750], 'Kenihans Road': [10, 50, 150, 450, 625, 750], 'Main South Road': [12, 60, 180, 500, 700, 900] },
  },
  expressway: {
    name: 'Expressway Link', colorHex: '#4a007a', colorDark: '#250040', colorText: '#cc66ff', colorGlow: 'rgba(74,0,122,.6)', buildingCost: 100, positions: [14, 16, 17],
    rents: { 'Southern Expressway': [14, 70, 200, 550, 750, 950], 'Beach Road': [14, 70, 200, 550, 750, 950], 'Dyson Road': [16, 80, 220, 600, 800, 1000] },
  },
  noarlunga: {
    name: 'Noarlunga Hub', colorHex: '#007a1a', colorDark: '#003d0d', colorText: '#55ff77', colorGlow: 'rgba(0,122,26,.6)', buildingCost: 150, positions: [19, 21, 22],
    rents: { 'Noarlunga Centre': [18, 90, 250, 700, 875, 1050], 'Honeypot Road': [18, 90, 250, 700, 875, 1050], 'Commercial Road': [20, 100, 300, 750, 925, 1100] },
  },
  seafordLine: {
    name: 'Seaford Line', colorHex: '#7a6200', colorDark: '#3d3100', colorText: '#ffcc44', colorGlow: 'rgba(122,98,0,.6)', buildingCost: 150, positions: [24, 26, 28],
    rents: { 'Bains Road': [22, 110, 330, 800, 975, 1150], 'Griffiths Drive': [22, 110, 330, 800, 975, 1150], 'Seaford Road': [24, 120, 360, 850, 1025, 1200] },
  },
  seafordCoast: {
    name: 'Seaford Coast', colorHex: '#6a007a', colorDark: '#35003d', colorText: '#ff55ff', colorGlow: 'rgba(106,0,122,.6)', buildingCost: 200, positions: [29, 34, 35],
    rents: { 'Grand Boulevard': [26, 130, 390, 900, 1100, 1275], 'O’Sullivan Beach Road': [26, 130, 390, 900, 1100, 1275], 'Esplanade Seaford': [28, 150, 450, 1000, 1200, 1400] },
  },
  premium: {
    name: 'South Coast Premium', colorHex: '#3a3a4e', colorDark: '#1e1e28', colorText: '#aaaacc', colorGlow: 'rgba(58,58,78,.7)', buildingCost: 200, positions: [37, 38],
    rents: { 'Victor Harbor Road': [35, 175, 500, 1100, 1300, 1500], 'Seaford Meadows': [35, 175, 500, 1100, 1300, 1500] },
  },
};

export const TRANSPORT_RENTS = { 1: 25, 2: 50, 3: 100, 4: 200 };
export const UTILITY_RENT = { 1: 4, 2: 10 };
export const BUILDING_LEVELS = ['—', 'House 1', 'House 2', 'House 3', 'House 4', 'Hotel'];
export const BUILDING_ICONS = ['', '🏠', '🏠', '🏠', '🏠', '🏨'];
