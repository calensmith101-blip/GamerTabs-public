CITY TYCOON — Complete Design Specification
GamerTab: Black Vault Edition
Version 2.0 — Copilot Implementation Reference
---
OVERVIEW
City Tycoon is a 2–6 player property-trading board game.
Players buy districts, build outposts, and charge rent until opponents go broke.
All names, cards, and mechanics are original. No copyrighted content.
Currency symbol: ⬡ (hex credit)
Starting cash per player: ⬡1,500
Pass BOOT UP salary: ⬡200
---
PART 1 — THE BOARD (40 SPACES)
Spaces numbered 0–39, moving clockwise.
Four corners at positions 0, 10, 20, 30.
Nine regular spaces between each pair of corners.
Complete space list
```
POS  TYPE        NAME                DISTRICT    BUY    NOTES
───  ─────────── ──────────────────  ──────────  ─────  ──────────────────────────────
 0   corner      BOOT UP             —           —      Collect ⬡200 when passing/landing
 1   property    Scrapyard Row       ruins        ⬡60
 2   property    Dead End Alley      ruins        ⬡60
 3   event       OUTBREAK EVENT      —           —      Draw top card from event deck
 4   property    Cargo Docks         wharf       ⬡100
 5   property    Warehouse Row       wharf       ⬡100
 6   property    Dockyard Gate       wharf       ⬡120
 7   transport   Metro Hub           —           ⬡200
 8   property    Steel Works         foundry     ⬡140
 9   event       OUTBREAK EVENT      —           —      Draw top card
10   corner      QUARANTINE          —           —      Safe zone / in custody
11   property    Iron Quarter        foundry     ⬡140
12   utility     Power Grid          —           ⬡150
13   property    Blast Furnace       foundry     ⬡160
14   property    Neon Strip          grid        ⬡180
15   transport   Freight Station     —           ⬡200
16   property    Data Corridor       grid        ⬡180
17   property    Voltage Line        grid        ⬡200
18   tax         ARMS LEVY           —           —      Pay ⬡100 flat OR 10% cash on hand
19   property    Glass Tower         spire       ⬡220
20   corner      DEAD ZONE           —           —      Free rest — no penalty
21   property    Helix Block         spire       ⬡220
22   property    The Spire           spire       ⬡240
23   utility     Water Treatment     —           ⬡150
24   property    Rooftop Terrace     heights     ⬡260
25   transport   Harbor              —           ⬡200
26   property    Sky Lounge          heights     ⬡260
27   event       OUTBREAK EVENT      —           —      Draw top card
28   property    The Pinnacle        heights     ⬡280
29   property    Castle Gate         citadel     ⬡300
30   corner      VIRUS TRAP          —           —      Go directly to QUARANTINE
31   transport   Airfield            —           ⬡200
32   event       OUTBREAK EVENT      —           —      Draw top card
33   tax         OUTBREAK FEE        —           —      Pay flat ⬡75, no alternative
34   property    Fortified Keep      citadel     ⬡300
35   property    The Stronghold      citadel     ⬡320
36   event       OUTBREAK EVENT      —           —      Draw top card
37   property    Shadow District     vault       ⬡350
38   property    Black Market        vault       ⬡350
39   event       OUTBREAK EVENT      —           —      Draw top card
```
Space count verification:
Corners: 4 (pos 0, 10, 20, 30)
Properties: 22 (pos 1,2,4,5,6,8,11,13,14,16,17,19,21,22,24,26,28,29,34,35,37,38)
Transports: 4 (pos 7,15,25,31)
Utilities: 2 (pos 12,23)
Events: 6 (pos 3,9,27,32,36,39)
Taxes: 2 (pos 18,33)
Total: 4+22+4+2+6+2 = 40 ✓
---
PART 2 — DISTRICTS (COLOUR GROUPS)
Eight original districts. Each has a distinct colour, 2 or 3 properties,
a building cost, and a rent table across 6 levels.
Building levels are named:
0 = Unimproved
1 = Outpost
2 = Bunker
3 = Stronghold
4 = Fortress
5 = COMPOUND (replaces all four buildings visually)
District 1 — THE RUINS
Colour: Deep crimson (#7a0000 / #b00000)
Properties: 2
Building cost per level: ⬡50
Board positions: 1, 2
Property	Buy	Level 0	Level 1	Level 2	Level 3	Level 4	Level 5
Scrapyard Row	⬡60	⬡2	⬡10	⬡30	⬡90	⬡160	⬡250
Dead End Alley	⬡60	⬡4	⬡20	⬡60	⬡180	⬡320	⬡450
Group bonus: If player owns both Ruins properties with zero buildings,
base rent doubles (⬡4 / ⬡8 respectively). Bonus removed once any building placed.
Mortgage value: ⬡30 each.
---
District 2 — THE WHARF
Colour: Deep navy (#003d7a / #0066cc)
Properties: 3
Building cost per level: ⬡50
Board positions: 4, 5, 6
Property	Buy	Level 0	Level 1	Level 2	Level 3	Level 4	Level 5
Cargo Docks	⬡100	⬡6	⬡30	⬡90	⬡270	⬡400	⬡550
Warehouse Row	⬡100	⬡6	⬡30	⬡90	⬡270	⬡400	⬡550
Dockyard Gate	⬡120	⬡8	⬡40	⬡100	⬡300	⬡450	⬡600
Group bonus: Own all 3 with zero buildings → base rent doubles.
Mortgage values: ⬡50 / ⬡50 / ⬡60.
---
District 3 — THE FOUNDRY
Colour: Rust orange (#7a3800 / #c05a00)
Properties: 3
Building cost per level: ⬡100
Board positions: 8, 11, 13
Property	Buy	Level 0	Level 1	Level 2	Level 3	Level 4	Level 5
Steel Works	⬡140	⬡10	⬡50	⬡150	⬡450	⬡625	⬡750
Iron Quarter	⬡140	⬡10	⬡50	⬡150	⬡450	⬡625	⬡750
Blast Furnace	⬡160	⬡12	⬡60	⬡180	⬡500	⬡700	⬡900
Group bonus: Own all 3 with zero buildings → base rent doubles.
Mortgage values: ⬡70 / ⬡70 / ⬡80.
---
District 4 — THE GRID
Colour: Electric purple (#4a007a / #7a00cc)
Properties: 3
Building cost per level: ⬡100
Board positions: 14, 16, 17
Property	Buy	Level 0	Level 1	Level 2	Level 3	Level 4	Level 5
Neon Strip	⬡180	⬡14	⬡70	⬡200	⬡550	⬡750	⬡950
Data Corridor	⬡180	⬡14	⬡70	⬡200	⬡550	⬡750	⬡950
Voltage Line	⬡200	⬡16	⬡80	⬡220	⬡600	⬡800	⬡1000
Group bonus: Own all 3 with zero buildings → base rent doubles.
Mortgage values: ⬡90 / ⬡90 / ⬡100.
---
District 5 — THE SPIRE
Colour: Toxic green (#007a1a / #00cc2a)
Properties: 3
Building cost per level: ⬡150
Board positions: 19, 21, 22
Property	Buy	Level 0	Level 1	Level 2	Level 3	Level 4	Level 5
Glass Tower	⬡220	⬡18	⬡90	⬡250	⬡700	⬡875	⬡1050
Helix Block	⬡220	⬡18	⬡90	⬡250	⬡700	⬡875	⬡1050
The Spire	⬡240	⬡20	⬡100	⬡300	⬡750	⬡925	⬡1100
Group bonus: Own all 3 with zero buildings → base rent doubles.
Mortgage values: ⬡110 / ⬡110 / ⬡120.
---
District 6 — THE HEIGHTS
Colour: Gold/amber (#7a6200 / #ccaa00)
Properties: 3
Building cost per level: ⬡150
Board positions: 24, 26, 28
Property	Buy	Level 0	Level 1	Level 2	Level 3	Level 4	Level 5
Rooftop Terrace	⬡260	⬡22	⬡110	⬡330	⬡800	⬡975	⬡1150
Sky Lounge	⬡260	⬡22	⬡110	⬡330	⬡800	⬡975	⬡1150
The Pinnacle	⬡280	⬡24	⬡120	⬡360	⬡850	⬡1025	⬡1200
Group bonus: Own all 3 with zero buildings → base rent doubles.
Mortgage values: ⬡130 / ⬡130 / ⬡140.
---
District 7 — THE CITADEL
Colour: Blood rose/magenta (#6a007a / #aa00cc)
Properties: 3
Building cost per level: ⬡200
Board positions: 29, 34, 35
Property	Buy	Level 0	Level 1	Level 2	Level 3	Level 4	Level 5
Castle Gate	⬡300	⬡26	⬡130	⬡390	⬡900	⬡1100	⬡1275
Fortified Keep	⬡300	⬡26	⬡130	⬡390	⬡900	⬡1100	⬡1275
The Stronghold	⬡320	⬡28	⬡150	⬡450	⬡1000	⬡1200	⬡1400
Group bonus: Own all 3 with zero buildings → base rent doubles.
Mortgage values: ⬡150 / ⬡150 / ⬡160.
---
District 8 — THE VAULT
Colour: Shadow silver (#3a3a4e / #606080)
Properties: 2
Building cost per level: ⬡200
Board positions: 37, 38
Property	Buy	Level 0	Level 1	Level 2	Level 3	Level 4	Level 5
Shadow District	⬡350	⬡35	⬡175	⬡500	⬡1100	⬡1300	⬡1500
Black Market	⬡350	⬡35	⬡175	⬡500	⬡1100	⬡1300	⬡1500
Group bonus: Own both with zero buildings → base rent doubles.
Mortgage values: ⬡175 each.
---
PART 3 — TRANSPORT STATIONS (4)
Positions: 7 (Metro Hub), 15 (Freight Station), 25 (Harbor), 31 (Airfield)
Purchase price: ⬡200 each
Mortgage value: ⬡100 each
No buildings allowed on transport spaces.
Rent scales by how many stations the same player owns:
Stations owned by that player	Rent charged
1	⬡25
2	⬡50
3	⬡100
4	⬡200
Rule: If a player lands on a transport and the owner also owns all 4,
the landing player pays ⬡200 with no option to bargain.
---
PART 4 — UTILITIES / INDUSTRY (2)
Positions: 12 (Power Grid), 23 (Water Treatment)
Purchase price: ⬡150 each
Mortgage value: ⬡75 each
No buildings allowed on utility spaces.
Rent is calculated from the LANDING PLAYER'S dice roll total:
Utilities owned by same player	Rent multiplier
1	dice × 4
2	dice × 10
Example: Landing player rolled 7. Owner has both utilities → rent = ⬡70.
If a utility is mortgaged, no rent is charged.
---
PART 5 — TAX SPACES
ARMS LEVY (position 18)
The landing player pays tax. They have ONE choice:
Option A: Pay a flat ⬡100 to the bank.
Option B: Pay 10% of their current cash on hand (rounded down, minimum ⬡10).
The player picks whichever they prefer.
OUTBREAK FEE (position 33)
The landing player pays ⬡75 flat to the bank. No choice, no alternative.
---
PART 6 — CORNER SPACES
BOOT UP (position 0)
Each time a player's token passes over or lands on BOOT UP, they collect ⬡200
from the bank immediately. This is called the "salary."
Exception: Players sent directly to QUARANTINE via the VIRUS TRAP
do NOT collect salary — they do not pass BOOT UP to get there.
QUARANTINE (position 10)
Two states:
STATE A — Just Visiting:
Player lands on position 10 by normal movement.
No penalty. Sit, wait for next turn as normal.
STATE B — In Custody:
Player was sent here by landing on VIRUS TRAP (position 30)
or by drawing the "Viral Outbreak" event card.
While In Custody, at the start of each of their turns:
Option 1: Pay ⬡50 to the bank → leave QUARANTINE, roll and move normally.
Option 2: Roll the dice. If doubles are rolled → leave QUARANTINE,
advance by that roll, no salary unless passing BOOT UP.
If not doubles → remain In Custody. Turn ends.
Maximum 3 turns In Custody. On the 3rd turn, MUST pay ⬡50 to leave
regardless of roll.
While In Custody: Player CAN still collect rent from owned properties.
Player CANNOT build or mortgage during In Custody turns (pre-roll phase skipped).
Player CANNOT initiate trades while In Custody.
DEAD ZONE (position 20)
No effect. Player rests here. No rent, no penalty, no collection.
Sometimes called a "free space." Nothing happens. Next turn proceeds normally.
VIRUS TRAP (position 30)
Player lands here → immediately move token to QUARANTINE (position 10).
Enter In Custody state. Do NOT collect salary. Do NOT roll again.
Turn ends immediately upon arriving at QUARANTINE.
---
PART 7 — BUILDING RULES
Prerequisite
A player may only build on a district's properties if they own
ALL properties in that district. Example: The Foundry has 3 properties.
Player must own Steel Works, Iron Quarter, AND Blast Furnace before
placing any outpost on any of them.
Even Building Rule (mandatory)
Buildings must be placed and removed as evenly as possible across
all properties within a district.
Detailed rule:
Before placing a building, identify the building count on each property
in the district.
The new building MUST go on a property that has the fewest buildings
in the district.
If multiple properties are tied for fewest, the player may choose which
one to build on.
A property may never have 2 or more buildings more than any other property
in the same district.
Example with 3-property district (levels A=2, B=1, C=1):
ALLOWED: build on B (→ A=2, B=2, C=1) or build on C (→ A=2, B=1, C=2)
NOT ALLOWED: build on A (→ A=3, B=1, C=1 — difference of 2)
Compound rule:
A player may only build a Compound (level 5) on a property when ALL
properties in that district have reached level 4 (Fortress).
Then the Compound follows the same even rule — build Compounds one at a time,
must add to the property with the lowest number of Compounds.
Selling Buildings (for mortgage or cash)
Buildings must be sold as evenly as possible (reverse of even build rule).
Sell from the property with the MOST buildings first.
If tied, player chooses.
Sell-back rate: 50% of build cost per building level (rounded down).
Example: Level built at ⬡100 cost → sell back for ⬡50.
Building Supply (physical token limit)
Total outpost tokens available: 32 (shared across all players)
Total Compound tokens available: 12 (shared across all players)
If the supply of outpost tokens runs out, no further outposts may be placed
until tokens are freed by selling or bankruptcy.
If compound tokens run out, no further compounds may be placed.
This creates strategic building timing pressure.
When buildings can be placed
Only during the PRE-ROLL PHASE of the player's own turn.
Not mid-turn, not during other players' turns, not while In Custody.
---
PART 8 — PROPERTY PURCHASE & AUCTION
Standard Purchase
When a player lands on an unowned property:
They are shown the property card (name, price, rent table, district).
They may BUY at the listed price. Payment immediate, deed awarded.
They may DECLINE to buy.
Auction (when purchase is declined)
If a player declines to buy a property they land on, that property
goes immediately to auction.
Auction rules:
Auctioneer starts with an opening call at ⬡1 (not the listed price).
Bidding proceeds clockwise starting with the NEXT player (not the one who declined).
The player who declined MAY also bid.
Each player may raise the current bid by any amount, or PASS.
Once a player passes, they may not re-enter that auction.
Bidding continues until only one player remains (all others have passed).
The winning bidder pays their bid immediately and receives the deed.
If every player (including the decliner) passes without any bid:
the property returns to the bank. It remains unowned until someone lands
on it again.
A player may not bid more than their current cash total.
Auction triggered by SHADOW BROKER event card
The holder of a Shadow Broker card may at any time (including during their
own pre-roll phase) trigger an auction for any ONE unowned bank property.
Opening bid: 50% of the listed price (rounded down).
Otherwise auction rules are identical. Card discarded after use.
---
PART 9 — MORTGAGE RULES
Taking a Mortgage
Player may mortgage any property they own during their PRE-ROLL PHASE.
The property must have ZERO buildings. If buildings exist, all must be sold first.
Mortgage value = 50% of purchase price (rounded down).
Player receives mortgage value from the bank.
The property deed is "flipped" (marked mortgaged in state: mortgaged: true).
While mortgaged: landing player owes NO rent. Owner receives nothing.
A mortgaged property cannot be built on.
Lifting a Mortgage
Player pays the bank: mortgage value × 110% (rounded up).
Example: Mortgage value ⬡70 → lift cost ⬡77.
Once lifted, the property is active again and rent resumes.
Selling a Property Back to the Bank
Properties can be sold back to the bank at any time during PRE-ROLL PHASE:
Unimproved (or fully stripped): sell at 50% of purchase price.
This is equivalent to mortgaging and then the bank retiring the deed.
Sold properties become unowned and will re-enter play when a player lands on them.
Buildings must be sold first before selling the land.
Mortgaging During Bankruptcy
If a player cannot pay a debt:
They must first sell all buildings (50% return).
Then mortgage properties (50% of purchase price).
If still unable to pay after all buildings sold and all properties mortgaged:
player is bankrupt.
Bankruptcy
When a player cannot pay a debt (rent, tax, event card payment) and has
no buildings to sell, no properties to mortgage, and no cash:
If owed to ANOTHER PLAYER: all deeds transfer to that player
at their current mortgage status. That player takes all without payment.
The receiving player must immediately pay the bank 10% of each mortgage
value for mortgaged deeds they received (to recognise them).
If owed to THE BANK: all deeds return to the bank as unowned.
Tokens, buildings, and cash are removed from play.
The bankrupt player is eliminated. Game continues with remaining players.
---
PART 10 — TURN STRUCTURE
Phase 1: PRE-ROLL (active player only, before rolling)
Player may perform any number of these actions in any order:
Build outposts/compounds on eligible districts
Sell buildings back to bank
Mortgage unimproved properties
Lift mortgages on owned properties
Offer a trade to any other player (see Trade Rules)
Play a held Shadow Broker event card
Player presses ROLL when ready (or a timer elapses after X seconds if implemented).
Phase 2: ROLL
Two six-sided dice are rolled.
Values displayed with animation.
DOUBLES CHECK: if die1 === die2, set doublesFlag = true for this turn.
TRIPLE DOUBLES CHECK: if this is the player's third consecutive doubles roll,
they go directly to QUARANTINE (In Custody). Turn ends immediately. Do not move.
Phase 3: MOVE
Token advances clockwise by (die1 + die2) spaces.
If token passes or lands on position 0 (BOOT UP): immediately collect ⬡200.
Exception: do not collect when being sent to QUARANTINE via VIRUS TRAP.
Animate token movement step by step (one space per tick).
Phase 4: RESOLVE SPACE
Act on the space the token landed on:
BOOT UP (0): Collect ⬡200 (already done in move phase). No further action.
Property (unowned): Show buy/auction prompt.
Property (owned by self): No action.
Property (owned by other, not mortgaged): Charge rent. Calculate per table.
Property (owned by other, mortgaged): No rent. No action.
Transport (unowned): Show buy/auction prompt.
Transport (owned by self): No action.
Transport (owned by other): Charge rent per station count table.
Utility (unowned): Show buy/auction prompt.
Utility (owned by self): No action.
Utility (owned by other): Charge rent (dice total × multiplier).
QUARANTINE — Just Visiting: No action.
VIRUS TRAP (30): Move token to pos 10. Enter In Custody. End turn.
DEAD ZONE (20): No action.
OUTBREAK EVENT: Draw and resolve top event card.
ARMS LEVY (18): Show choice — pay ⬡100 flat OR 10% of cash. Player selects.
OUTBREAK FEE (33): Deduct ⬡75. No choice.
Phase 5: END TURN
Check for bankruptcy (cash < 0 after all forced liquidation attempts).
If doublesFlag is true AND this was not a triple doubles turn:
→ Player rolls again immediately. Return to Phase 2.
If doublesFlag is false: pass turn to next player clockwise.
Reset doublesFlag.
Quarantine Turn (special turn structure for In Custody players)
Phase 1 (PRE-ROLL): SKIPPED. Player may not build or trade while In Custody.
Phase 2 (QUARANTINE DECISION):
Show three buttons: [Pay ⬡50 and Leave] [Roll for Doubles] [View Board]
If Pay: deduct ⬡50, exit In Custody, proceed to normal Roll phase.
If Roll: roll dice. If doubles → exit In Custody, advance by roll total, resolve space.
If not doubles → increment custodyTurns counter. If custodyTurns >= 3,
force pay ⬡50 on the next turn regardless.
Phase 3: Only if exiting QUARANTINE. Otherwise end turn.
Phase 4: Resolve if moved.
Phase 5: End turn (no doubles re-roll bonus for the doubles used to escape).
---
PART 11 — TRADE RULES
During their PRE-ROLL PHASE, the active player may propose a trade to any
other single player. Trade can include:
Cash (any amount from either party)
Property deeds (any owned properties, mortgaged or not)
Held event cards (Shadow Broker only)
Combinations of the above
The receiving player may accept or counter-offer.
No trade may be forced. Both players must agree.
Mortgaged properties transfer at their current state; the new owner
immediately owes the bank 10% of mortgage value per mortgaged deed received.
No future promises are binding (e.g., "I'll pay you next turn" — only
immediate transfers are valid).
---
PART 12 — TWENTY OUTBREAK EVENT CARDS
Deck composition: 20 cards, shuffled at game start.
When a player lands on OUTBREAK EVENT (positions 3, 9, 27, 32, 36, 39),
they draw the top card, read it aloud (or have it animated), and
immediately resolve the effect. Card goes to discard pile.
When deck empties, reshuffle discard to form new deck.
SHADOW BROKER cards are held, not immediately resolved.
```
CARD  TITLE                   TYPE       EFFECT
────  ──────────────────────  ─────────  ─────────────────────────────────────────────────────────────────────────
  1   Bunker Cache Found      positive   Collect ⬡50 from the bank.

  2   Black Market Deal       positive   Collect ⬡30 from each other player in the game.
                                         Players who cannot pay give their remaining cash.

  3   Outbreak Contained      positive   Advance your token directly to BOOT UP (position 0).
                                         Collect ⬡200 salary as you arrive.

  4   Survivor Bounty         positive   Count your owned properties.
                                         If you own ZERO properties: collect ⬡200 from bank.
                                         If you own ONE or more: collect ⬡50 from bank.

  5   Scrap Metal Windfall    positive   Count your owned district properties (not transports/utilities).
                                         Collect ⬡15 per property owned.

  6   Arms Cache Discovered   positive   Collect ⬡100 from the bank.

  7   Evacuation Bonus        positive   Count the total building levels across all your properties.
                                         (A property at level 3 contributes 3.)
                                         Collect ⬡25 per building level owned.

  8   Power Grid Offline      positive   All utility rent (Power Grid + Water Treatment)
                                         is suspended until the END of this player's next turn.
                                         Players landing on utilities during this window pay nothing.

  9   Structural Collapse     negative   Count the total building levels across all your properties.
                                         Pay ⬡40 per building level to the bank.
                                         If you have no buildings: pay nothing.

 10   Viral Outbreak          negative   Pay ⬡50 to the bank.
                                         Then move your token directly to QUARANTINE.
                                         Enter In Custody. Turn ends after payment.
                                         Do NOT collect salary.

 11   Supply Line Disrupted   negative   Pay ⬡100 to the bank.

 12   Armed Raid              negative   Pay 10% of your current cash to the bank.
                                         Rounded down. Minimum payment ⬡10.
                                         If you have less than ⬡10: pay all remaining cash.

 13   Contamination Warning   negative   Move your token BACK 3 spaces from its current position.
                                         Resolve whatever space you land on normally
                                         (including buying/paying rent/paying tax).
                                         Moving back past BOOT UP does NOT collect salary.

 14   Infrastructure Tax      negative   Count how many transport stations you own.
                                         Pay ⬡50 per station to the bank.
                                         If you own no stations: pay nothing.

 15   Emergency Lockdown      negative   You lose your next turn entirely.
                                         Set a flag: skipNextTurn = true.
                                         On what would be your next turn: turn is passed over with
                                         a brief notification. No roll, no move, no pre-roll phase.
                                         The skip uses up your next regular turn, not a quarantine turn.

 16   Rat Infestation         negative   Identify the nearest RUINS property ahead of you
                                         in the clockwise direction (positions 1 and 2).
                                         Advance your token to that property.
                                         If that property is owned by another player:
                                         pay DOUBLE the current rent owed (based on building level).
                                         If it is unowned or yours: no rent. May buy if unowned.

 17   Blackout Zone Spreads   negative   If you own any properties with at least one building:
                                         find the property you own with the FEWEST buildings
                                         (minimum 1). Remove one building level from it.
                                         The building token returns to the general supply.
                                         Sell-back credit is NOT given — the building is lost.
                                         If you own no buildings: no effect.

 18   Shadow Broker           special    Keep this card in your hand. Do not discard yet.
                                         At any time during your own PRE-ROLL PHASE on any future turn,
                                         you may play this card to force one unowned bank property
                                         of your choice to go to immediate auction.
                                         Opening bid: 50% of its listed purchase price (rounded down).
                                         All players including you may bid.
                                         Normal auction rules apply. Discard this card after use.
                                         Only one Shadow Broker card in the deck.

 19   Faction War             neutral    Count building levels for all players.
                                         Identify the player with the MOST total building levels.
                                         Identify the player with the FEWEST total building levels
                                         (excluding any player at exactly zero — they are exempt).
                                         The highest-level player pays ⬡100 to the lowest-level player.
                                         If tied for most: each tied player pays ⬡50 each to the lowest.
                                         If tied for fewest (non-zero): split the received amount.
                                         If only one player has buildings: no effect.

 20   Dead Zone Protocol      neutral    ALL players immediately move their tokens to DEAD ZONE (position 20).
                                         No player collects salary for this forced move.
                                         For the next FULL ROUND (every player takes one full turn):
                                         no rent may be charged or collected from any property or transport.
                                         Utilities are also suspended during the moratorium.
                                         After the full round ends, rent resumes normally.
                                         Event cards drawn during the moratorium still resolve normally.
```
---
PART 13 — PLAYER TOKENS (6–8 concepts)
Each token has a name, visual archetype, suggested icon/silhouette,
a colour scheme, and an idle animation suggestion.
```
TOKEN 1 — THE RAT
  Archetype:   Urban survivor, scavenger
  Silhouette:  Small hunched rodent, long tail
  Colour:      Deep red (#cc1111), dark shadow (#440000)
  Icon emoji:  🐀
  Glow colour: rgba(200,17,17,.8)
  Idle anim:   Rapid small shake/twitch every 3 seconds
  Lore:        "Knows every tunnel. Owns nothing. Takes everything."

TOKEN 2 — IRON WRAITH
  Archetype:   Cyber ghost, digital phantom
  Silhouette:  Translucent humanoid figure, pixelated edges
  Colour:      Electric blue (#2255cc), ghost white (#aabbff)
  Icon emoji:  👻
  Glow colour: rgba(34,85,204,.8)
  Idle anim:   Slow fade in/out opacity pulse (ethereal)
  Lore:        "Deleted from every registry. Still owns half the city."

TOKEN 3 — VIPER
  Archetype:   Predator, infiltrator
  Silhouette:  Serpent coiled around a circuit board
  Colour:      Toxic green (#00aa33), deep black (#001108)
  Icon emoji:  🐍
  Glow colour: rgba(0,170,51,.8)
  Idle anim:   Slow coiling rotation, tongue flick
  Lore:        "Strikes without warning. Never shows its hand."

TOKEN 4 — THE WARDEN
  Archetype:   Authority figure, enforcer
  Silhouette:  Armored officer with baton, wide-brimmed hat
  Colour:      Steel amber (#cc8800), dark slate (#332200)
  Icon emoji:  ⛓
  Glow colour: rgba(204,136,0,.8)
  Idle anim:   Slow rhythmic stomp (weight-shifting)
  Lore:        "Runs QUARANTINE. Everyone pays, eventually."

TOKEN 5 — PHANTOM
  Archetype:   Mystery, unknown origin
  Silhouette:  Formless smoke figure with hollow eyes
  Colour:      Deep violet (#9900cc), shadow black (#1a0022)
  Icon emoji:  🔮
  Glow colour: rgba(153,0,204,.8)
  Idle anim:   Wispy smoke particle effect rising upward
  Lore:        "No record of entry. No record of exit."

TOKEN 6 — BREACH DRONE
  Archetype:   Machine intelligence, automaton
  Silhouette:  Compact hovering drone with sensor array
  Colour:      Cyan (#00aaaa), dark teal (#001a1a)
  Icon emoji:  🤖
  Glow colour: rgba(0,170,170,.8)
  Idle anim:   Slight hover bob, scanner beam sweeping
  Lore:        "Automated. Ruthless. Calculating your net worth."

TOKEN 7 — THE BOSS
  Archetype:   Old money, crime lord
  Silhouette:  Stylized figure in trench coat, briefcase with skull clasp
  Colour:      Silver-grey (#888888), deep charcoal (#222233)
  Icon emoji:  💼
  Glow colour: rgba(136,136,136,.7)
  Idle anim:   Slow confident sway, brief card shuffle gesture
  Lore:        "The deal was already done before you sat down."

TOKEN 8 — VAULT MEDIC
  Archetype:   Field surgeon, opportunist healer
  Silhouette:  Hazmat suit figure, red cross on chest visor
  Colour:      Blood rose (#cc0044), sterile white (#ffeeee)
  Icon emoji:  ⚕
  Glow colour: rgba(204,0,68,.8)
  Idle anim:   Checking a wrist readout, brief injection gesture
  Lore:        "Cures for a price. Everything has a price."
```
Token SVG concept: each token is a 44×44 SVG circle with
a radial gradient (lighter at top-left, darker at bottom-right),
an inner ring detail, a top-left highlight ellipse, and a centred emoji/icon.
Active player token has an animated outer ring that pulses at 1.5s interval.
---
PART 14 — VISUAL DESIGN SYSTEM
Colour palette
```
--bv-void:       #020203   Board outer background
--bv-abyss:      #050508   Board surface
--bv-surface:    #0f0f16   Space background (unowned)
--bv-surface-2:  #14141d   Space background (hover)
--bv-metal:      #22222e   UI panels, sidebars
--bv-metal-2:    #2d2d3d   Card headers, active panels

--bv-red:        #cc1111   Primary accent — borders, highlights
--bv-red-hot:    #ff4444   Glow text, alerts
--bv-red-glow:   rgba(200,16,16,.5)

--bv-gold:       #c9a227   Credits, luxury spaces, titles
--bv-gold-glow:  rgba(201,162,39,.4)

--bv-green:      #2e7d32   Positive events, owned indicators
--bv-text:       #e8e8ec   Primary text
--bv-muted:      #808096   Secondary text, labels
```
Board space visual anatomy
Each board space is an SVG `<g>` containing:
BACKGROUND RECT
Fill: --bv-surface for properties, special fills for event/tax/corner spaces.
Stroke: 1px rgba(200,16,16,.2) on all sides.
DISTRICT COLOUR STRIP
A solid rectangle showing the district's colour.
Width/height: 10px thick.
Placement depends on which side of the board the space is on:
Bottom row spaces: strip at TOP of space (full width, 10px tall)
Right column spaces: strip at LEFT of space (full height, 10px wide)
Top row spaces: strip at BOTTOM of space
Left column spaces: strip at RIGHT of space
No strip for non-property spaces (event, tax, transport, utility, corner).
SPACE NAME TEXT
Font: monospace, uppercase, 6.5–8px depending on name length.
Color: matches district text color for properties; muted white for specials.
Wrapped to 2 lines max.
PRICE TEXT (properties only)
Bottom of space, small, gold color: "⬡60"
BUILDING PIPS
Tiny icons showing current building level (0–5 dots or a compound icon).
Positioned near the bottom, replacing price when buildings exist.
OWNERSHIP MARKER DOT
8px circle in top corner, colored to match the owning player's token color.
Not shown if unowned.
SELECTED HIGHLIGHT
When a space is tapped/clicked: rgba overlay + red border glow.
Corner space designs
BOOT UP (pos 0, bottom-left):
Background: linear-gradient(135deg, #001800, #002800)
Border: 1px solid rgba(0,200,0,.3)
Icon: 🚀 (large, centred)
Text: "BOOT UP" + "Collect ⬡200"
Glow: subtle green ambient
QUARANTINE (pos 10, bottom-right):
Background: linear-gradient(135deg, #100010, #180018)
Border: 1px solid rgba(140,0,200,.3)
Icon: 🏚 (large)
Text: "QUARANTINE" + "Safe / In Custody"
Diagonal line from corner to corner in rgba(140,0,200,.15)
DEAD ZONE (pos 20, top-right):
Background: linear-gradient(135deg, #100000, #180000)
Border: 1px solid rgba(100,100,100,.3)
Icon: ☠ (large)
Text: "DEAD ZONE" + "Free Rest"
VIRUS TRAP (pos 30, top-left):
Background: linear-gradient(135deg, #280000, #380000)
Border: 2px solid rgba(200,16,16,.5)
Icon: ☣ (large, glowing red)
Text: "VIRUS TRAP" + "→ QUARANTINE"
Animated: very slow pulsing red border
Event card visual
Card background: linear-gradient(160deg, #1a0000, #0a0000)
Card border: 2px solid var(--bv-red)
Card shadow: 0 0 20px rgba(200,16,16,.4), 0 0 50px rgba(200,16,16,.2)
Title font: monospace, uppercase, 13px, bold, color var(--bv-red-hot)
Title shadow: 0 0 8px rgba(200,16,16,.6)
Effect text: 12px, color var(--bv-text-2)
Card back: dark purple with ☣ watermark pattern, "OUTBREAK EVENT" text
Animation on draw: card slides in from off-screen top, slight bounce on landing,
scales to 1.0 from 0.7, duration 400ms ease-out
Positive cards: border tints to green (rgba(0,160,0,.5))
Negative cards: standard red border
Neutral cards: border tints to gold (rgba(201,162,39,.5))
Special (Shadow Broker): border tints to purple (rgba(140,0,200,.6))
Building tokens visual concept
OUTPOST (levels 1–4 represented as stacked spikes):
1 outpost: small red triangle/spike pointing upward, 8px
2 outposts: two spikes
3 outposts: three spikes
4 outposts: four spikes arranged in a 2×2 grid
Each spike: fill var(--bv-red), glow: 0 0 4px rgba(200,16,16,.6)
COMPOUND (level 5):
A single taller glowing red tower icon replacing the 4 spikes.
Glow: 0 0 8px rgba(200,16,16,.9), 0 0 16px rgba(200,16,16,.4)
Subtle animation: slow intensity pulse
Dice visual
Each die: 54×54px SVG rect, border-radius 12px
Fill: linear-gradient(160deg, #22222e, #1a1a25, #25252f)
Border: 1.5px solid rgba(200,16,16,.5)
Shadow: 0 0 8px rgba(200,16,16,.4)
Pips: filled circles, fill #ee2222, glow: 0 0 4px #ff4444
Top sheen: light gradient overlay (rgba white, 6% opacity)
Rolling animation: CSS shake keyframe for 700ms then lands on result
Money/Credits visual
Credit bills for various denominations, distinguished by colour tint:
⬡500 — deep violet tint
⬡100 — deep navy tint
⬡50  — dark green tint
⬡20  — amber tint
⬡10  — rust tint
⬡5   — dark grey tint
⬡1   — near-black tint
All bills share: dark background, hex glyph watermark, "BLACK VAULT CREDIT" text,
denomination in large glowing numerals, series number footer.
In the digital version, cash is shown as a numeric counter with the ⬡ prefix.
Transactions animate: number counts up or down with a brief colour flash
(green for gains, red for losses).
---
PART 15 — LAYOUT SPECIFICATION
Desktop layout (min-width: 960px)
```
┌────────────────────────────────────────────────────────────────────────┐
│  GAMETABLE: BLACK VAULT                          [Settings] [End Game]  │ ← header 48px
├──────────────┬─────────────────────────────────┬───────────────────────┤
│              │                                 │                       │
│  PLAYER      │     BOARD (SVG, max 560px)      │  ACTION PANEL         │
│  SIDEBAR     │     Square, centred in area     │                       │
│  200px       │                                 │  ┌─────────────────┐  │
│  ──────────  │  Board aspect ratio: 1:1        │  │ Phase Indicator │  │
│  Each player │  Scrolls if viewport too small  │  │ BUILD→ROLL→LAND │  │
│  panel:      │                                 │  └─────────────────┘  │
│  - Token     │                                 │  ┌─────────────────┐  │
│  - Name      │                                 │  │   Dice Panel    │  │
│  - ⬡ Cash   │                                 │  │  [d1]   [d2]    │  │
│  - Property  │                                 │  │  [  ROLL DICE ] │  │
│    dots      │                                 │  └─────────────────┘  │
│              │                                 │  ┌─────────────────┐  │
│  Active      │                                 │  │  Phase Actions  │  │
│  player      │                                 │  │  (contextual)   │  │
│  glows red   │                                 │  └─────────────────┘  │
│              │                                 │  ┌─────────────────┐  │
│              │  [Player 1's turn — ROLL PHASE] │  │ Property Detail │  │
│              │  ────────────────────────────── │  │ (slide-in panel)│  │
│              │                                 │  └─────────────────┘  │
├──────────────┴─────────────────────────────────┴───────────────────────┤
│  Game log: "Player 2 rolled 9 → landed on The Spire → paid ⬡900 rent" │ ← log 32px
└────────────────────────────────────────────────────────────────────────┘
```
Mobile layout (max-width: 600px)
```
┌──────────────────────────────┐
│ 🐀 Player 1 · BUILD PHASE    │ ← top bar 44px, current player + phase
│ ⬡1,340   [Skip to Roll]      │
├──────────────────────────────┤
│                              │
│     BOARD (full width,       │ ← board fills full width
│     aspect-ratio: 1/1,       │    pinch to zoom supported
│     touch events for         │    tap a space to see detail
│     space selection)         │
│                              │
├──────────────────────────────┤
│ [BUILD] [TRADE] [MORTGAGE]   │ ← quick action chips (pre-roll phase)
│                              │    hidden during roll/move phases
├──────────────────────────────┤
│  Phase: ROLL                 │ ← action drawer, 220px tall
│  ┌──────┐  ┌──────┐         │    pulls up with slide animation
│  │  4   │  │  3   │  = 7   │
│  └──────┘  └──────┘         │
│  [    ▶ ROLL DICE    ]       │
├──────────────────────────────┤
│ [P1 🐀] [P2 👻] [P3 🐍] [P4]│ ← mini player strip 48px
│ ⬡1340  ⬡980  ⬡1200  ⬡850  │    tap to expand player details
└──────────────────────────────┘
```
Phase indicator (5 steps)
A thin row of 5 segments above the dice panel:
[BUILD] → [ROLL] → [MOVE] → [LAND] → [END]
Completed phases: red fill
Active phase: red glow, animated pulse
Pending phases: dark grey
Labels: 8px monospace, uppercase, letterSpacing 1px
Property detail panel
Slides in from right on desktop, slides up from bottom on mobile.
Triggered when a player taps/clicks a space or when they land on a property.
Contents:
Property name (large, white)
District colour strip + district name
Owner indicator (coloured dot + player name, or "Unowned")
Current rent (highlighted based on building level)
Full rent table (all 6 levels, current highlighted)
Building cost per level
Mortgage value
Action buttons (contextual):
BUY (if unowned, player can afford it, it's their turn)
BUILD (if owned by active player, full district, can afford, pre-roll phase)
MORTGAGE (if owned, no buildings, pre-roll phase)
SELL BUILDING (if has buildings, pre-roll phase)
CLOSE (always)
Overlay/modal order (z-index guidance)
```
1  Board base              z: 1
2  Token layer             z: 50
3  Space selection glow    z: 60
4  Property detail panel   z: 200
5  Dice roll overlay       z: 300
6  Event card overlay      z: 400   (full screen semi-opaque backdrop)
7  Auction overlay         z: 500
8  Trade overlay           z: 500
9  Bankruptcy overlay      z: 600
10 Alert/toast messages    z: 700
```
---
PART 16 — GAME DATA SHAPE (reference only, not final code)
```
GameState {
  phase:          'setup' | 'build' | 'roll' | 'move' | 'land' | 'auction' | 'event' | 'end'
  currentTurn:    number          // index into players array
  round:          number
  doublesCount:   number          // resets each turn, max 3
  lastRoll:       [number, number]
  noRentRounds:   number          // countdown for Dead Zone Protocol
  utilityFreeEnd: number | null   // turn number when Power Grid Offline expires

  players: [
    {
      id:            string
      name:          string
      tokenId:       string       // 'rat' | 'wraith' | 'viper' | 'warden' | 'phantom' | 'drone' | 'boss' | 'medic'
      tokenColor:    string
      position:      number       // 0–39
      cash:          number
      inCustody:     boolean
      custodyTurns:  number       // 0–3 while In Custody
      skipNextTurn:  boolean
      isEliminated:  boolean
      holdingCards:  string[]     // event card IDs being held (e.g. ['shadow_broker'])
    }
  ]

  properties: {
    [boardPosition: number]: {
      pos:        number
      ownerId:    string | null
      buildings:  number          // 0–5
      mortgaged:  boolean
    }
  }

  eventDeck:    string[]          // ordered array of card IDs (shuffled)
  discardPile:  string[]
  activeEvent:  EventCard | null  // currently displayed card
  auction:      AuctionState | null
  trade:        TradeState | null
  log:          string[]          // human-readable event log entries
}
```
---
PART 17 — RENT CALCULATION ALGORITHM
```
function calculateRent(state, boardPos, landingDiceTotal):

  space = SPACES[boardPos]
  if space.type !== 'property' and space.type !== 'transport' and space.type !== 'utility':
    return 0

  prop = state.properties[boardPos]
  if prop.ownerId is null: return 0
  if prop.mortgaged: return 0
  if state.noRentRounds > 0: return 0

  owner = getPlayer(state, prop.ownerId)

  if space.type === 'transport':
    ownedStations = countOwnedByPlayer(state, owner.id, 'transport')
    return TRANSPORT_RENTS[ownedStations]  // 25/50/100/200

  if space.type === 'utility':
    if state.utilityFreeEnd is not null and state.currentTurn <= state.utilityFreeEnd:
      return 0
    ownedUtils = countOwnedByPlayer(state, owner.id, 'utility')
    multiplier = (ownedUtils === 2) ? 10 : 4
    return landingDiceTotal * multiplier

  // District property
  district = DISTRICTS[space.district]
  buildingLevel = prop.buildings  // 0–5

  // Group bonus: level 0, owner has all in group, no buildings anywhere in group
  if buildingLevel === 0:
    ownsAll = ownerHasFullDistrict(state, owner.id, space.district)
    anyBuildings = districtHasBuildings(state, space.district)
    if ownsAll and not anyBuildings:
      return district.rents[space.name][0] * 2  // doubled base

  return district.rents[space.name][buildingLevel]
```
---
PART 18 — EVEN BUILDING VALIDATION
```
function canBuildOn(state, playerId, boardPos):
  prop = state.properties[boardPos]
  if prop.ownerId !== playerId: return false
  if prop.mortgaged: return false
  if prop.buildings >= 5: return false   // already at Compound

  space = SPACES[boardPos]
  district = space.district
  districtPositions = DISTRICTS[district].positions

  // Player must own the entire district
  ownsAll = districtPositions.every(p => state.properties[p].ownerId === playerId)
  if not ownsAll: return false

  // Even building rule: target must have fewest (or tied for fewest) buildings
  targetLevel = prop.buildings
  minLevel = Math.min(...districtPositions.map(p => state.properties[p].buildings))
  if targetLevel > minLevel: return false

  // Check player can afford
  player = getPlayer(state, playerId)
  buildCost = DISTRICTS[district].buildingCost
  if player.cash < buildCost: return false

  // Check building supply
  if prop.buildings < 4:   // placing an outpost
    outpostsInPlay = countAllOutpostsInPlay(state)
    if outpostsInPlay >= 32: return false
  else:                    // placing a Compound (replacing 4 outposts)
    compoundsInPlay = countAllCompoundsInPlay(state)
    if compoundsInPlay >= 12: return false

  return true
```
---
End of City Tycoon Design Specification v2.0