
export function isAiMode(value) {
  const joined = Array.isArray(value) ? value.join(" ") : String(value || "")
  const lower = joined.toLowerCase()
  return ["ai","computer","cpu","bot"].some((tag) => lower.includes(tag))
}
