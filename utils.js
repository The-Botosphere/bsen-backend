export function detectSport(title) {
  const t = title.toLowerCase();

  if (t.includes("softball") || t.includes("wcws") || t.includes("alo")) return "softball";
  if (t.includes("basketball") || t.includes("women's basketball") || t.includes("men's basketball")) return "basketball";
  if (t.includes("gymnastics") || t.includes("maggie") || t.includes("trautman")) return "gymnastics";
  if (t.includes("wrestling")) return "wrestling";
  if (t.includes("baseball")) return "baseball";
  if (t.includes("golf")) return "golf";
  if (t.includes("football") || t.includes("bowl") || t.includes("sooners") || t.includes("championship"))
    return "football";

  return "other";
}

export function cleanText(s) {
  if (!s) return "";
  return s.replace(/\s+/g, " ").trim();
}
