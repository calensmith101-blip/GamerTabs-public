import { useEffect, useState } from 'react'
import { getGame } from '../lib/games'
import { useOnlineRoom } from '../hooks/useOnlineRoom'
import { playerRoleForRoom } from '../lib/socialUtils'

// ─── Core games ───────────────────────────────────────────────────────────────
import TicTacToe        from '../components/online-games/TicTacToe'
import ConnectFour      from '../components/online-games/ConnectFour'
import DiceDuel         from '../components/online-games/DiceDuel'
import MemoryMatch      from '../components/online-games/MemoryMatch'
import SeaBattle        from '../components/online-games/SeaBattle'
import SnakesAndLadders from '../components/online-games/SnakesAndLadders'
import RoyalDice5       from '../components/online-games/RoyalDice5'
import Checkers         from '../components/online-games/Checkers'
import ChessTrainer     from '../components/online-games/ChessTrainer'
import ColourClash      from '../components/online-games/ColourClash'

// ─── Fully implemented games ──────────────────────────────────────────────────
import DominoDash       from '../components/online-games/DominoDash'
import LudoQuest        from '../components/online-games/LudoQuest'
import MansionMystery   from '../components/online-games/MansionMystery'
import KingdomConquest  from '../components/online-games/KingdomConquest'
import FlagFront        from '../components/online-games/FlagFront'
import MancalaVault     from '../components/online-games/MancalaVault'
import MysteryFaces     from '../components/online-games/MysteryFaces'
import PiratePlunder    from '../components/online-games/PiratePlunder'

// ─── New classic games ────────────────────────────────────────────────────────
import Mastermind       from '../components/online-games/Mastermind'
import HangmanVault     from '../components/online-games/HangmanVault'
import SimonChain       from '../components/online-games/SimonChain'
import TileRush         from '../components/online-games/TileRush'
import UnoRush          from '../components/online-games/UnoRush'
import UnoTeams         from '../components/online-games/UnoTeams'
import UnoNoMercy       from '../components/online-games/UnoNoMercy'
import NimStrike        from '../components/online-games/NimStrike'
import WordVault        from '../components/online-games/WordVault'
import TopVault         from '../components/online-games/TopVault'
import BlackjackVault   from '../components/online-games/BlackjackVault'
import VaultDice        from '../components/online-games/VaultDice'
import ScrabbleVault    from '../components/online-games/ScrabbleVault'
import DepthCharge      from '../components/online-games/DepthCharge'
import VaultRun         from '../components/online-games/VaultRun'
import UnoVault         from '../components/online-games/UnoVault'
import YahtzeeVault     from '../components/online-games/YahtzeeVault'
import TexasHoldemVault from '../components/online-games/TexasHoldemVault'
import VaultCasino      from '../components/online-games/VaultCasino'

// ─── Scaffold games ───────────────────────────────────────────────────────────
import CityTycoon       from '../components/online-games/CityTycoon'
import FarmClaimers     from '../components/online-games/FarmClaimers'
import TriviaBlitz      from '../components/online-games/TriviaBlitz'
import TreasureTrail    from '../components/online-games/TreasureTrail'
import WizardTowers     from '../components/online-games/WizardTowers'
import BackgammonAlley  from '../components/online-games/BackgammonAlley'
import ReversiLockdown  from '../components/online-games/ReversiLockdown'
import StoneWar         from '../components/online-games/StoneWar'
import SoloCards        from '../components/online-games/SoloCards'
import RummyRun         from '../components/online-games/RummyRun'
import Heartbreaker     from '../components/online-games/Heartbreaker'
import ShadowSpades     from '../components/online-games/ShadowSpades'
import CribbageCounter  from '../components/online-games/CribbageCounter'
import Minefield        from '../components/online-games/Minefield'
import ZombieOutbreak   from '../components/online-games/ZombieOutbreak'
import EscapeRoom       from '../components/online-games/EscapeRoom'
import BiohazardLab     from '../components/online-games/BiohazardLab'
import WordQuest        from '../components/online-games/WordQuest'

import ScaffoldGame     from '../components/online-games/ScaffoldGame'

const GAME_MAP = {
  'tictactoe':         TicTacToe,
  'tic-tac-toe':       TicTacToe,
  'connect-four':      ConnectFour,
  'connect4':          ConnectFour,
  'dice-duel':         DiceDuel,
  'memory-match':      MemoryMatch,
  'sea-battle':        SeaBattle,
  'snakes-ladders':    SnakesAndLadders,
  'royal-dice-5':      RoyalDice5,
  'checkers':          Checkers,
  'chess-trainer':     ChessTrainer,
  'colour-clash':      ColourClash,
  'domino-dash':       DominoDash,
  'ludo-quest':        LudoQuest,
  'mansion-mystery':   MansionMystery,
  'kingdom-conquest':  KingdomConquest,
  'flag-front':        FlagFront,
  'mancala-vault':     MancalaVault,
  'mystery-faces':     MysteryFaces,
  'pirate-plunder':    PiratePlunder,
  'mastermind':        Mastermind,
  'hangman-vault':     HangmanVault,
  'simon-chain':       SimonChain,
  'tile-rush':         TileRush,
  'uno-rush':          UnoRush,
  'uno-teams':         UnoTeams,
  'uno-no-mercy':      UnoNoMercy,
  'nim-strike':        NimStrike,
  'word-vault':        WordVault,
  'top-vault':         TopVault,
  'blackjack-vault':   BlackjackVault,
  'vault-dice':        VaultDice,
  'scrabble-vault':    ScrabbleVault,
  'depth-charge':      DepthCharge,
  'vault-run':         VaultRun,
  'uno-vault':         UnoVault,
  'yahtzee-vault':     YahtzeeVault,
  'texas-holdem-vault': TexasHoldemVault,
  'vault-casino':      VaultCasino,
  'city-tycoon':       CityTycoon,
  'farm-claimers':     FarmClaimers,
  'trivia-blitz':      TriviaBlitz,
  'treasure-trail':    TreasureTrail,
  'wizard-towers':     WizardTowers,
  'backgammon-alley':  BackgammonAlley,
  'reversi-lockdown':  ReversiLockdown,
  'stone-war':         StoneWar,
  'solo-cards':        SoloCards,
  'rummy-run':         RummyRun,
  'heartbreaker':      Heartbreaker,
  'shadow-spades':     ShadowSpades,
  'cribbage-counter':  CribbageCounter,
  'minefield':         Minefield,
  'zombie-outbreak':   ZombieOutbreak,
  'escape-room':       EscapeRoom,
  'biohazard-lab':     BiohazardLab,
  'word-quest':        WordQuest,
}

export default function GamePlayPage({ session, navigate, params }) {
  const { gameId, mode, difficulty, roomCode, playerRole, playerCount } = params
  const game = getGame(gameId)
  const [resetKey, setResetKey] = useState(0)
  const isOnline = (mode === 'online' || mode === 'localLive') && !!roomCode
  const onlineRoom = useOnlineRoom(isOnline ? roomCode : null)

  useEffect(() => {
    try {
      const el = document.documentElement
      if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {})
      window.screen?.orientation?.lock?.('landscape').catch(() => {})
    } catch {}
    return () => {
      try {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
        window.screen?.orientation?.unlock?.()
      } catch {}
    }
  }, [])

  if (!game) {
    if (gameId === 'lobby' || gameId === 'room') {
      navigate('friends', {}, { replace: true })
      return null
    }
    return (
      <div className="page">
        <button className="btn-back" onClick={() => navigate('games')}>← Games</button>
        <p className="empty-state">Unknown game: {gameId}</p>
      </div>
    )
  }

  const GameComponent = GAME_MAP[gameId] || ScaffoldGame
  const room = onlineRoom.room
  const effectiveRole = isOnline ? (playerRole && playerRole !== 'spectator' ? playerRole : playerRoleForRoom(room, session?.user?.id)) : playerRole
  const routeSlots = Array.isArray(params?.playerSlots) ? params.playerSlots : []
  const effectiveSlots = isOnline && Array.isArray(room?.state?.playerSlots) ? room.state.playerSlots : routeSlots
  const effectivePlayerCount = mode === 'single'
    ? 1
    : Math.max(2, effectiveSlots.length || Number(playerCount) || 2)

  if (isOnline && onlineRoom.loading) {
    return <div className="page"><p className="loading-block">Joining live room...</p></div>
  }

  if (isOnline && onlineRoom.error) {
    return <div className="page"><button className="btn-back" onClick={() => navigate('friends', { gameId })}>Friends</button><p className="empty-state">{onlineRoom.error}</p></div>
  }

  const sharedProps = {
    roomCode: isOnline ? roomCode : null,
    playerRole: effectiveRole,
    playerSlots: effectiveSlots,
    playerCount:  effectivePlayerCount,
    gameMode:     mode,
    difficulty:   difficulty || 'medium',
    session,
    game,
    onlineRoom: isOnline ? room : null,
    makeMove: isOnline ? onlineRoom.makeMove : null,
    onBack:       () => navigate('games'),
    onSetupBack:  () => navigate('setup', { gameId }),
  }

  return (
    <div className="page play-page pb-20 game-landscape-fullscreen">
      {/* ── Nav bar ─────────────────────────────────────────────────── */}
      <div style={{
        display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
        padding:'8px 12px', marginBottom:4,
        background:'rgba(255,255,255,.03)',
        borderBottom:'1px solid rgba(255,255,255,.06)',
      }}>
        <button onClick={() => navigate('games')} style={{
          padding:'5px 12px', borderRadius:7, fontSize:12, cursor:'pointer',
          background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', color:'#e0e0e0',
        }}>← Lobby</button>
        <button onClick={() => navigate('setup', { gameId })} style={{
          padding:'5px 12px', borderRadius:7, fontSize:12, cursor:'pointer',
          background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', color:'#e0e0e0',
        }}>↩ Setup</button>
        <span style={{ flex:1, fontSize:13, color:'#e8b800', fontWeight:'bold', textAlign:'center', whiteSpace:'nowrap' }}>
          {game.icon} {game.title}
        </span>
        <span style={{ fontSize:11, color:'#555', textTransform:'uppercase' }}>{mode}</span>
        <button onClick={() => setResetKey(k => k+1)} style={{
          padding:'5px 12px', borderRadius:7, fontSize:12, cursor:'pointer',
          background:'rgba(232,184,0,.1)', border:'1px solid rgba(232,184,0,.3)', color:'#e8b800',
        }}>↺ New Game</button>
      </div>

      <div className="play-layout-grid">
        <div className="play-main-panel">
          <GameComponent key={resetKey} {...sharedProps} />
        </div>

      </div>
    </div>
  )
}
