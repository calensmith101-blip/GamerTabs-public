# GamerTabs Multiplayer Setup

## Required environment variables

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

Server/API routes:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET_GAMERTABS`
- `STRIPE_PRICE_ID_GAMERTABS`
- `APP_URL`

## Required Supabase SQL

Run `supabase/gamertabs-commercial-schema.sql` in the Supabase SQL Editor after deploying this update. The script is safe to rerun and now includes:

- `claim_room_seat_safe(room_code, username)` so joining by code, invite, or rematch assigns the player to an actual room seat.
- `join_random_match(game_id, username)` so random match can atomically claim a waiting player room.
- Realtime publication setup for `game_rooms`, `room_members`, `nudges`, and chat tables.

Supabase Realtime must be enabled for `game_rooms` so both players see moves and room joins without refreshing.

## Online-ready games

The online/random/friend menus now only expose games that persist their moves to the live room state:

- Tic Tac Toe
- Connect 4
- Sea Battle
- Chess
- Kingdom Conquest
- City Tycoon

Other games remain playable in local, solo, or AI modes until their boards are wired to shared room state.
