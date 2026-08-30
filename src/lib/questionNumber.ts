export function parseQuestionNumber(num: string): { group: string; sub: string | null } {
  const m = num.trim().match(/^(\d+)\s*\(?\s*([a-zA-Z])\s*\)?\.?$/);
  if (m) return { group: m[1], sub: m[2].toLowerCase() };
  return { group: num.trim(), sub: null };
}
