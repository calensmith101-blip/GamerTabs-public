# GamerTab: Black Vault
# City Tycoon — Complete Design & Implementation Spec
# Version 2.0 — Copilot-Ready

---

## 1. COMPLETE 40-SPACE BOARD

### Board coordinate system
```
Corner positions:  0=START(BL)  10=QUARANTINE(BR)  20=DEAD ZONE(TR)  30=VIRUS TRAP(TL)
Non-corner:        1-9 (bottom)  11-19 (right)  21-29 (top)  31-39 (left)
Direction:         clockwise from START
```

### All 40 spaces — full definition

```js
// CityTycoonSpaces.js
export const SPACES = [
  // ── CORNERS ────────────────────────────────────────────────────────────
  { pos:0,  type:'corner', name:'BOOT UP',         sub:'Collect ⬡200 salary',         icon:'🚀', bg:'#001800' },
  { pos:10, type:'corner', name:'QUARANTINE',       sub:'Safe zone / visiting',         icon:'🏚', bg:'#100010' },
  { pos:20, type:'corner', name:'DEAD ZONE',        sub:'No rent collected here',       icon:'☠', bg:'#100000' },
  { pos:30, type:'corner', name:'VIRUS TRAP',       sub:'Sent to Quarantine',           icon:'☣', bg:'#200000' },

  // ── BOTTOM ROW (pos 1–9, left→right) ──────────────────────────────────
  { pos:1,  type:'property', name:'Scrapyard Row',   district:'ruins',   price:60,  mortgage:30  },
  { pos:2,  type:'property', name:'Dead End Alley',  district:'ruins',   price:60,  mortgage:30  },
  { pos:3,  type:'event',    name:'OUTBREAK EVENT',  icon:'☣',  deck:'outbreak'                  },
  { pos:4,  type:'property', name:'Cargo Docks',     district:'wharf',   price:100, mortgage:50  },
  { pos:5,  type:'property', name:'Warehouse Row',   district:'wharf',   price:100, mortgage:50  },
  { pos:6,  type:'property', name:'Dockyard Gate',   district:'wharf',   price:120, mortgage:60  },
  { pos:7,  type:'transport',name:'Metro Hub',       icon:'🚇', price:200, mortgage:100           },
  { pos:8,  type:'property', name:'Steel Works',     district:'foundry', price:140, mortgage:70  },
  { pos:9,  type:'event',    name:'OUTBREAK EVENT',  icon:'☣',  deck:'outbreak'                  },

  // ── RIGHT COLUMN (pos 11–19, bottom→top) ──────────────────────────────
  { pos:11, type:'property', name:'Iron Quarter',    district:'foundry', price:140, mortgage:70  },
  { pos:12, type:'utility',  name:'Power Grid',      icon:'⚡', price:150, mortgage:75           },
  { pos:13, type:'property', name:'Blast Furnace',   district:'foundry', price:160, mortgage:80  },
  { pos:14, type:'property', name:'Neon Strip',      district:'grid',    price:180, mortgage:90  },
  { pos:15, type:'transport',name:'Freight Station', icon:'🚂', price:200, mortgage:100           },
  { pos:16, type:'property', name:'Data Corridor',   district:'grid',    price:180, mortgage:90  },
  { pos:17, type:'property', name:'Voltage Line',    district:'grid',    price:200, mortgage:100 },
  { pos:18, type:'tax',      name:'Arms Levy',       icon:'💀', amount:100, alt:'10%'            },
  { pos:19, type:'property', name:'Glass Tower',     district:'spire',   price:220, mortgage:110 },

  // ── TOP ROW (pos 21–29, right→left) ───────────────────────────────────
  { pos:21, type:'property', name:'Helix Block',     district:'spire',   price:220, mortgage:110 },
  { pos:22, type:'property', name:'The Spire',       district:'spire',   price:240, mortgage:120 },
  { pos:23, type:'utility',  name:'Water Treatment', icon:'💧', price:150, mortgage:75           },
  { pos:24, type:'property', name:'Rooftop Terrace', district:'heights', price:260, mortgage:130 },
  { pos:25, type:'transport',name:'Harbor',          icon:'⚓', price:200, mortgage:100           },
  { pos:26, type:'property', name:'Sky Lounge',      district:'heights', price:260, mortgage:130 },
  { pos:27, type:'event',    name:'OUTBREAK EVENT',  icon:'☣',  deck:'outbreak'                  },
  { pos:28, type:'property', name:'The Pinnacle',    district:'heights', price:280, mortgage:140 },
  { pos:29, type:'property', name:'Castle Gate',     district:'citadel', price:300, mortgage:150 },

  // ── LEFT COLUMN (pos 31–39, top→bottom) ───────────────────────────────
  { pos:31, type:'transport',name:'Airfield',        icon:'✈',  price:200, mortgage:100          },
  { pos:32, type:'event',    name:'OUTBREAK EVENT',  icon:'☣',  deck:'outbreak'                  },
  { pos:33, type:'tax',      name:'Outbreak Fee',    icon:'☣',  amount:75                        },
  { pos:34, type:'property', name:'Fortified Keep',  district:'citadel', price:300, mortgage:150 },
  { pos:35, type:'property', name:'The Stronghold',  district:'citadel', price:320, mortgage:160 },
  { pos:36, type:'event',    name:'OUTBREAK EVENT',  icon:'☣',  deck:'outbreak'                  },
  { pos:37, type:'property', name:'Shadow District', district:'vault',   price:350, mortgage:175 },
  { pos:38, type:'property', name:'Black Market',    district:'vault',   price:350, mortgage:175 },
  { pos:39, type:'event',    name:'OUTBREAK EVENT',  icon:'☣',  deck:'outbreak'                  },
];
```

---

## 2. DISTRICT / COLOUR GROUP SYSTEM

```js
// CityTycoonDistricts.js
export const DISTRICTS = {
  ruins: {
    name: 'The Ruins',
    colorHex: '#8b0000',
    colorDark: '#3d0000',
    colorText: '#ff6666',
    colorGlow: 'rgba(139,0,0,.6)',
    buildingCost: 50,
    positions: [1, 2],
    // rents[buildingCount]: 0=base, 1-4=buildings, 5=compound
    rents: {
      'Scrapyard Row':  [2,  10,  30,  90,  160, 250],
      'Dead End Alley': [4,  20,  60,  180, 320, 450],
    },
    groupBonusRent: true, // owning all doubles base rent
  },
  wharf: {
    name: 'The Wharf',
    colorHex: '#003d7a',
    colorDark: '#001e3d',
    colorText: '#66aaff',
    colorGlow: 'rgba(0,61,122,.6)',
    buildingCost: 50,
    positions: [4, 5, 6],
    rents: {
      'Cargo Docks':   [6,  30,  90,  270, 400, 550],
      'Warehouse Row': [6,  30,  90,  270, 400, 550],
      'Dockyard Gate': [8,  40,  100, 300, 450, 600],
    },
  },
  foundry: {
    name: 'The Foundry',
    colorHex: '#7a3800',
    colorDark: '#3d1c00',
    colorText: '#ff9955',
    colorGlow: 'rgba(122,56,0,.6)',
    buildingCost: 100,
    positions: [8, 11, 13],
    rents: {
      'Steel Works':   [10, 50,  150, 450, 625, 750],
      'Iron Quarter':  [10, 50,  150, 450, 625, 750],
      'Blast Furnace': [12, 60,  180, 500, 700, 900],
    },
  },
  grid: {
    name: 'The Grid',
    colorHex: '#4a007a',
    colorDark: '#250040',
    colorText: '#cc66ff',
    colorGlow: 'rgba(74,0,122,.6)',
    buildingCost: 100,
    positions: [14, 16, 17],
    rents: {
      'Neon Strip':    [14, 70,  200, 550, 750, 950],
      'Data Corridor': [14, 70,  200, 550, 750, 950],
      'Voltage Line':  [16, 80,  220, 600, 800, 1000],
    },
  },
  spire: {
    name: 'The Spire',
    colorHex: '#007a1a',
    colorDark: '#003d0d',
    colorText: '#55ff77',
    colorGlow: 'rgba(0,122,26,.6)',
    buildingCost: 150,
    positions: [19, 21, 22],
    rents: {
      'Glass Tower':   [18, 90,  250, 700, 875,  1050],
      'Helix Block':   [18, 90,  250, 700, 875,  1050],
      'The Spire':     [20, 100, 300, 750, 925,  1100],
    },
  },
  heights: {
    name: 'The Heights',
    colorHex: '#7a6200',
    colorDark: '#3d3100',
    colorText: '#ffcc44',
    colorGlow: 'rgba(122,98,0,.6)',
    buildingCost: 150,
    positions: [24, 26, 28],
    rents: {
      'Rooftop Terrace': [22, 110, 330, 800, 975,  1150],
      'Sky Lounge':      [22, 110, 330, 800, 975,  1150],
      'The Pinnacle':    [24, 120, 360, 850, 1025, 1200],
    },
  },
  citadel: {
    name: 'The Citadel',
    colorHex: '#6a007a',
    colorDark: '#35003d',
    colorText: '#ff55ff',
    colorGlow: 'rgba(106,0,122,.6)',
    buildingCost: 200,
    positions: [29, 34, 35],
    rents: {
      'Castle Gate':    [26, 130, 390, 900,  1100, 1275],
      'Fortified Keep': [26, 130, 390, 900,  1100, 1275],
      'The Stronghold': [28, 150, 450, 1000, 1200, 1400],
    },
  },
  vault: {
    name: 'The Vault',
    colorHex: '#3a3a4e',
    colorDark: '#1e1e28',
    colorText: '#aaaacc',
    colorGlow: 'rgba(58,58,78,.7)',
    buildingCost: 200,
    positions: [37, 38],
    rents: {
      'Shadow District': [35, 175, 500, 1100, 1300, 1500],
      'Black Market':    [35, 175, 500, 1100, 1300, 1500],
    },
  },
};

// Transport rent by number of transports owned
export const TRANSPORT_RENTS = { 1: 25, 2: 50, 3: 100, 4: 200 };

// Utility rent multipliers
export const UTILITY_RENT = { 1: 4, 2: 10 }; // multiply dice roll total
```

---

## 3. PLAYER TOKENS — 8 ORIGINAL CONCEPTS

```js
// CityTycoonTokens.js — SVG definition data
export const TOKENS = [
  {
    id: 'rat',
    name: 'The Rat',
    emoji: '🐀',
    color: '#cc1111',
    dark: '#660000',
    // SVG path: small hunched rodent silhouette
    // Use CSS class: .token-rat
    gradient: 'radial-gradient(circle at 35% 30%, #ff4444, #880000, #220000)',
    glow: 'rgba(200,17,17,.7)',
    lore: 'Survival specialist. Knows every tunnel.',
    animationClass: 'token-scurry',  // quick jitter on land
  },
  {
    id: 'wraith',
    name: 'Iron Wraith',
    emoji: '👻',
    color: '#4477cc',
    dark: '#001166',
    gradient: 'radial-gradient(circle at 35% 30%, #88aaff, #1133aa, #000033)',
    glow: 'rgba(68,119,204,.7)',
    lore: 'Ghost of the old network. Never leaves a trace.',
    animationClass: 'token-phase',   // fade-move on travel
  },
  {
    id: 'viper',
    name: 'Viper',
    emoji: '🐍',
    color: '#00aa33',
    dark: '#005518',
    gradient: 'radial-gradient(circle at 35% 30%, #44ff77, #007722, #001108)',
    glow: 'rgba(0,170,51,.7)',
    lore: 'Strikes without warning. Owns the underground.',
    animationClass: 'token-slither',
  },
  {
    id: 'warden',
    name: 'The Warden',
    emoji: '⛓',
    color: '#cc8800',
    dark: '#664400',
    gradient: 'radial-gradient(circle at 35% 30%, #ffbb44, #aa6600, #331100)',
    glow: 'rgba(204,136,0,.7)',
    lore: 'Runs the Quarantine zone. Everyone pays.',
    animationClass: 'token-stomp',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    emoji: '🔮',
    color: '#9900cc',
    dark: '#440066',
    gradient: 'radial-gradient(circle at 35% 30%, #dd66ff, #7700aa, #220033)',
    glow: 'rgba(153,0,204,.7)',
    lore: 'No one knows where it came from.',
    animationClass: 'token-pulse',
  },
  {
    id: 'drone',
    name: 'Breach Drone',
    emoji: '🤖',
    color: '#00aaaa',
    dark: '#005555',
    gradient: 'radial-gradient(circle at 35% 30%, #44ffff, #008888, #001a1a)',
    glow: 'rgba(0,170,170,.7)',
    lore: 'Automated. Ruthless. Always calculating.',
    animationClass: 'token-hover',
  },
  {
    id: 'boss',
    name: 'The Boss',
    emoji: '💼',
    color: '#888888',
    dark: '#333344',
    gradient: 'radial-gradient(circle at 35% 30%, #cccccc, #666677, #111122)',
    glow: 'rgba(136,136,136,.7)',
    lore: 'Old money. Always has a deal in progress.',
    animationClass: 'token-swagger',
  },
  {
    id: 'medic',
    name: 'Vault Medic',
    emoji: '⚕',
    color: '#cc0044',
    dark: '#660022',
    gradient: 'radial-gradient(circle at 35% 30%, #ff4488, #aa0033, #220011)',
    glow: 'rgba(204,0,68,.7)',
    lore: 'Knows every weakness. Cures — for a price.',
    animationClass: 'token-pulse',
  },
];
```

### Token SVG template (inline, per token)
```jsx
// TokenSVG.jsx
function TokenSVG({ token, size = 44, active = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <defs>
        <radialGradient id={`tg_${token.id}`} cx="38%" cy="32%">
          <stop offset="0%"  stopColor={token.color} stopOpacity=".95"/>
          <stop offset="65%" stopColor={token.dark}   stopOpacity="1"/>
          <stop offset="100%" stopColor="#000"         stopOpacity="1"/>
        </radialGradient>
        <filter id={`tf_${token.id}`}>
          <feGaussianBlur stdDeviation={active ? 3 : 1.5} result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      {/* Glow halo */}
      <circle cx="22" cy="22" r="20" fill="none"
              stroke={token.color} strokeWidth={active ? 2.5 : 1.2}
              opacity={active ? .9 : .4}>
        {active && <animate attributeName="r" values="18;21;18" dur="1.4s" repeatCount="indefinite"/>}
      </circle>
      {/* Body */}
      <circle cx="22" cy="22" r="17"
              fill={`url(#tg_${token.id})`}
              filter={`url(#tf_${token.id})`}/>
      {/* Inner ring */}
      <circle cx="22" cy="22" r="13" fill="none"
              stroke="rgba(255,255,255,.12)" strokeWidth="1"/>
      {/* Sheen */}
      <ellipse cx="17" cy="14" rx="6" ry="3.5"
               fill="rgba(255,255,255,.14)" transform="rotate(-20 17 14)"/>
      {/* Emoji label */}
      <text x="22" y="27" textAnchor="middle" fontSize="14" fontFamily="system-ui">
        {token.emoji}
      </text>
    </svg>
  );
}
```

### Token movement animation
```css
/* Token travel: step between spaces */
@keyframes token-travel {
  0%   { transform: translate(0,0) scale(1); }
  20%  { transform: translate(var(--tx), var(--ty)) scale(1.25) translateY(-8px); }
  80%  { transform: translate(var(--tx), var(--ty)) scale(1.25) translateY(-8px); }
  100% { transform: translate(var(--tx), var(--ty)) scale(1); }
}
/* On landing: bounce */
@keyframes token-land {
  0%   { transform: scale(1.3) translateY(-6px); }
  40%  { transform: scale(0.9) translateY(3px); }
  70%  { transform: scale(1.1) translateY(-2px); }
  100% { transform: scale(1) translateY(0); }
}
.token-land { animation: token-land 0.5s ease both; }

/* Specific token personalities */
@keyframes scurry  { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-3deg)} 75%{transform:rotate(3deg)} }
@keyframes phase   { 0%,100%{opacity:1} 50%{opacity:.5;filter:blur(2px)} }
@keyframes hover   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes swagger { 0%,100%{transform:rotate(0)} 50%{transform:rotate(-5deg)} }
.token-scurry { animation: scurry  0.3s ease-in-out; }
.token-phase  { animation: phase   0.5s ease; }
.token-hover  { animation: hover   1.2s ease-in-out infinite; }
.token-swagger{ animation: swagger 0.4s ease; }
```

---

## 4. PROPERTY SYSTEM — Building Levels

```js
// Building levels: 0=unbuilt, 1-4=buildings (outposts), 5=compound
const BUILDING_NAMES = ['—', 'Outpost', 'Bunker', 'Stronghold', 'Fortress', 'COMPOUND'];
const BUILDING_ICONS = ['',  '🏚',      '🏠',     '🏗',         '🏢',       '☠'];

// CSS classes for ownership markers on board spaces
// .space-owned-p1 { border-color: var(--token-p1); }
// .district-strip → coloured bar top/bottom of space showing district
// .building-pips  → row of small icons showing current building level

// Building SVG (inline, 5 levels)
// Level 1: single small triangle (outpost)
// Level 2: two triangles
// Level 3: three triangles, one taller
// Level 4: tall rectangle block
// Level 5: full compound — red skull glow

// Mortgage: property turns grey, rent suspended, value = 50% purchase price
// Unmortgage: pay 110% of mortgage value
```

### Property card component spec
```
PropertyCard
├── .pc-header          ← district colour background, white text
│   ├── district name (small, top)
│   └── property name (large)
├── .pc-body
│   ├── .pc-price       ← "Purchase: ⬡{price}"
│   ├── .pc-rent-table  ← 6-row table: Unimproved / 1-4 Outposts / Compound
│   ├── .pc-build-cost  ← "Outpost cost: ⬡{buildingCost}"
│   └── .pc-mortgage    ← "Mortgage value: ⬡{mortgage}"
└── .pc-actions
    ├── [BUY] / [PAY RENT ⬡X] / [MORTGAGE] / [BUILD]
    └── shown contextually based on game state
```

---

## 5. TURN FLOW — 5 PHASES

```js
// Phase state machine
const PHASES = ['build', 'roll', 'move', 'land', 'end'];

/*
Phase 0: BUILD
  - Player may build on complete districts (if cash available)
  - Player may mortgage/unmortgage
  - Player may initiate trade with other player
  - "Skip to Roll" button always available
  - UI: show build panel + trade button + skip button

Phase 1: ROLL
  - Show animated dice
  - Single tap/click triggers roll
  - If doubles: flag doublesCount++, will roll again after land phase
  - If doublesCount === 3: send to Quarantine, end turn
  - UI: big ROLL button, dice animation, disable all other actions

Phase 2: MOVE
  - Calculate target position = (current + roll) % 40
  - If passing pos 0 (BOOT UP): award $200 salary (unless sent to Quarantine)
  - Animate token: step through each intermediate space 120ms each
  - Token bounces on arrival
  - UI: show move animation, disable actions

Phase 3: LAND
  - Resolve space type:
    'corner'    → BOOT UP: collect salary | QUARANTINE: idle | DEAD ZONE: idle | VIRUS TRAP: go to Q
    'property'  → unowned: offer buy/auction | owned by self: idle | owned by other: pay rent
    'transport' → same as property
    'utility'   → same as property (rent = dice * multiplier)
    'event'     → draw from shuffled OUTBREAK_EVENTS deck, animate card, resolve effect
    'tax'       → pay fixed amount or % choice
  - UI: show resolved panel with icon, amounts, action buttons

Phase 4: END TURN
  - Check bankruptcy (cash < 0)
  - If bankrupt: force sell/mortgage, or elimination
  - Reset doublesCount if no doubles this turn
  - Pass to next player
  - UI: brief "Turn passed" animation, next player token highlights
*/
```

---

## 6. TWENTY OUTBREAK EVENT CARDS

```js
// CityTycoonEvents.js
export const OUTBREAK_EVENTS = [
  // ── POSITIVE (8) ──────────────────────────────────────────────────────
  {
    id: 'e01',
    title: 'Bunker Cache Found',
    icon: '🎁',
    type: 'gain',
    flavor: 'A hidden supply crate stamped with a faction you no longer recognise.',
    effect: 'Collect ⬡50 from the bank.',
    resolve: (state, pid) => ({ ...state, players: addCash(state.players, pid, 50) }),
  },
  {
    id: 'e02',
    title: 'Black Market Deal',
    icon: '💰',
    type: 'gain',
    flavor: 'Someone sold you something that fell off a freight station. No questions asked.',
    effect: 'Collect ⬡30 from each other player.',
    resolve: (state, pid) => collectFromAll(state, pid, 30),
  },
  {
    id: 'e03',
    title: 'Outbreak Contained',
    icon: '✅',
    type: 'gain',
    flavor: 'Hazmat teams confirm the sector is clear. For now.',
    effect: 'Advance to BOOT UP. Collect ⬡200 salary if you pass or land on it.',
    resolve: (state, pid) => moveToPosition(state, pid, 0, true),
  },
  {
    id: 'e04',
    title: 'Survivor Bounty',
    icon: '🏆',
    type: 'gain',
    flavor: 'The coalition pays well for proof you\'re still breathing.',
    effect: 'Collect ⬡200 if you own no properties. Otherwise collect ⬡50.',
    resolve: (state, pid) => {
      const owned = state.properties.filter(p => p.ownerId === pid).length;
      return addCash(state, pid, owned === 0 ? 200 : 50);
    },
  },
  {
    id: 'e05',
    title: 'Scrap Metal Windfall',
    icon: '⚙',
    type: 'gain',
    flavor: 'The ruins gave up their secrets today.',
    effect: 'Collect ⬡15 per district property you own.',
    resolve: (state, pid) => {
      const owned = state.properties.filter(p => p.ownerId === pid && p.type === 'property').length;
      return addCash(state, pid, owned * 15);
    },
  },
  {
    id: 'e06',
    title: 'Arms Cache Discovered',
    icon: '🔫',
    type: 'gain',
    flavor: 'Old war stockpile. Someone\'s going to pay a lot for this.',
    effect: 'Collect ⬡100 from the bank.',
    resolve: (state, pid) => addCash(state, pid, 100),
  },
  {
    id: 'e07',
    title: 'Evacuation Bonus',
    icon: '🚁',
    type: 'gain',
    flavor: 'The evacuation contract paid out faster than expected.',
    effect: 'Collect ⬡25 for each building you own across all districts.',
    resolve: (state, pid) => {
      const buildings = state.properties
        .filter(p => p.ownerId === pid)
        .reduce((sum, p) => sum + (p.buildings || 0), 0);
      return addCash(state, pid, buildings * 25);
    },
  },
  {
    id: 'e08',
    title: 'Power Grid Failure',
    icon: '🔌',
    type: 'gain',
    flavor: 'The grid went dark. No meters running tonight.',
    effect: 'Utility rent is suspended for all players for 2 turns.',
    resolve: (state) => ({ ...state, globalEffects: { ...state.globalEffects, utilityFreeRounds: 2 } }),
  },

  // ── NEGATIVE (9) ──────────────────────────────────────────────────────
  {
    id: 'e09',
    title: 'Structural Collapse',
    icon: '🏚',
    type: 'loss',
    flavor: 'The building was never up to code. It shows now.',
    effect: 'Pay ⬡40 per building you own (emergency repairs).',
    resolve: (state, pid) => {
      const buildings = state.properties.filter(p=>p.ownerId===pid).reduce((s,p)=>s+(p.buildings||0),0);
      return deductCash(state, pid, buildings * 40);
    },
  },
  {
    id: 'e10',
    title: 'Viral Outbreak',
    icon: '☣',
    type: 'loss',
    flavor: 'You wake up in a sealed container. The paperwork takes time.',
    effect: 'Pay ⬡50 to the bank. Move to Quarantine.',
    resolve: (state, pid) => moveToPosition(deductCash(state, pid, 50), pid, 10, false),
  },
  {
    id: 'e11',
    title: 'Supply Line Disrupted',
    icon: '🚫',
    type: 'loss',
    flavor: 'Someone cut the chain. Everything costs more now.',
    effect: 'Pay ⬡100 in lost revenue.',
    resolve: (state, pid) => deductCash(state, pid, 100),
  },
  {
    id: 'e12',
    title: 'Armed Raid',
    icon: '⚔',
    type: 'loss',
    flavor: 'Didn\'t see them coming. Nobody does.',
    effect: 'Pay 10% of your current cash to the player who owns the most properties.',
    resolve: (state, pid) => {
      const richest = getRichestPlayer(state, pid);
      const amount = Math.floor(state.players[pid].cash * 0.10);
      return transferCash(state, pid, richest, amount);
    },
  },
  {
    id: 'e13',
    title: 'Contamination Warning',
    icon: '⚠',
    type: 'loss',
    flavor: 'The air quality report came back red. Very red.',
    effect: 'Move back 3 spaces. Resolve the new landing space normally.',
    resolve: (state, pid) => moveBack(state, pid, 3),
  },
  {
    id: 'e14',
    title: 'Infrastructure Tax',
    icon: '🚂',
    type: 'loss',
    flavor: 'The transit authority sent a bill. They always do.',
    effect: 'Pay ⬡50 for each transport station you own.',
    resolve: (state, pid) => {
      const transports = state.properties.filter(p=>p.ownerId===pid && p.type==='transport').length;
      return deductCash(state, pid, transports * 50);
    },
  },
  {
    id: 'e15',
    title: 'Emergency Lockdown',
    icon: '🔒',
    type: 'loss',
    flavor: 'Sector sealed. Nobody moves until the clearance comes through.',
    effect: 'Skip your next turn.',
    resolve: (state, pid) => ({ ...state, players: skipNextTurn(state.players, pid) }),
  },
  {
    id: 'e16',
    title: 'Rat Infestation',
    icon: '🐀',
    type: 'loss',
    flavor: 'They ate through the wiring. It was expensive wiring.',
    effect: 'Move to the nearest Ruins property. If owned by another player, pay double rent.',
    resolve: (state, pid) => moveToNearestDistrict(state, pid, 'ruins', true),
  },
  {
    id: 'e17',
    title: 'Blackout Zone Spreads',
    icon: '🌑',
    type: 'loss',
    flavor: 'Whole district went dark overnight. No explanation given.',
    effect: 'If you own any buildings, lose 1 building from your lowest-level property.',
    resolve: (state, pid) => removeCheapestBuilding(state, pid),
  },

  // ── NEUTRAL / INTERACTIVE (3) ──────────────────────────────────────────
  {
    id: 'e18',
    title: 'Shadow Broker',
    icon: '🤝',
    type: 'neutral',
    flavor: 'A hooded figure appears with an offer. Smart money says listen.',
    effect: 'Put one unowned property up for auction starting at its base price. All players may bid.',
    resolve: (state, pid) => startAuction(state, pid),
  },
  {
    id: 'e19',
    title: 'Faction War',
    icon: '⚡',
    type: 'neutral',
    flavor: 'The power balance shifted. Everyone felt it.',
    effect: 'The player with the most buildings pays ⬡100 to the player with the fewest buildings.',
    resolve: (state) => factionWarTransfer(state, 100),
  },
  {
    id: 'e20',
    title: 'Dead Zone Protocol',
    icon: '☠',
    type: 'neutral',
    flavor: 'Command has invoked the protocol. All movement ceases.',
    effect: 'All players move to the Dead Zone. No rent is collected for this full round.',
    resolve: (state) => ({ ...state,
      players: state.players.map(p => ({ ...p, position: 20 })),
      globalEffects: { ...state.globalEffects, noRentRounds: 1 }
    }),
  },
];
```

---

## 7. GAME STATE STRUCTURE

```js
// useCityTycoon.js — complete state shape
const INITIAL_STATE = {
  // ── Game meta ──────────────────────────────────────────
  phase:        'build',      // 'build'|'roll'|'move'|'land'|'end'
  turnIndex:    0,            // index into players array
  round:        1,
  doublesCount: 0,
  lastRoll:     [0, 0],      // [die1, die2]
  isRolling:    false,
  movingToken:  false,
  message:      '',           // current phase message for UI

  // ── Players ────────────────────────────────────────────
  players: [
    {
      id: 'p1',
      name: 'Player 1',
      tokenId: 'rat',
      position: 0,
      cash: 1500,
      inQuarantine: false,
      quarantineTurns: 0,
      skipNextTurn: false,
      isEliminated: false,
      isCPU: false,
    }
  ],

  // ── Properties ────────────────────────────────────────
  // keyed by board position
  properties: {
    1:  { pos: 1,  ownerId: null, buildings: 0, mortgaged: false },
    2:  { pos: 2,  ownerId: null, buildings: 0, mortgaged: false },
    // ... all property positions
  },

  // ── Event deck ────────────────────────────────────────
  eventDeck:       [],        // shuffled copy of OUTBREAK_EVENTS
  eventDiscards:   [],
  drawnEvent:      null,      // currently displayed event card

  // ── Auction ───────────────────────────────────────────
  auction: null,              // { propertyPos, currentBid, currentBidder, bids }

  // ── Trade ─────────────────────────────────────────────
  pendingTrade: null,

  // ── Global effects ────────────────────────────────────
  globalEffects: {
    noRentRounds: 0,
    utilityFreeRounds: 0,
  },

  // ── UI state ──────────────────────────────────────────
  selectedSpace:       null,
  showPropertyCard:    false,
  showEventCard:       false,
  showTradePanel:      false,
  showBuildPanel:      false,
};
```

### Key functions (implement these)
```js
// All return new state — pure functions, no mutation

rollDice(state)           // → { die1, die2, isDoubles }
movePlayer(state, pid, steps)  // → animate + resolve passing START
resolveSpace(state, pid)  // → dispatch to correct resolver based on space type
buyProperty(state, pid, pos)
payRent(state, fromPid, toPid, amount)
buildOnProperty(state, pid, pos)  // validates: owns district, cash, even build rule
mortgageProperty(state, pid, pos)
unmortgageProperty(state, pid, pos)
drawEventCard(state)      // shuffles discard back in when deck empty
endTurn(state)            // advances turnIndex, checks bankruptcy
checkBankruptcy(state, pid) // → true if cash + liquidation < 0
calculateRent(state, pos, diceTotal) // handles all edge cases
playerOwnsDistrict(state, pid, district) // → boolean, needed for group rent doubling
```

---

## 8. UI LAYOUT SPEC

### Desktop layout (landscape, min-width: 900px)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [GAMETABLE: BLACK VAULT]                          [⚙ Settings] [?Help]  │  ← header 48px
├───────────┬────────────────────────────────────────┬────────────────────┤
│           │                                        │                    │
│  PLAYER   │           GAME BOARD                   │   ACTION PANEL     │
│  PANELS   │        (square, max 560px)              │                    │
│  200px    │                                        │   Phase: ROLL      │
│           │  ┌──────────────────────────────────┐  │   ─────────────    │
│ ┌───────┐ │  │  [board SVG here]               │  │  [DICE AREA]       │
│ │ 🐀 P1 │ │  │                                  │  │   ⬡ 1234           │
│ │ $1500  │ │  │                                  │  │                    │
│ │ ●●●    │ │  │                                  │  │  [PHASE ACTIONS]   │
│ └───────┘ │  │                                  │  │  [BUILD] [TRADE]   │
│ ┌───────┐ │  └──────────────────────────────────┘  │                    │
│ │ 👻 P2 │ │                                        │  ─────────────     │
│ │ $1400  │ │  [CURRENT PLAYER BAR]                  │  PROPERTY DETAIL   │
│ │ ●      │ │  🐀 Player 1's turn · Phase: ROLL      │  (slide in)        │
│ └───────┘ │                                        │                    │
│ ...       │                                        │                    │
├───────────┴────────────────────────────────────────┴────────────────────┤
│  [Log: "Player 1 rolled 7 and landed on Neon Strip — paid ⬡14 rent"]    │  ← log 32px
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile layout (portrait, max-width: 600px)
```
┌────────────────────────────┐
│ 🐀 P1 turn · BUILD PHASE   │  ← top bar 44px
│ ⬡1500   [Skip → Roll]      │
├────────────────────────────┤
│                            │
│    BOARD (scrollable       │
│    or pinch-to-zoom)       │  ← main area, aspect-ratio:1
│                            │
│    400px wide max          │
│                            │
├────────────────────────────┤
│ ┌──────────────────────┐   │  ← action drawer, 260px, slides up
│ │  Phase: ROLL         │   │
│ │ [  🎲  ROLL DICE  ]  │   │
│ │  die1  die2  total   │   │
│ │  ─────────────────   │   │
│ │  [BUILD] [TRADE] [?] │   │
│ └──────────────────────┘   │
├────────────────────────────┤
│ [P1 🐀] [P2 👻] [P3 🐍]   │  ← mini player bar, 56px
└────────────────────────────┘
```

### Component tree
```
CityTycoonGame
├── GameHeader
├── GameLayout (flex row on desktop, flex col on mobile)
│   ├── PlayerSidebar
│   │   └── PlayerPanel × n
│   │       ├── TokenIcon
│   │       ├── CashDisplay
│   │       ├── PropertyDots  (coloured by district)
│   │       └── TurnIndicator (animated ring)
│   ├── BoardArea
│   │   ├── CityTycoonBoard (SVG)
│   │   │   ├── Space × 40
│   │   │   │   ├── DistrictStrip
│   │   │   │   ├── SpaceIcon
│   │   │   │   ├── SpaceName
│   │   │   │   ├── SpacePrice
│   │   │   │   ├── OwnershipMarker
│   │   │   │   └── BuildingPips
│   │   │   └── TokenLayer
│   │   │       └── TokenSVG × players (absolute positioned)
│   │   └── CurrentPlayerBar
│   └── ActionPanel
│       ├── PhaseIndicator        (5-step progress: BUILD→ROLL→MOVE→LAND→END)
│       ├── DicePanel             (two dice SVG + roll button)
│       │   ├── BlackVaultDie × 2
│       │   └── RollButton
│       ├── PhaseActions          (context-sensitive buttons)
│       │   ├── BuildPhaseActions
│       │   ├── LandPhaseActions
│       │   └── EndTurnButton
│       └── PropertyDetailPanel  (slide-in on space click)
│           ├── PropertyCardHeader
│           ├── RentTable
│           ├── BuildingDisplay
│           └── PropertyActions
├── EventCardOverlay              (full-screen, appears on event draw)
│   ├── CardAnimation
│   └── EventCardUI
├── AuctionOverlay
├── TradeOverlay
└── BankruptcyOverlay
```

### CSS classes (add to design-system.css)
```css
/* Layout */
.ct-layout          { display:flex; gap:12px; height:calc(100vh - 100px); }
.ct-sidebar         { width:200px; flex-shrink:0; display:flex; flex-direction:column; gap:8px; }
.ct-board-area      { flex:1; display:flex; flex-direction:column; align-items:center; }
.ct-action-panel    { width:260px; flex-shrink:0; display:flex; flex-direction:column; gap:8px; }

/* Player panels */
.ct-player-panel    { background:var(--bv-surface); border:1px solid var(--bv-border); border-radius:10px; padding:10px; }
.ct-player-panel.active { border-color:var(--bv-red); box-shadow:var(--glow-red-sm); animation:bv-pulse-red 2s infinite; }
.ct-player-cash     { font-family:var(--font-mono); color:var(--bv-gold-bright); font-size:15px; font-weight:700; }
.ct-property-dots   { display:flex; flex-wrap:wrap; gap:3px; margin-top:6px; }
.ct-prop-dot        { width:10px; height:10px; border-radius:2px; }

/* Phase indicator */
.ct-phase-bar       { display:flex; gap:4px; align-items:center; }
.ct-phase-step      { flex:1; height:4px; border-radius:2px; background:var(--bv-metal); transition:background .3s; }
.ct-phase-step.done { background:var(--bv-red); box-shadow:var(--glow-red-xs); }
.ct-phase-step.active { background:var(--bv-red-glow); animation:bv-pulse-red 1s infinite; }
.ct-phase-label     { font-family:var(--font-mono); font-size:9px; color:var(--bv-red-hot); font-weight:700; letter-spacing:2px; text-transform:uppercase; }

/* Roll button */
.ct-roll-btn        { width:100%; padding:16px; background:var(--grad-red); border:2px solid var(--bv-red); border-radius:12px; font-family:var(--font-mono); font-size:14px; font-weight:900; letter-spacing:2px; color:#fff; cursor:pointer; text-shadow:0 0 8px rgba(255,100,100,.6); box-shadow:var(--glow-red-md); transition:all .15s; }
.ct-roll-btn:hover  { filter:brightness(1.15); transform:translateY(-1px); }
.ct-roll-btn:disabled { opacity:.4; cursor:not-allowed; }

/* Event card overlay */
.ct-event-overlay   { position:fixed; inset:0; background:rgba(0,0,0,.85); display:flex; align-items:center; justify-content:center; z-index:1000; animation:bv-slide-up .3s ease; }
.ct-event-card      { background:linear-gradient(160deg,#1a0000,#0a0000); border:2px solid var(--bv-red); border-radius:16px; padding:24px; max-width:320px; width:90%; box-shadow:var(--glow-red-lg); animation:bv-pop-in .4s ease; }
.ct-event-type-gain { border-color:rgba(0,170,0,.7); box-shadow:0 0 20px rgba(0,170,0,.4); }
.ct-event-type-loss { border-color:var(--bv-red); box-shadow:var(--glow-red-md); }
.ct-event-type-neutral { border-color:var(--bv-gold); box-shadow:var(--glow-gold-sm); }

/* Building pips on board */
.ct-building-pip    { width:6px; height:6px; border-radius:1px; background:currentColor; display:inline-block; }
.ct-building-compound { width:14px; height:10px; border-radius:2px; background:var(--bv-red-glow); box-shadow:0 0 4px var(--bv-red-glow); display:inline-block; }

/* Property card */
.ct-prop-card       { background:var(--grad-card); border:1px solid var(--bv-border); border-radius:12px; overflow:hidden; }
.ct-prop-header     { padding:10px 12px; font-family:var(--font-mono); font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#fff; }
.ct-rent-row        { display:flex; justify-content:space-between; padding:4px 12px; font-family:var(--font-mono); font-size:10px; border-bottom:1px solid var(--bv-border-dim); }
.ct-rent-row.current { background:rgba(200,16,16,.12); color:var(--bv-red-hot); }

/* Space ownership marker */
.ct-owned-marker    { position:absolute; top:2px; right:2px; width:8px; height:8px; border-radius:50%; border:1px solid rgba(255,255,255,.3); }

/* Auction */
.ct-auction-panel   { background:linear-gradient(160deg,#14140a,#0a0a04); border:2px solid var(--bv-gold); border-radius:12px; padding:16px; box-shadow:var(--glow-gold-md); }
.ct-bid-input       { background:var(--bv-metal); border:1px solid var(--bv-gold); border-radius:6px; color:var(--bv-gold-bright); font-family:var(--font-mono); font-size:16px; padding:8px 12px; text-align:center; width:100%; }

/* Log bar */
.ct-log-bar         { background:var(--bv-surface); border-top:1px solid var(--bv-border); padding:8px 16px; font-family:var(--font-mono); font-size:11px; color:var(--bv-text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ct-log-bar em      { color:var(--bv-red-hot); font-style:normal; }

/* Mobile action drawer */
@media (max-width:600px) {
  .ct-layout          { flex-direction:column; height:auto; }
  .ct-sidebar         { flex-direction:row; width:100%; overflow-x:auto; }
  .ct-player-panel    { min-width:140px; }
  .ct-action-panel    { width:100%; border-radius:16px 16px 0 0; position:sticky; bottom:0; z-index:50; }
}
```

---

## 9. VISUAL STYLING SPEC — Board Space Visual Rules

### Space rendering priority
```
Every space SVG element follows this layer order:
1. Background rect (terrain colour by space type)
2. District colour strip (top 10px for bottom row, left 10px for right column, etc.)
3. Ownership glow (subtle rgba overlay if owned)
4. Content: icon + name + price
5. Building pips (bottom of space)
6. Ownership dot (corner, colour-coded to player)
7. Selection highlight (if clicked)
8. Token(s) (absolute positioned over board)
```

### Space background colours by type
```js
const SPACE_BG = {
  property:  '#0f0f16',   // dark base, district strip adds colour
  transport: '#080818',   // dark navy
  utility:   '#081408',   // dark green
  event:     '#180808',   // dark red
  tax:       '#141008',   // dark amber
  corner_start:   '#001800',
  corner_jail:    '#100010',
  corner_free:    '#100000',
  corner_goto:    '#280000',
};
```

### District strip placement (based on which side of board the space is on)
```
Bottom row spaces:  strip at TOP of space (h=10px, full width)
Right column:       strip at LEFT of space (w=10px, full height)
Top row:            strip at BOTTOM of space
Left column:        strip at RIGHT of space
```

### Building icons (SVG inline, per level)
```
Level 0: empty
Level 1: 🏚  (outpost — small triangle shape)  color: district.colorText at 50%
Level 2: 🏠  (two triangles)                   color: district.colorText at 70%
Level 3: 🏗  (construction block)              color: district.colorText at 85%
Level 4: 🏢  (tall block)                      color: district.colorText at 100%
Level 5: ☠  (compound — skull icon glowing)   color: #ff4444, box-shadow: glow-red-md
```

### Token positioning on board (absolute, over SVG)
```js
// Token pixel position = function of board position index
// Board is rendered in a container div with known pixel dimensions
// Calculate (x,y) per space and place token div at that position
// Multiple tokens on same space: stack with slight x offset (per player index)
function getTokenPosition(boardPos, boardSizePx, playerIndex) {
  // boardPos: 0-39 (0=BL corner, 10=BR corner, 20=TR corner, 30=TL corner)
  const CORNER = boardSizePx * 0.12;      // corner space size
  const SPACE  = (boardSizePx - CORNER * 2) / 9;  // regular space size
  // ... return { x, y } pixel coordinates
}
```

---

## 10. COPILOT IMPLEMENTATION CHECKLIST

### Files to create / modify
```
src/games/CityTycoon/
├── CityTycoonGame.jsx          ← main game wrapper, useReducer for state
├── CityTycoonSpaces.js         ← SPACES array (all 40, as defined above)
├── CityTycoonDistricts.js      ← DISTRICTS object + rent tables
├── CityTycoonEvents.js         ← OUTBREAK_EVENTS array (20 cards)
├── CityTycoonTokens.js         ← TOKENS array
├── useCityTycoon.js            ← game reducer + helper functions
├── components/
│   ├── GameBoard.jsx           ← SVG board (uses CityTycoonBoard.jsx as base)
│   ├── BoardSpace.jsx          ← single space component
│   ├── TokenLayer.jsx          ← positions tokens over board
│   ├── TokenSVG.jsx            ← per-token SVG
│   ├── PlayerPanel.jsx
│   ├── ActionPanel.jsx
│   ├── DicePanel.jsx
│   ├── PhaseIndicator.jsx
│   ├── PropertyCard.jsx
│   ├── EventCardOverlay.jsx
│   ├── AuctionPanel.jsx
│   ├── TradePanel.jsx
│   └── GameLog.jsx
└── CityTycoon.css              ← all .ct-* classes from spec above
```

### State management approach
```jsx
// Use useReducer not useState for complex game state
const [state, dispatch] = useReducer(cityTycoonReducer, INITIAL_STATE);

// Actions:
dispatch({ type: 'SET_PHASE',        payload: 'roll' });
dispatch({ type: 'ROLL_DICE',        payload: { die1, die2 } });
dispatch({ type: 'MOVE_PLAYER',      payload: { pid, targetPos } });
dispatch({ type: 'BUY_PROPERTY',     payload: { pid, pos } });
dispatch({ type: 'PAY_RENT',         payload: { fromPid, toPid, amount } });
dispatch({ type: 'BUILD',            payload: { pid, pos } });
dispatch({ type: 'DRAW_EVENT_CARD'                       });
dispatch({ type: 'RESOLVE_EVENT',    payload: { eventId } });
dispatch({ type: 'END_TURN'                              });
```

### Dice animation trigger
```jsx
// In DicePanel.jsx
const [rolling, setRolling] = useState(false);
const handleRoll = () => {
  if (state.phase !== 'roll') return;
  setRolling(true);
  setTimeout(() => {
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    setRolling(false);
    dispatch({ type: 'ROLL_DICE', payload: { die1: d1, die2: d2 } });
    dispatch({ type: 'SET_PHASE', payload: 'move' });
  }, 800); // matches CSS animation duration
};
```

### Rent calculation (all edge cases)
```js
function calculateRent(state, pos, diceTotal) {
  const prop = state.properties[pos];
  if (!prop || !prop.ownerId || prop.mortgaged) return 0;

  const space = SPACES.find(s => s.pos === pos);
  if (!space) return 0;

  // Transport
  if (space.type === 'transport') {
    const owned = Object.values(state.properties)
      .filter(p => p.ownerId === prop.ownerId && SPACES.find(s=>s.pos===p.pos)?.type==='transport')
      .length;
    return TRANSPORT_RENTS[owned] ?? 0;
  }

  // Utility
  if (space.type === 'utility') {
    if (state.globalEffects.utilityFreeRounds > 0) return 0;
    const ownedUtils = Object.values(state.properties)
      .filter(p => p.ownerId === prop.ownerId && SPACES.find(s=>s.pos===p.pos)?.type==='utility')
      .length;
    return diceTotal * (UTILITY_RENT[ownedUtils] ?? 4);
  }

  // Property
  const dist = DISTRICTS[space.district];
  if (!dist) return 0;
  const rentTable = dist.rents[space.name];
  if (!rentTable) return 0;

  const buildings = prop.buildings ?? 0;
  let rent = rentTable[buildings];

  // Double base rent if player owns all in district and no buildings built
  if (buildings === 0 && playerOwnsDistrict(state, prop.ownerId, space.district)) {
    rent *= 2;
  }

  // No rent if global effect active
  if (state.globalEffects.noRentRounds > 0) return 0;

  return rent;
}
```

### Copyright safety checklist
- ✅ All property names are original
- ✅ No "Monopoly", "Chance", "Community Chest", "Go", "Jail" wording
- ✅ No $200 salary named "passing Go" — it's "BOOT UP salary"
- ✅ Building levels are "Outpost/Bunker/Stronghold/Fortress/Compound" — not "House/Hotel"
- ✅ Event cards use original sci-fi/horror flavor — no Monopoly wording
- ✅ Token designs are original characters
- ✅ District names are all original
- ✅ Utility rent formula same concept as Monopoly but freely available game mechanic (not protected)
