
import React, { useEffect, useMemo, useRef, useState } from "react";
import { isAiMode } from "../../lib/gameMode";

const CATEGORIES = [
  { key: "ones", label: "Ones", section: "upper" },
  { key: "twos", label: "Twos", section: "upper" },
  { key: "threes", label: "Threes", section: "upper" },
  { key: "fours", label: "Fours", section: "upper" },
  { key: "fives", label: "Fives", section: "upper" },
  { key: "sixes", label: "Sixes", section: "upper" },
  { key: "threeKind", label: "Three of a Kind", section: "lower" },
  { key: "fourKind", label: "Four of a Kind", section: "lower" },
  { key: "fullHouse", label: "Full House", section: "lower" },
  { key: "smallStraight", label: "Small Straight", section: "lower" },
  { key: "largeStraight", label: "Large Straight", section: "lower" },
  { key: "yahtzee", label: "Yahtzee", section: "lower" },
  { key: "chance", label: "Chance", section: "lower" },
];

const FACE_MAP = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

function rollDie() {
  return 1 + Math.floor(Math.random() * 6);
}

function makeDice() {
  return Array.from({ length: 5 }, () => ({ value: rollDie(), held: false }));
}

function countsFromValues(values) {
  const counts = Array(7).fill(0);
  values.forEach((value) => {
    counts[value] += 1;
  });
  return counts;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a - b);
}

function hasRun(values, runLength) {
  const uniq = uniqueSorted(values);
  let streak = 1;
  for (let i = 1; i < uniq.length; i += 1) {
    if (uniq[i] === uniq[i - 1] + 1) streak += 1;
    else streak = 1;
    if (streak >= runLength) return true;
  }
  return false;
}

function scoreCategory(category, values) {
  const counts = countsFromValues(values);
  const total = values.reduce((sum, value) => sum + value, 0);
  switch (category) {
    case "ones":
      return counts[1] * 1;
    case "twos":
      return counts[2] * 2;
    case "threes":
      return counts[3] * 3;
    case "fours":
      return counts[4] * 4;
    case "fives":
      return counts[5] * 5;
    case "sixes":
      return counts[6] * 6;
    case "threeKind":
      return counts.some((count) => count >= 3) ? total : 0;
    case "fourKind":
      return counts.some((count) => count >= 4) ? total : 0;
    case "fullHouse":
      return counts.includes(3) && counts.includes(2) ? 25 : 0;
    case "smallStraight":
      return hasRun(values, 4) ? 30 : 0;
    case "largeStraight":
      return hasRun(values, 5) ? 40 : 0;
    case "yahtzee":
      return counts.some((count) => count === 5) ? 50 : 0;
    case "chance":
      return total;
    default:
      return 0;
  }
}

function upperSubtotal(sheet) {
  return ["ones", "twos", "threes", "fours", "fives", "sixes"].reduce(
    (sum, key) => sum + (sheet[key] ?? 0),
    0
  );
}

function bonusValue(sheet) {
  return upperSubtotal(sheet) >= 63 ? 35 : 0;
}

function totalScore(sheet) {
  return CATEGORIES.reduce((sum, category) => sum + (sheet[category.key] ?? 0), 0) + bonusValue(sheet) + (sheet.yahtzeeBonus || 0);
}

function availableCategories(sheet) {
  return CATEGORIES.filter((category) => sheet[category.key] == null);
}

function bestCategoryForValues(sheet, values) {
  const available = availableCategories(sheet);
  if (!available.length) return null;
  const scored = available.map((category) => ({
    key: category.key,
    score: scoreCategory(category.key, values),
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aIndex = CATEGORIES.findIndex((entry) => entry.key === a.key);
    const bIndex = CATEGORIES.findIndex((entry) => entry.key === b.key);
    return aIndex - bIndex;
  });
  return scored[0];
}

function scratchCategory(sheet) {
  const priority = ["ones", "twos", "threes", "chance", "fours", "smallStraight", "threeKind", "fives", "fullHouse", "fourKind", "sixes", "largeStraight", "yahtzee"];
  return priority.find((key) => sheet[key] == null) || availableCategories(sheet)[0]?.key || null;
}

function chooseHeldForAi(values, sheet) {
  const counts = countsFromValues(values);
  const bestUpper = [1, 2, 3, 4, 5, 6]
    .map((value) => ({ value, score: counts[value] * value }))
    .sort((a, b) => b.score - a.score)[0].value;

  if (scoreCategory("yahtzee", values) || scoreCategory("fourKind", values) || scoreCategory("fullHouse", values)) {
    return values.map((value) => value === values[0] || counts[value] >= 2);
  }

  if (scoreCategory("largeStraight", values)) {
    return values.map(() => true);
  }

  if (scoreCategory("smallStraight", values)) {
    const uniq = new Set(uniqueSorted(values));
    return values.map((value) => uniq.has(value));
  }

  return values.map((value) => value === bestUpper || counts[value] >= 2);
}

function blankSheets(playerCount) {
  return Array.from({ length: playerCount }, () => ({ yahtzeeBonus: 0 }));
}

export default function RoyalDice5(props = {}) {
  const aiMode = isAiMode(props);
  const playerCount = aiMode ? 2 : 2;
  const players = useMemo(() => ["You", aiMode ? "AI" : "Player 2"], [aiMode]);
  const [dice, setDice] = useState(makeDice());
  const [rollsLeft, setRollsLeft] = useState(3);
  const [activePlayer, setActivePlayer] = useState(0);
  const [sheets, setSheets] = useState(blankSheets(playerCount));
  const [log, setLog] = useState(["New Yahtzee game started."]);
  const [winner, setWinner] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const aiBusyRef = useRef(false);

  function appendLog(message) {
    setLog((prev) => [message, ...prev].slice(0, 14));
  }

  function resetGame() {
    aiBusyRef.current = false;
    setDice(makeDice().map((die) => ({ ...die, held: false })));
    setRollsLeft(3);
    setActivePlayer(0);
    setSheets(blankSheets(playerCount));
    setLog(["New Yahtzee game started."]);
    setWinner(null);
  }

  function rollDice() {
    if (winner !== null || rollsLeft <= 0) return;
    setDice((prev) =>
      prev.map((die) => (die.held && rollsLeft < 3 ? die : { ...die, value: rollDie() }))
    );
    setRollsLeft((prev) => prev - 1);
  }

  function toggleHold(index) {
    if (winner !== null || rollsLeft === 3 || (aiMode && activePlayer === 1)) return;
    setDice((prev) => prev.map((die, dieIndex) => (dieIndex === index ? { ...die, held: !die.held } : die)));
  }

  function advanceTurn(nextSheets, reason) {
    const nextPlayer = activePlayer === 0 ? 1 : 0;
    const everyoneDone = nextSheets.every((sheet) => availableCategories(sheet).length === 0);

    setSheets(nextSheets);
    appendLog(reason);

    if (everyoneDone) {
      const scores = nextSheets.map((sheet) => totalScore(sheet));
      const maxScore = Math.max(...scores);
      const winnerIndex = scores.indexOf(maxScore);
      setWinner(winnerIndex);
      appendLog(`${players[winnerIndex]} wins with ${maxScore} points.`);
      return;
    }

    setActivePlayer(nextPlayer);
    setDice(makeDice().map((die) => ({ ...die, held: false })));
    setRollsLeft(3);
  }

  function scoreTurn(categoryKey) {
    if (winner !== null || rollsLeft === 3) return;
    const values = dice.map((die) => die.value);
    const score = scoreCategory(categoryKey, values);
    const nextSheets = sheets.map((sheet, index) => {
      if (index !== activePlayer) return sheet;
      const updated = { ...sheet, [categoryKey]: score };
      if (categoryKey !== "yahtzee" && scoreCategory("yahtzee", values) && sheet.yahtzee === 50) {
        updated.yahtzeeBonus = (sheet.yahtzeeBonus || 0) + 100;
      }
      return updated;
    });
    advanceTurn(nextSheets, `${players[activePlayer]} scored ${score} in ${CATEGORIES.find((entry) => entry.key === categoryKey)?.label}.`);
  }


  useEffect(() => {
    if (!aiMode || activePlayer !== 1 || winner !== null || aiBusyRef.current) return undefined;
    aiBusyRef.current = true;

    const timeout = setTimeout(() => {
      let workingDice = Array.from({ length: 5 }, () => ({ value: rollDie(), held: false }));

      for (let rollNumber = 1; rollNumber < 3; rollNumber += 1) {
        const holdMask = chooseHeldForAi(workingDice.map((die) => die.value), sheets[1]);
        workingDice = workingDice.map((die, index) => (holdMask[index] ? die : { value: rollDie(), held: false }));
      }

      const valuesNow = workingDice.map((die) => die.value);
      const best = bestCategoryForValues(sheets[1], valuesNow);
      const chosen = best && best.score > 0 ? best.key : scratchCategory(sheets[1]);

      setDice(workingDice);
      setRollsLeft(0);

      const score = scoreCategory(chosen, valuesNow);
      const nextSheets = sheets.map((sheet, index) => {
        if (index !== 1) return sheet;
        const updated = { ...sheet, [chosen]: score };
        if (chosen !== "yahtzee" && scoreCategory("yahtzee", valuesNow) && sheet.yahtzee === 50) {
          updated.yahtzeeBonus = (sheet.yahtzeeBonus || 0) + 100;
        }
        return updated;
      });

      advanceTurn(nextSheets, `AI scored ${score} in ${CATEGORIES.find((entry) => entry.key === chosen)?.label}.`);
      aiBusyRef.current = false;
    }, 800);

    return () => clearTimeout(timeout);
  }, [activePlayer, aiMode, sheets, winner]);


  const values = dice.map((die) => die.value);
  const currentSheet = sheets[activePlayer];
  const currentPreview = Object.fromEntries(
    availableCategories(currentSheet).map((category) => [category.key, scoreCategory(category.key, values)])
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 text-white">
      <div className="rounded-3xl border border-red-900/50 bg-[#120708] p-4 shadow-[0_0_30px_rgba(120,0,0,0.15)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-wide text-red-200">Royal Dice 5</h2>
            <p className="text-sm text-slate-400">Yahtzee style: roll up to three times, hold dice, then score one category.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-xl border border-red-700/50 bg-black/30 px-3 py-2 text-sm" onClick={() => setShowRules((v) => !v)}>
              {showRules ? "Hide Rules" : "How to Play"}
            </button>
            <button className="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-white" onClick={resetGame}>
              New Game
            </button>
          </div>
        </div>

        {showRules && (
          <div className="mb-4 rounded-2xl border border-red-900/40 bg-black/30 p-4 text-sm text-red-50">
            <div className="font-bold text-red-200">Rules</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
              <li>Roll up to three times on your turn.</li>
              <li>After the first roll, click dice to hold or release them.</li>
              <li>Score exactly one empty category each turn.</li>
              <li>Upper-section bonus is +35 at 63 or more.</li>
              <li>Game ends when every category is filled for every player.</li>
            </ul>
          </div>
        )}

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {players.map((player, index) => {
            const sheet = sheets[index];
            return (
              <div key={player} className={`rounded-2xl border p-4 ${activePlayer === index ? "border-red-700 bg-[#1a0b0d]" : "border-slate-800 bg-[#0b0b12]"}`}>
                <div className="text-sm text-slate-400">{player}</div>
                <div className="mt-1 text-2xl font-black">{totalScore(sheet)}</div>
                <div className="mt-2 text-xs text-slate-400">Upper: {upperSubtotal(sheet)} | Bonus: {bonusValue(sheet)} | Yahtzee Bonus: {sheet.yahtzeeBonus || 0}</div>
              </div>
            );
          })}
          <div className="rounded-2xl border border-slate-800 bg-[#0b0b12] p-4">
            <div className="text-sm text-slate-400">Turn</div>
            <div className="mt-1 text-xl font-black text-red-200">{winner === null ? players[activePlayer] : `${players[winner]} wins`}</div>
            <div className="mt-2 text-sm text-slate-400">Rolls left: {rollsLeft}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr,1.15fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0b0b12] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-red-200">Dice Tray</div>
                <button
                  className="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={rollDice}
                  disabled={winner !== null || rollsLeft <= 0 || (aiMode && activePlayer === 1)}
                >
                  Roll Dice
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {dice.map((die, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleHold(index)}
                    className={`rounded-2xl border p-3 text-center ${die.held ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-black/30"} ${rollsLeft === 3 || (aiMode && activePlayer === 1) ? "cursor-default" : ""}`}
                  >
                    <div className="text-5xl leading-none">{FACE_MAP[die.value]}</div>
                    <div className="mt-2 text-sm font-semibold">{die.value}</div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">{die.held ? "Held" : "Free"}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0b0b12] p-4">
              <div className="text-sm font-semibold text-red-200">Turn log</div>
              <div className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
                {log.map((entry, index) => (
                  <div key={`${entry}-${index}`} className="rounded-xl border border-slate-800 bg-black/30 px-3 py-2 text-slate-300">
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0b0b12] p-4">
            <div className="mb-3 text-sm font-semibold text-red-200">Score Sheet</div>
            <div className="space-y-2">
              {["upper", "lower"].map((section) => (
                <div key={section} className="space-y-2">
                  <div className="pt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{section === "upper" ? "Upper Section" : "Lower Section"}</div>
                  {CATEGORIES.filter((category) => category.section === section).map((category) => {
                    const filled = currentSheet[category.key] != null;
                    return (
                      <button
                        key={category.key}
                        type="button"
                        onClick={() => scoreTurn(category.key)}
                        disabled={winner !== null || activePlayer === 1 && aiMode || rollsLeft === 3 || filled}
                        className={`grid w-full grid-cols-[1.2fr,0.7fr,0.6fr] items-center rounded-xl border px-3 py-2 text-left ${
                          filled ? "border-slate-800 bg-slate-950/70 opacity-80" : "border-red-900/30 bg-[#1a0b0d] hover:border-red-700/60"
                        }`}
                      >
                        <span className="font-medium">{category.label}</span>
                        <span className="text-center text-sm text-slate-400">{filled ? currentSheet[category.key] : currentPreview[category.key]}</span>
                        <span className="text-right text-xs uppercase tracking-wide text-slate-500">{filled ? "Scored" : "Use"}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-red-900/30 bg-[#1a0b0d] p-4 text-sm text-slate-300">
              <div className="font-semibold text-red-200">Current dice</div>
              <div className="mt-2">{values.join(" • ")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
