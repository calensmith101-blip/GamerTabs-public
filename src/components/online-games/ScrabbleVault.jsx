import React, { useState, useCallback, useMemo } from 'react';

// ─── Board premium squares ────────────────────────────────────────────────────
const PREMIUM = (() => {
  const p = {};
  const TW = [[0,0],[0,7],[0,14],[7,0],[7,14],[14,0],[14,7],[14,14]];
  const DW = [[1,1],[2,2],[3,3],[4,4],[1,13],[2,12],[3,11],[4,10],[13,1],[12,2],[11,3],[10,4],[13,13],[12,12],[11,11],[10,10],[7,7]];
  const TL = [[1,5],[1,9],[5,1],[5,5],[5,9],[5,13],[9,1],[9,5],[9,9],[9,13],[13,5],[13,9]];
  const DL = [[0,3],[0,11],[2,6],[2,8],[3,0],[3,7],[3,14],[6,2],[6,6],[6,8],[6,12],[7,3],[7,11],[8,2],[8,6],[8,8],[8,12],[11,0],[11,7],[11,14],[12,6],[12,8],[14,3],[14,11]];
  TW.forEach(([r,c])=>{p[`${r},${c}`]='TW';});
  DW.forEach(([r,c])=>{p[`${r},${c}`]='DW';});
  TL.forEach(([r,c])=>{p[`${r},${c}`]='TL';});
  DL.forEach(([r,c])=>{p[`${r},${c}`]='DL';});
  return p;
})();

const PREM_COLOR = {TW:'#C41E3A',DW:'#FF8C69',TL:'#4169E1',DL:'#87CEEB'};
const PREM_LABEL = {TW:'TW',DW:'DW',TL:'TL',DL:'DL'};

// ─── Tile definitions ─────────────────────────────────────────────────────────
const TILES = {
  A:{v:1,n:9},B:{v:3,n:2},C:{v:3,n:2},D:{v:2,n:4},E:{v:1,n:12},F:{v:4,n:2},
  G:{v:2,n:3},H:{v:4,n:2},I:{v:1,n:9},J:{v:8,n:1},K:{v:5,n:1},L:{v:1,n:4},
  M:{v:3,n:2},N:{v:1,n:6},O:{v:1,n:8},P:{v:3,n:2},Q:{v:10,n:1},R:{v:1,n:6},
  S:{v:1,n:4},T:{v:1,n:6},U:{v:1,n:4},V:{v:4,n:2},W:{v:4,n:2},X:{v:8,n:1},
  Y:{v:4,n:2},Z:{v:10,n:1},'?':{v:0,n:2},
};

function makeBag() {
  const bag = [];
  Object.entries(TILES).forEach(([letter,{n}]) => {
    for (let i=0;i<n;i++) bag.push(letter);
  });
  return shuffle([...bag]);
}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

function drawTiles(bag, n) {
  const drawn = [], rest = [...bag];
  for (let i=0;i<n&&rest.length;i++) drawn.push(rest.pop());
  return { drawn, bag:rest };
}

// ─── Word list (2-letter official + common English words) ────────────────────
const WORD_SET = new Set(
`aa ab ad ae ag ah ai al am an ar as at aw ax ay ba be bi bo by da de do ed ef eh el em en er es et ew ex fa fe gi go ha he hi hm ho id if in is it jo ka ki la li lo ma me mi mm mo mu my na ne no nu od oe of oh oi om on op or os ow ox oy pa pe pi po qi re sh si so ta ti to uh um un up ut we wo xi xu ya ye yo za
ace aces act acts add adds age aged ages ago aid aids aim aims air airs ale ales all ally also and ant any ape apt arc are ark arm art ash ask asp ate atop awe awn axe aye
bad bag ban bar bat bay bed bee beg bet bid big bit blow bog bow box boy bud bug bun bus but buy
cab can cap car cat cod cog cop cow cue cup cut
dab dam dew did die dig dim dip doe dog dot dub dug duo dye
ear eat eel egg ego elm end era eve ewe eye
fab fad fan far fat few fib fig fin fit fix fly fog foe for fox fry fun fur
gab gap gel gem get gin god got gum gun gut guy gym
had ham has hat hay hem hen hew hex hey hid him hip hit hob hoe hog hop hot how hub hug hum hut
ice icy ill ink inn ion ore ivy
jab jam jar jaw jet jig job joy jug
keg kin kit
lab lad lag lap law lay leg let lid lie lip lit log lot low lug
mad map mar mat may men met mud mug mum
nag nap nip nod nor not now nun nut
oak odd ode off oil old one opt orb our out owe owl own
pad pan pap par pat paw pay pea peg pen pet pie pig pin pit pod pop pot pow pub pug pun pup put
rag ram rap rat raw ray red ref rep rib rid rig rim rip rob rod rot row rub rug rum run rut rye
sad sag sap sat saw say sea set sew shy sin sip sit ski sky sob sod son sow spa spy sub sue sum sun sup
tab tag tan tap tar tax tea ten tip toe ton top tow toy tub tug
urn use
van vat via vow
wad war was wax way web wed wig win wit woe wok won woo
yak yam yap yaw yea yen yew yip you
zap zip zoo
able acid aged also area army baby back ball band bank bare barn base bath beat been bell belt best bird bite blue blur bold bolt bond bone book born both bowl buck bulk bull burn byte
cage call calm came care case cash cast cave cent chip city clad clam clap clew clip clog club clue coat code coil cold come cook cool cope cord core corn cost coup cozy crew crop cube cyan
dale dame dare dark data date dawn dead deaf deal dean dear deck deep deny desk dime dire dirt dive dock dome dome done door dose dote dove down drab draw drew drip drop drum dual dump dune dusk dust duty
each earl earn east easy edge emit emit even ever evil exam expo
face fact fade fail fair fake fall fame fare farm fast fate feed feel felt file fill find fine fire fish fist flag flat flew flip flow foam fold folk fond font food fool foot ford fore fork form fort foul four fowl free fret frog from fuel full fund fuse
gain gale gale game gang garb gate gave gear gist give glad glow glue gnar gnaw goal gold golf gone gong good gore gown grab gray grim grin grip grow grub gulf gull gust
hack hail hair hale hall halt halo hand hang hard hare hark harm harp hash haze head heal heap hear heat heel herb herd here hero high hill hint hire hive hold hole home hood hoof hook hope horn hose host hour huge hull hulk hump hunt
icon idle ills imps inch info into iron isle itch item
jack jade jail jaws jest join joke jolt jowl jump junk jury just
keen keep kick kill kind king knee knew knit knob know
lack laid lake lamb lame lamp land lane lard lark last late lawn lead leaf leak lean leap left lend lens less lien lift like limb lime link lion list live loft lone long look loom loot lore lose loss lost loud love luck
mace made mage mail main make male mall mane mare mark mast maze meal mean meat meet melt memo mesh mild mill mind mine mint mire miss mist mode mole molt more most moth move much muse musk must myth
nail name navy need nest newt nice nick node none noon norm nose note numb
oath obey odds omen once only open oven over
pace pack page paid pail pair pale pall palm palm pare park part past path pave peak peal peel peer pick pile pill pine pink pipe plan play plea plot plow ploy plum plus poem poet pond pool pore port pose post pour pray prep prey prism prod prow pull pump pure push
quiz
race rack rage raid rail rain rake ramp rang rank rasp rate rave read real reap reed reel rely rent rest ride ring riot rise risk rite road roam roar robe rock rode role roll roof room rope rose ruin rule rush rust
safe sage said sail sale salt same sand sane sang sank sash save scan seam seep self sell sent serv shed shin ship shoe shop shot show shun shut sick side sigh silk sill silt sing sink site size skip slag slap slew slim slip slit slow slug slum slur snap snip snow soak soar sock soft soil sold sole some song soot sore soul soup sour span spar spat spec spin spit spot span stab stag star stem step stew stir stop stow stub stud such suit sulk sump sung sunk sure surf swim
tack tail tale tame tank tape tare task taut taxi tell tend term test text than that them then they thin this thorn thou tick tide tilt time toad told toll tomb tone tore toss town trek trim trip true tube tuck tuft tuft tuft tune turf turn tusk twin type
ugly undo unit upon urge used user
vale vane vary veil vein very vest veto vial vine visa void volt vote
wade wage wait wake wale walk wall want ware warm warn wary wave weak weal wean wear weld well went were west when wide will wilt wind wine wing wink wipe wire wise wish with wolf womb word wore worm wort wove wrap wren writ
yawn yarn yard yore
zeal zone zoom
about above abuse acute admit adopt adult after again agree ahead aimed alert algae align alike alive allay allot allow alloy aloft alone along alter among angel ankle annex annoy anvil apart apple apply aptly April ardor argue arise armed armor aroma arose array arson aside asked aspen asset avail avoid awash awoke
badge badly barge badly baron basic basil basis beach began begin being bench berry biome bitch blank blast blaze bleat bleed blend bless blind bliss block blood bloom blown blurt boast bonus botch brace brand brawl brave bread break breed briar bribe bride brief brood brook broom broil brown brunt brush buddy built bunny buyer
cabal cabin cagey camel cameo carve cause chain chalk champ chant chaos charm chase cheap cheat cheek chess chest chief child chill chimp chord chore chose churn civil claim clank class clean clear cleave clerk cloak clock clone close cloth cloud clove clown clung coach coast cobra comet comic comet comes coral corps could count court cover covet craft crane crawl creak cream creek creep crest crimp crisp cross crowd crown cruel crumb crush crust crush cubic curly curve
daddy daily dance dares decay decoy dense depot depth derby detox dingo dirty disco divvy dizzy dodge dogma donor doted doubt dough draft drain drake drape drool drove drown dryer dully dwarf dwell dying
eagle early easel eerie eight elbow elder elite ember erupt evict evoke exact exist expel extol extra exult
fable faced facet faded faint fairy fancy farce feast feces fence feral fetid fever fiery fifty fight filth fined first first fjord flair flake flame flank flare flash flask flaunt flesh flies flock flood floor flour flown fluff flunk flute foamy force forge forte found frame franc fraud freak freed fresh front frost frown froze frugal
gamut gauze gecko giddy girth given gizmo gland glare gleam glean glide glint gloat gloom gloss glove gnome groan grope grout group grove growl gruel gruff grump guile guise gully gusto
haiku hairy harsh haste haven haven heart heavy heist hence heron hinge hippo hoard hoist holly honey honor horde horrid horse hotel hound hover howl humor humus
ideal image imply imply incur index inept inert infra infer infix inlay inner input inter intro irony issue itchy
joust jokey jumpy juice juicy julep juror
knave kneel knife knigh knack knock known
lathe latch later latte lathe leach legal lemon level lever libel light limit linen liner liner lingo lithe liver lofty logic lusty
maize major maker mania manor march mirth masse matey moody moral motto moult mourn mouse mourn mouth mucus muddy murky murky musty myrrh
naive narco naval nerve niche night nihil nitty noble noise notch novel nudge numbs
oblique octet octave oddly offer offal often offend often olive ominous onset opera other ought overt oxide
padre panel panic patch paved patio patio pauze paved peace peach penal petal picky pilot pinch pithy paved pivot pixel pizza plaid plain plane plank plant plaza plead plonk pluck plum plumb plump plunk plush poach pokey polka polyp porch pouch pouch pouch pouch prank press price pride prime print prism probe prone proud prune psalm psalmo pudgy pulse punch pupil purge pygmy
quart quaff quasi queen query queue quiet quota quote
rabid radar raked rally ranch rapid raven reach ready realm rebus recut redux reign relax relay relic remix remix renew repay repel resin retch retro revel revue ridge ripen rivet rodeo rouge rough rouse rowdy rowel ruled
sadly saint salvo sapid sassy sauce savor savor savor savvy scald scalp scant scamp scare scarf scary scene scone scoop scope score scorn scour scout scowl scram scrap scrub seize sense shack shade shaft shaky shall shame shape share shark sharp sheer shelf shine shirt shock shore short shout shove shrub shrug shuck sieve since sixth sixty sixty skimp skill skulk slack slain slant slick slide slime sloth slump smear smock smoky snack snake snaky snare sniff snore snort snout soapy solar solid solve sorry south south spade spark spasm spawn speed spell spice spill spine splat split spool spore squad squat squid stain stair stale stalk stall stave stead steam steel steep steer stern stick stiff stink stomp stone stoop store storm stout strap straw stray strewn strip strut stuck study stump stunk stunt swamp swarm swear sweat sweep swept swill swoop
taffy taint taken tango tardy taunt tawny tepid terse tepid terse thank thick thief thong thorn those throb throw thrum tiara tidal tiger tiled tilt timer tinge tipsy titan today topic topaz torch total totem touch tough towel toxic trace track trade trail train tramp trawl tread treat treed trekk tribe trice tried tromp trout truly tryst tumult tuner tumor tweed twerp twice twill twine twist
ulcer ultra umbra under undue unfit unify union unlit until unwed unzip upper urban usage usher utter
vault valor valet value vapor venom verge vigor viral virtu vista vixen vogue voile vouch vying
waded wagon waive waltz waste watch water weary weave weedy weird whale wheat wheel where while whiff whirl whisk white whole whose widen wield windy wispy witch witty woeful wonky woods wordy world worse worst would wrath wreak wreck wrist wrote
yacht yearn yield young youth yummy
zippy`.split(/\s+/).filter(Boolean)
);

// ─── Score calculation ────────────────────────────────────────────────────────
function scoreWord(cells, board) {
  // cells = [{r,c,letter,value}] — new tiles being placed
  // Board must already contain adjacent tiles
  let wordMult = 1, letterSum = 0;
  cells.forEach(({r,c,letter,value}) => {
    const pk = `${r},${c}`;
    const prem = PREMIUM[pk];
    let lv = value;
    if (prem==='DL') lv *= 2;
    if (prem==='TL') lv *= 3;
    if (prem==='DW') wordMult *= 2;
    if (prem==='TW') wordMult *= 3;
    letterSum += lv;
  });
  return letterSum * wordMult;
}

// ─── Extract words formed ─────────────────────────────────────────────────────
function extractWords(placed, board) {
  // placed: [{r,c,letter}]
  // board: 15×15 of {letter} or null
  // Returns array of {word, cells:[{r,c,letter}]}
  if (!placed.length) return [];

  const tempBoard = board.map(row=>[...row]);
  placed.forEach(({r,c,letter})=>{ tempBoard[r][c] = {letter, placed:true}; });

  function getWordAt(r,c,dir) {
    let sr=r,sc=c;
    if (dir==='h') { while(sc>0 && tempBoard[sr][sc-1]) sc--; }
    else { while(sr>0 && tempBoard[sr-1][sc]) sr--; }
    const cells=[];
    let cr=sr,cc=sc;
    while(cr<15 && cc<15 && tempBoard[cr][cc]) {
      cells.push({r:cr,c:cc,letter:tempBoard[cr][cc].letter});
      if(dir==='h') cc++; else cr++;
    }
    return cells.length>=2 ? cells : null;
  }

  const words = [];
  const seen = new Set();

  const isHoriz = placed.length===1 || placed.every(({r})=>r===placed[0].r);
  const isVert  = placed.length===1 || placed.every(({c})=>c===placed[0].c);

  placed.forEach(({r,c})=>{
    // Check horizontal word through this cell
    const hw = getWordAt(r,c,'h');
    if (hw) {
      const k = hw.map(({r,c})=>`${r},${c}`).join('|');
      if (!seen.has(k)) { seen.add(k); words.push({word:hw.map(x=>x.letter).join(''),cells:hw}); }
    }
    // Check vertical word through this cell
    const vw = getWordAt(r,c,'v');
    if (vw) {
      const k = vw.map(({r,c})=>`${r},${c}`).join('|');
      if (!seen.has(k)) { seen.add(k); words.push({word:vw.map(x=>x.letter).join(''),cells:vw}); }
    }
  });

  return words;
}

// ─── Validate a full placement ────────────────────────────────────────────────
function validatePlacement(placed, board, isFirstMove) {
  if (!placed.length) return { ok:false, msg:'Nothing placed.' };

  // Must all be in same row or same column
  const allSameRow = placed.every(({r})=>r===placed[0].r);
  const allSameCol = placed.every(({c})=>c===placed[0].c);
  if (!allSameRow && !allSameCol) return { ok:false, msg:'Tiles must be in the same row or column.' };

  // First move must include centre (7,7)
  if (isFirstMove) {
    if (!placed.some(({r,c})=>r===7&&c===7)) return { ok:false, msg:'First word must cover the centre ★.' };
  } else {
    // Must connect to existing tiles
    const tempBoard = board.map(row=>[...row]);
    placed.forEach(({r,c,letter})=>{ tempBoard[r][c]={letter}; });
    const connects = placed.some(({r,c})=>
      [[-1,0],[1,0],[0,-1],[0,1]].some(([dr,dc])=>{
        const nr=r+dr, nc=c+dc;
        return nr>=0&&nr<15&&nc>=0&&nc<15 && board[nr][nc] && !placed.some(p=>p.r===nr&&p.c===nc);
      })
    );
    if (!connects) return { ok:false, msg:'New tiles must connect to existing tiles.' };
  }

  // Extract and validate all words
  const words = extractWords(placed, board);
  if (!words.length) return { ok:false, msg:'No words formed.' };

  for (const { word } of words) {
    if (!WORD_SET.has(word.toLowerCase())) {
      return { ok:false, msg:`"${word}" is not a valid word.` };
    }
  }

  return { ok:true, words };
}

// ─── AI: simple word finder ───────────────────────────────────────────────────
function aiPlay(rack, board, isFirst) {
  // Try to place words horizontally across the board
  const rackLetters = rack.map(l=>l==='?'?'?':l);

  function canMakeFrom(word, letters) {
    const avail=[...letters];
    for (const ch of word) {
      const idx=avail.indexOf(ch);
      if (idx>=0) { avail.splice(idx,1); continue; }
      const wIdx=avail.indexOf('?');
      if (wIdx>=0) { avail.splice(wIdx,1); continue; }
      return false;
    }
    return true;
  }

  const candidates = [...WORD_SET].filter(w=>w.length>=2&&w.length<=7&&canMakeFrom(w.toUpperCase(),rackLetters));
  candidates.sort(()=>Math.random()-.5);

  if (isFirst) {
    for (const word of candidates.slice(0,40)) {
      const w = word.toUpperCase();
      const r=7, startC=7-Math.floor(w.length/2);
      if (startC<0||startC+w.length>15) continue;
      const placed = w.split('').map((letter,i)=>({r,c:startC+i,letter}));
      const val = validatePlacement(placed,board,true);
      if (val.ok) return { placed, words:val.words };
    }
    return null;
  }

  // Try to attach to existing tiles
  for (let r=0;r<15;r++) {
    for (let c=0;c<15;c++) {
      if (!board[r][c]) continue; // need anchor
      for (const word of candidates.slice(0,60)) {
        const w=word.toUpperCase();
        for (let pos=0;pos<w.length;pos++) {
          // Try to place word horizontally so w[pos] = board[r][c].letter
          if (w[pos]!==board[r][c].letter) continue;
          const startC=c-pos;
          if (startC<0||startC+w.length>15) continue;
          // Check all positions are free or match
          const newPlaced=[];
          let valid=true;
          for (let i=0;i<w.length;i++) {
            const cc=startC+i;
            if (board[r][cc]) {
              if (board[r][cc].letter!==w[i]) { valid=false; break; }
            } else {
              newPlaced.push({r,c:cc,letter:w[i]});
            }
          }
          if (!valid||!newPlaced.length) continue;
          const rackNeeded=newPlaced.map(({letter})=>letter);
          if (!canMakeFrom(rackNeeded.join(''),rackLetters)) continue;
          const val=validatePlacement([...newPlaced],board,false);
          if (val.ok) return { placed:newPlaced, words:val.words };
        }
      }
    }
  }
  return null;
}

// ─── HTP ─────────────────────────────────────────────────────────────────────
const HTP = ({onClose}) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Scrabble Vault</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4><p>Score the most points by placing words on the board.</p>
        <h4>Playing</h4>
        <ul>
          <li>Click a tile in your rack to select it (gold border).</li>
          <li>Click an empty board cell to place it there.</li>
          <li>All tiles in one turn must be in the same row or column.</li>
          <li>First word must cover the ★ centre square.</li>
          <li>Subsequent words must connect to existing tiles.</li>
          <li>Click <b>Play Word</b> to confirm and score.</li>
          <li>Click a placed (unconfirmed) tile to take it back.</li>
        </ul>
        <h4>Special Squares</h4>
        <ul>
          <li style={{color:PREM_COLOR.TW}}><b>TW Triple Word</b> — 3× the word score.</li>
          <li style={{color:PREM_COLOR.DW}}><b>DW Double Word</b> — 2× the word score.</li>
          <li style={{color:PREM_COLOR.TL}}><b>TL Triple Letter</b> — 3× the letter value.</li>
          <li style={{color:PREM_COLOR.DL}}><b>DL Double Letter</b> — 2× the letter value.</li>
        </ul>
        <h4>Bingo!</h4><p>Use all 7 tiles in one turn for +50 bonus points!</p>
        <h4>Exchange / Pass</h4><p>Select tiles and click Exchange to swap them for new ones from the bag, or click Pass to skip.</p>
      </div>
    </div>
  </div>
);

// ─── Tile component ───────────────────────────────────────────────────────────
function Tile({letter,value,selected,preview,onClick,size=36}) {
  const bg = preview ? 'rgba(232,184,0,.3)' : selected ? '#e8b800' : '#f5e6c0';
  const textCol = preview ? '#e8b800' : selected ? '#1a1a0a' : '#2a1a00';
  return (
    <div onClick={onClick} style={{
      width:size, height:size, borderRadius:5, cursor:onClick?'pointer':'default',
      background:bg, border: selected?'2px solid #e8b800':preview?'1.5px dashed rgba(232,184,0,.6)':'1px solid #c8a844',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      boxShadow: selected?'0 0 8px rgba(232,184,0,.6)':'0 1px 3px rgba(0,0,0,.4)',
      position:'relative', userSelect:'none', transition:'all .12s',
      transform: selected?'translateY(-5px)':'none',
    }}>
      <span style={{fontSize:size*.45,fontWeight:'bold',color:textCol,fontFamily:'serif',lineHeight:1}}>{letter==='?'?'*':letter}</span>
      {value!==undefined&&value!==null&&letter!=='?'&&(
        <span style={{position:'absolute',bottom:1,right:2,fontSize:size*.22,fontWeight:'bold',color:textCol,opacity:.8}}>{value}</span>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function initGame() {
  let bag = makeBag();
  const { drawn:pH, bag:b1 } = drawTiles(bag,7); bag=b1;
  const { drawn:aH, bag:b2 } = drawTiles(bag,7); bag=b2;
  return {
    board: Array(15).fill(null).map(()=>Array(15).fill(null)),
    bag, playerRack:pH, aiRack:aH,
    playerScore:0, aiScore:0,
    turn:'player', passes:0, over:false,
    log:['🎮 Game started! Place your first word on the ★ center.'],
  };
}

export default function ScrabbleVault(props) {
  const { onBack, onExit, gameMode, game } = props || {};
  const exit = onBack || onExit || null;
  const isAI = gameMode!=='local';

  const [gs, setGs] = useState(initGame);
  const [placement, setPlacement] = useState([]); // [{r,c,letter,value,rackIdx}]
  const [selected, setSelected] = useState(null);  // rack tile index
  const [exchangeSel, setExchangeSel] = useState(new Set());
  const [mode, setMode] = useState('play'); // play | exchange
  const [msg, setMsg] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [aiThink, setAiThink] = useState(false);

  const reset = () => { setGs(initGame()); setPlacement([]); setSelected(null); setExchangeSel(new Set()); setMode('play'); setMsg(''); };

  const isFirst = gs.board.every(row=>row.every(c=>!c));

  // ── Place a tile on board ─────────────────────────────────────────────────────
  const handleBoardClick = (r, c) => {
    if (gs.turn!=='player'||gs.over) return;
    // Recall placed tile from this cell
    const existingIdx = placement.findIndex(p=>p.r===r&&p.c===c);
    if (existingIdx>=0) {
      setPlacement(prev=>prev.filter((_,i)=>i!==existingIdx));
      setSelected(null); return;
    }
    if (gs.board[r][c]) return; // already has permanent tile
    if (selected===null) return;
    if (placement.some(p=>p.r===r&&p.c===c)) return;

    const rackTile = gs.playerRack[selected];
    if (!rackTile) return;
    const letterValue = TILES[rackTile]?.v ?? 0;
    setPlacement(prev=>[...prev,{r,c,letter:rackTile,value:letterValue,rackIdx:selected}]);
    setSelected(null);
  };

  // ── Confirm word ──────────────────────────────────────────────────────────────
  const handlePlay = () => {
    if (!placement.length) { setMsg('Place some tiles first.'); return; }
    const val = validatePlacement(placement, gs.board, isFirst);
    if (!val.ok) { setMsg(val.msg); return; }

    let totalScore = 0;
    val.words.forEach(({cells,word})=>{
      const newCells = cells.filter(({r,c})=>placement.some(p=>p.r===r&&p.c===c));
      const ws = scoreWord(newCells.map(({r,c,letter})=>({
        r,c,letter,value:TILES[letter]?.v??0,
      })), gs.board);
      const existingSum = cells.filter(({r,c})=>!placement.some(p=>p.r===r&&p.c===c))
        .reduce((s,{letter})=>s+(TILES[letter]?.v??0),0);
      totalScore += ws + existingSum;
    });
    const bingo = placement.length===7 ? 50 : 0;
    totalScore += bingo;

    // Update board
    const newBoard = gs.board.map(row=>[...row]);
    placement.forEach(({r,c,letter})=>{ newBoard[r][c]={letter}; });

    // Update rack
    const usedIndices = new Set(placement.map(p=>p.rackIdx));
    const newRack = gs.playerRack.filter((_,i)=>!usedIndices.has(i));
    let newBag = [...gs.bag];
    const { drawn, bag:remainingBag } = drawTiles(newBag, 7-newRack.length);
    newBag = remainingBag;
    const finalRack = [...newRack, ...drawn];

    const wordList = val.words.map(w=>w.word).join(', ');
    const logMsg = `🧑 You played ${wordList} for ${totalScore} pts${bingo?' + BINGO 🎯':''}`;

    setPlacement([]);
    setSelected(null);
    setMsg('');

    const newGs = {
      ...gs, board:newBoard, bag:newBag,
      playerRack:finalRack, playerScore:gs.playerScore+totalScore,
      turn:'ai', passes:0,
      log:[logMsg,...gs.log].slice(0,14),
    };

    if (!finalRack.length && !newBag.length) {
      setGs({...newGs, over:true, log:[`🧑 You used all tiles! Game over.`,...newGs.log].slice(0,14)});
      return;
    }
    setGs(newGs);
  };

  // ── AI turn ────────────────────────────────────────────────────────────────────
  React.useEffect(()=>{
    if (!isAI || gs.turn!=='ai' || gs.over || aiThink) return;
    setAiThink(true);
    const t = setTimeout(()=>{
      setGs(prev=>{
        if (prev.turn!=='ai'||prev.over) return prev;
        const result = aiPlay(prev.aiRack, prev.board, prev.board.every(r=>r.every(c=>!c)));
        if (!result) {
          // AI passes
          const newPasses = prev.passes+1;
          if (newPasses>=4) return {...prev, over:true, turn:'player', log:['Both players passed twice — game over!',...prev.log].slice(0,14)};
          setAiThink(false);
          return {...prev, turn:'player', passes:newPasses, log:['🤖 AI passes.',...prev.log].slice(0,14)};
        }
        const { placed, words } = result;
        const newBoard = prev.board.map(r=>[...r]);
        placed.forEach(({r,c,letter})=>{ newBoard[r][c]={letter}; });
        const rackCopy=[...prev.aiRack];
        const newRack2=rackCopy.filter(l=>!placed.some(p=>p.letter===l&&(rackCopy.splice(rackCopy.indexOf(l),1),true)));
        const {drawn:d2,bag:b2}=drawTiles(prev.bag,7-newRack2.length);
        let score2=0;
        words.forEach(({cells,word})=>{
          const nc=cells.filter(({r,c})=>placed.some(p=>p.r===r&&p.c===c));
          const ws=scoreWord(nc.map(({r,c,letter})=>({r,c,letter,value:TILES[letter]?.v??0})),prev.board);
          score2+=ws+cells.filter(({r,c})=>!placed.some(p=>p.r===r&&p.c===c)).reduce((s,{letter})=>s+(TILES[letter]?.v??0),0);
        });
        setAiThink(false);
        return {...prev,board:newBoard,bag:b2,aiRack:[...newRack2,...d2],aiScore:prev.aiScore+score2,turn:'player',passes:0,
          log:[`🤖 AI played ${words.map(w=>w.word).join(', ')} for ${score2} pts`,...prev.log].slice(0,14)};
      });
    }, 1200);
    return ()=>{ clearTimeout(t); setAiThink(false); };
  }, [gs.turn, gs.over, isAI]);

  // ── Exchange tiles ─────────────────────────────────────────────────────────────
  const handleExchange = () => {
    if (!exchangeSel.size) { setMode('play'); return; }
    const indices = [...exchangeSel];
    const returning = indices.map(i=>gs.playerRack[i]);
    const newRack = gs.playerRack.filter((_,i)=>!exchangeSel.has(i));
    const newBag = shuffle([...gs.bag, ...returning]);
    const {drawn,bag:b2} = drawTiles(newBag, 7-newRack.length);
    setGs(prev=>({...prev,bag:b2,playerRack:[...newRack,...drawn],turn:'ai',passes:prev.passes+1,
      log:[`🧑 Exchanged ${returning.length} tile(s).`,...prev.log].slice(0,14)}));
    setExchangeSel(new Set()); setMode('play'); setPlacement([]);
  };

  const handlePass = () => {
    const newPasses = gs.passes+1;
    setGs(prev=>({...prev,turn:'ai',passes:newPasses,
      log:['🧑 You passed.',...prev.log].slice(0,14)}));
    setPlacement([]); setSelected(null);
    if (newPasses>=4) setGs(prev=>({...prev,over:true,log:['Both players passed twice — game over!',...prev.log].slice(0,14)}));
  };

  // ── Render board ───────────────────────────────────────────────────────────────
  const cellSize = Math.min(32, Math.floor((typeof window!=='undefined'?Math.min(window.innerWidth-40,500):460)/15));
  const placedMap = useMemo(()=>{const m={};placement.forEach(p=>{m[`${p.r},${p.c}`]=p;});return m;},[placement]);

  return (
    <div className="game-shell" style={{maxWidth:600,margin:'0 auto'}}>
      {showHelp && <HTP onClose={()=>setShowHelp(false)}/>}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🔤'} Scrabble Vault</h2>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button className="bv-button secondary" onClick={()=>setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit&&<button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {gs.over&&<div className="winner-banner">{gs.playerScore>gs.aiScore?`🏆 You Win! ${gs.playerScore}–${gs.aiScore}`:gs.aiScore>gs.playerScore?`🤖 AI Wins! ${gs.aiScore}–${gs.playerScore}`:`⚖️ Draw! ${gs.playerScore} each`}</div>}

      {/* Scores */}
      <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:10,flexWrap:'wrap'}}>
        <div className="bv-card" style={{padding:'6px 18px',textAlign:'center',border:gs.turn==='player'&&!gs.over?'1px solid #e8b800':''}}>
          <div style={{fontSize:10,color:'#888'}}>You{gs.turn==='player'&&!gs.over?' ◀':''}</div>
          <div style={{fontSize:22,color:'#e8b800',fontWeight:'bold'}}>{gs.playerScore}</div>
        </div>
        {isAI&&<div className="bv-card" style={{padding:'6px 18px',textAlign:'center',border:gs.turn==='ai'&&!gs.over?'1px solid #c0392b':''}}>
          <div style={{fontSize:10,color:'#888'}}>🤖 AI{gs.turn==='ai'&&!gs.over?' ◀':''}</div>
          <div style={{fontSize:22,color:'#c0392b',fontWeight:'bold'}}>{gs.aiScore}</div>
        </div>}
        <div style={{alignSelf:'center',fontSize:11,color:'#555'}}>Bag: {gs.bag.length}</div>
      </div>

      {!gs.over&&<div className="turn-indicator">{aiThink?'🤖 AI thinking…':gs.turn==='player'?'🧑 Your turn':'🤖 AI turn'}</div>}
      {msg&&<div style={{padding:'7px 12px',background:'rgba(244,67,54,.1)',border:'1px solid rgba(244,67,54,.3)',borderRadius:7,marginBottom:8,fontSize:12,color:'#f44'}}>{msg}</div>}

      {/* Board */}
      <div style={{overflowX:'auto',marginBottom:12}}>
        <div style={{display:'inline-block',border:'2px solid #2a2a4a',borderRadius:6,overflow:'hidden',boxShadow:'0 0 20px rgba(0,0,0,.4)'}}>
          {gs.board.map((row,r)=>(
            <div key={r} style={{display:'flex'}}>
              {row.map((cell,c)=>{
                const pk=`${r},${c}`,prem=PREMIUM[pk];
                const placed=placedMap[pk];
                const isCentre=r===7&&c===7;
                let bg='#1a1a2e';
                if(prem) bg=PREM_COLOR[prem]+'33';
                if(isCentre&&!cell&&!placed) bg='rgba(232,184,0,.15)';
                return (
                  <div key={c} onClick={()=>handleBoardClick(r,c)}
                    style={{
                      width:cellSize,height:cellSize,
                      background:bg,
                      border:'0.5px solid rgba(255,255,255,.06)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      cursor:!cell&&!placed&&gs.turn==='player'&&selected!==null?'pointer':'default',
                      position:'relative',flexShrink:0,
                    }}>
                    {cell&&!placed&&(
                      <div style={{
                        width:cellSize-4,height:cellSize-4,
                        background:'#f5e6c0',borderRadius:3,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:cellSize*.45,fontWeight:'bold',color:'#2a1a00',fontFamily:'serif',
                      }}>{cell.letter}</div>
                    )}
                    {placed&&(
                      <div style={{
                        width:cellSize-4,height:cellSize-4,
                        background:'rgba(232,184,0,.35)',border:'1.5px dashed #e8b800',
                        borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:cellSize*.45,fontWeight:'bold',color:'#e8b800',fontFamily:'serif',
                      }}>{placed.letter}</div>
                    )}
                    {!cell&&!placed&&prem&&(
                      <div style={{fontSize:Math.max(6,cellSize*.22),color:PREM_COLOR[prem],fontWeight:'bold',textAlign:'center',lineHeight:1}}>{PREM_LABEL[prem]}</div>
                    )}
                    {!cell&&!placed&&isCentre&&!prem&&<span style={{fontSize:cellSize*.4,color:'rgba(232,184,0,.5)'}}>★</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Player rack */}
      {gs.turn==='player'&&!gs.over&&(
        <div>
          <div style={{color:'#888',fontSize:11,marginBottom:8}}>
            Your Tiles ({gs.playerRack.length})
            {mode==='exchange'&&<span style={{color:'#e8b800',marginLeft:8}}>— click tiles to select for exchange</span>}
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            {gs.playerRack.map((letter,i)=>{
              if (placement.some(p=>p.rackIdx===i)) return null;
              const isSel = mode==='play'&&selected===i;
              const isExSel = mode==='exchange'&&exchangeSel.has(i);
              return (
                <Tile key={i} letter={letter} value={TILES[letter]?.v}
                  selected={isSel||isExSel} size={42}
                  onClick={()=>{
                    if(mode==='exchange'){
                      setExchangeSel(prev=>{const n=new Set(prev);n.has(i)?n.delete(i):n.add(i);return n;});
                    } else {
                      setSelected(selected===i?null:i);
                    }
                  }}
                />
              );
            })}
          </div>

          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {mode==='play'&&(
              <>
                {placement.length>0&&<button className="bv-button" onClick={handlePlay}>▶ Play Word</button>}
                {placement.length>0&&<button className="bv-button secondary" onClick={()=>{setPlacement([]);setSelected(null);setMsg('');}}>✕ Recall</button>}
                <button className="bv-button secondary" style={{fontSize:11}} onClick={()=>{setMode('exchange');setPlacement([]);setSelected(null);}}>⇄ Exchange</button>
                <button className="bv-button secondary" style={{fontSize:11}} onClick={handlePass}>⏭ Pass</button>
              </>
            )}
            {mode==='exchange'&&(
              <>
                <button className="bv-button" onClick={handleExchange} disabled={!exchangeSel.size}>Exchange {exchangeSel.size} tile{exchangeSel.size!==1?'s':''}</button>
                <button className="bv-button secondary" onClick={()=>{setMode('play');setExchangeSel(new Set());}}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Log */}
      <div className="bv-card" style={{padding:8,marginTop:12,maxHeight:100,overflowY:'auto'}}>
        {gs.log.map((l,i)=><div key={i} style={{fontSize:11,color:i===0?'#e0e0e0':'#555',marginBottom:2}}>{l}</div>)}
      </div>
    </div>
  );
}
