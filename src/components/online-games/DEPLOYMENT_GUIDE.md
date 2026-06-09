# GamerTab: Black Vault — Complete Deployment Guide

---

## 1. FILE TREE

Copy every file below into your project at the exact path shown.

```
src/
├── App.jsx                                    ← REPLACE
├── supabaseClient.js                          ← KEEP existing
├── style.css                                  ← KEEP existing, APPEND style-additions-2.css to bottom
│
├── lib/
│   ├── games.js                               ← REPLACE
│   ├── scoring.js                             ← REPLACE
│   ├── aiPlayers.js                           ← NEW
│   ├── roomState.js                           ← NEW
│   └── nudges.js                              ← NEW
│
├── hooks/
│   └── useOnlineGame.js                       ← REPLACE
│
├── components/
│   ├── AuthPanel.jsx                          ← REPLACE
│   ├── NudgePanel.jsx                         ← NEW
│   ├── OnlineGameFrame.jsx                    ← NEW
│   ├── LocalGameFrame.jsx                     ← NEW
│   ├── AIGameFrame.jsx                        ← NEW
│   └── online-games/
│       ├── ScaffoldGame.jsx                   ← REPLACE
│       ├── TicTacToe.jsx                      ← KEEP existing (still works)
│       ├── ConnectFour.jsx                    ← KEEP existing
│       ├── DiceDuel.jsx                       ← KEEP existing
│       ├── MemoryMatch.jsx                    ← KEEP existing
│       ├── SeaBattle.jsx                      ← KEEP existing
│       ├── SnakesAndLadders.jsx               ← KEEP existing
│       ├── RoyalDice5.jsx                     ← KEEP existing
│       ├── ColourClash.jsx                    ← NEW (scaffold)
│       ├── Checkers.jsx                       ← NEW (scaffold)
│       ├── ChessTrainer.jsx                   ← NEW (scaffold)
│       ├── DominoDash.jsx                     ← NEW (scaffold)
│       ├── LudoQuest.jsx                      ← NEW (scaffold)
│       ├── MansionMystery.jsx                 ← NEW (scaffold)
│       ├── KingdomConquest.jsx                ← NEW (scaffold)
│       ├── CityTycoon.jsx                     ← NEW (scaffold)
│       ├── FlagFront.jsx                      ← NEW (scaffold)
│       ├── FarmClaimers.jsx                   ← NEW (scaffold)
│       ├── MysteryFaces.jsx                   ← NEW (scaffold)
│       ├── TriviaBlitz.jsx                    ← NEW (scaffold)
│       ├── WordQuest.jsx                      ← NEW (scaffold)
│       ├── TreasureTrail.jsx                  ← NEW (scaffold)
│       ├── PiratePlunder.jsx                  ← NEW (scaffold)
│       ├── WizardTowers.jsx                   ← NEW (scaffold)
│       ├── MancalaVault.jsx                   ← NEW (scaffold)
│       ├── BackgammonAlley.jsx                ← NEW (scaffold)
│       ├── ReversiLockdown.jsx                ← NEW (scaffold)
│       ├── StoneWar.jsx                       ← NEW (scaffold)
│       ├── SoloCards.jsx                      ← NEW (scaffold)
│       ├── RummyRun.jsx                       ← NEW (scaffold)
│       ├── Heartbreaker.jsx                   ← NEW (scaffold)
│       ├── ShadowSpades.jsx                   ← NEW (scaffold)
│       ├── CribbageCounter.jsx                ← NEW (scaffold)
│       ├── Minefield.jsx                      ← NEW (scaffold)
│       ├── ZombieOutbreak.jsx                 ← NEW (scaffold)
│       ├── EscapeRoom.jsx                     ← NEW (scaffold)
│       └── BiohazardLab.jsx                   ← NEW (scaffold)
│
└── pages/
    ├── HomePage.jsx                           ← REPLACE
    ├── GamesPage.jsx                          ← REPLACE
    ├── GameSetupPage.jsx                      ← REPLACE
    ├── GamePlayPage.jsx                       ← REPLACE
    └── ProfilePage.jsx                        ← REPLACE
```

---

## 2. SQL — Run in Supabase SQL Editor

Go to: **Supabase Dashboard → SQL Editor → New Query**

Paste the full contents of `supabase_schema.sql` and click **Run**.

This creates/updates:
- `profiles` table + RLS + auto-create trigger on sign-up
- `game_rooms` table (adds missing columns if they exist) + RLS + realtime
- `nudges` table + RLS + realtime
- `match_history` table + RLS

**Run once only.** All statements use `if not exists` so they're safe to re-run.

---

## 3. NPM PACKAGES

No new packages are required if you already have:
```
@supabase/supabase-js
react
react-dom
vite
@vitejs/plugin-react
```

If starting fresh, install:
```bash
npm install @supabase/supabase-js
npm install react react-dom
npm install --save-dev vite @vitejs/plugin-react
```

Optionally add react-router-dom if you want URL-based routing later:
```bash
npm install react-router-dom
```
(The current build uses internal state routing and does NOT require it.)

---

## 4. ENVIRONMENT VARIABLES

Make sure your `.env` (or `.env.local`) has:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Your `src/supabaseClient.js` should reference these:
```js
import { createClient } from '@supabase/supabase-js'
export default createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 5. SUPABASE REALTIME — Enable for Tables

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Enable realtime for: `game_rooms` and `nudges`

Or run this SQL (included in schema above):
```sql
alter publication supabase_realtime add table game_rooms;
alter publication supabase_realtime add table nudges;
```

---

## 6. TEST CHECKLIST

Run locally with `npm run dev` then test each item:

### Auth
- [ ] Register with email + password → profile auto-created
- [ ] Sign in → home page appears (no login shown when signed in)
- [ ] Wrong password → error message shown
- [ ] Sign out from profile page → returns to login

### Home Page
- [ ] Stats card shows username, points, crowns, level
- [ ] Win/loss counts shown
- [ ] Crown progress bar renders
- [ ] "Play Games" button → games page
- [ ] "My Profile" button → profile page
- [ ] "Invites" button → nudge panel

### Games Page
- [ ] All 36 games visible in grid
- [ ] Search by name works
- [ ] Category filter works
- [ ] Each card shows players, type, mode dots
- [ ] Clicking a game → setup page for that game

### Game Setup
- [ ] Mode selection (Online / vs AI / Local) shown
- [ ] AI mode → difficulty selector → "Start Game"
- [ ] Local mode → "Start Local Game"
- [ ] Online → Create Room → generates code → play page
- [ ] Online → Join Room → enter code → joins as O
- [ ] Full room (both players) shows error

### Online Games (on two different devices/browsers)
- [ ] TicTacToe: moves sync in realtime, turns enforced
- [ ] Connect Four: pieces drop, wins detected
- [ ] Dice Duel: both roll, round resolves, 5 round match
- [ ] Memory Match: cards flip/match, turn advances
- [ ] Sea Battle: setup phase works, shots sync
- [ ] Snakes & Ladders: dice rolls sync, snake/ladder events
- [ ] Royal Dice 5: rolls, holds, scoring categories

### AI Games
- [ ] TicTacToe vs AI: AI responds, minimax on hard
- [ ] Connect Four vs AI: AI drops pieces
- [ ] Snakes & Ladders vs AI: bot takes turns automatically

### Local Mode
- [ ] Two-player local game works without network
- [ ] Turn banner updates each player

### Nudges
- [ ] 🔔 FAB visible on all pages except play
- [ ] Creating a room and clicking "Nudge players" sends broadcast
- [ ] Second user sees toast notification
- [ ] Accepting nudge → setup page with prefilled room code
- [ ] Declining removes nudge from list

### Profile
- [ ] Username editable and saves
- [ ] Stats show correctly
- [ ] Sign out works

---

## 7. GIT COMMANDS

```bash
# Stage all changes
git add -A

# Commit
git commit -m "feat: full page refactor — home/games/setup/play/profile, nudge system, AI frames, 36 games"

# Push to main (or your branch)
git push origin main
```

---

## 8. VERCEL REDEPLOY

### Option A — Auto (if Vercel is connected to your repo)
After `git push`, Vercel will redeploy automatically. Watch the build at:
**vercel.com → your project → Deployments**

### Option B — Manual deploy via Vercel CLI
```bash
# Install CLI if needed
npm i -g vercel

# Deploy
vercel --prod
```

### Option C — Vercel Dashboard
1. Go to **vercel.com → your project**
2. Click **Redeploy** on the latest deployment
3. Select **Redeploy with existing build cache** or **Redeploy** (fresh)

### Environment Variables on Vercel
Make sure these are set in **Vercel → Project → Settings → Environment Variables**:
```
VITE_SUPABASE_URL      = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
```

---

## 9. BUILD CHECK (before deploying)

```bash
npm run build
```

Should output `dist/` with no errors. Common issues:
- **Missing import**: check file exists at exact path
- **JSX in .js file**: rename to .jsx
- **Undefined variable**: check lib imports match export names

---

## 10. KNOWN SCAFFOLD BEHAVIOUR

Games with status `'scaffold'` (29 of 36) display:
> "🛠️ Full rules in development — basic turn-based play enabled"

They still support:
- Online room state via Supabase
- Realtime sync
- Turn enforcement (X then O)
- Reset
- Player role display

To implement a scaffold game fully: replace the contents of its `.jsx` file
with a real implementation. The import path in `GamePlayPage.jsx` stays the same.

---

## SUPPORT & NEXT STEPS

1. **Match history**: hook `recordGameResult()` from `scoring.js` into each live game's win handler
2. **Full AI for remaining games**: add to `aiPlayers.js` and wire via `AIGameFrame`
3. **Avatar upload**: add file upload to `ProfilePage` → Supabase Storage
4. **Firebase push notifications**: add to `nudges.js` alongside the Supabase path
5. **Leaderboard**: query `profiles` ordered by `points desc`
