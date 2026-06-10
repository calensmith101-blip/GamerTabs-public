# GamerTabs Game Template

Use this when adding a new game without rebuilding the app.

## Fast Path

1. Copy:

```text
src/components/online-games/GenericGameTemplate.jsx
```

2. Rename the copy, for example:

```text
src/components/online-games/MyNewGame.jsx
```

3. In the copied file:

- Rename `GenericGameTemplate` to your component name.
- Replace `createTemplateState()` with the real starting state.
- Replace `playCell()` with the real move/rules logic.
- Keep the `commit(next)` pattern. That is what makes local and live games save through the same path.

## Register The Game

Edit `src/lib/games.js`.

Add a game row to `GAMES`:

```js
{ id: 'my-new-game', title: 'My New Game', icon: 'GT', players: '2-5', type: 'Board', status: 'live', supportsOnline: true, supportsAI: true, supportsLocal: true, desc: 'Short description.' },
```

Add play modes to `GAME_PLAY_MODES`:

```js
'my-new-game': ['ai', 'local'],
```

Online options are added by `supportsOnline: true`; do not add a separate competing online system.

## Add It To The Game Loader

Edit `src/pages/GamePlayPage.jsx`.

Import it:

```js
import MyNewGame from '../components/online-games/MyNewGame'
```

Add it to `GAME_MAP`:

```js
'my-new-game': MyNewGame,
```

## Optional Initial State

Edit `src/lib/roomState.js` if the game needs a specific room starting state for invites/resume:

```js
'my-new-game': () => ({
  players: ['X', 'O'],
  turn: 'X',
  phase: 'playing',
  winner: null,
  message: 'Ready.',
}),
```

If you skip this, GamerTabs uses the default scaffold state.

## Props The App Gives Your Game

Every game component can receive:

```js
{
  roomCode,       // present for live games
  playerRole,     // X, O, P3, P4, P5, or spectator
  playerSlots,    // seat list with human/local/ai/open
  playerCount,
  gameMode,       // ai, local, localLive, online, single
  difficulty,
  session,
  game,
  onlineRoom,
  makeMove,
  onBack,
  onSetupBack,
}
```

## Live Multiplayer Rules

- Use one state object for the whole game.
- Never keep important live progress only in local React state.
- Do moves by creating `next` state and calling `commit(next)`.
- Do not overwrite `playerSlots`, `playerSeats`, `members`, or `setup`.
- Treat `localLive` as live online play.
- Treat `local` as same-device pass-and-play.
- AI players are seats where `slot.kind === 'ai'`.

## Minimum Test Checklist

Run:

```bash
npm run build
```

Then test:

- Play vs AI starts and AI moves.
- Same Device can pass turns on one device.
- Live room creates a room code.
- Second account/device can join the same room code.
- A move on one device appears on the other without refresh.
- Leaving and resuming keeps the same board state.
