import sw from "./sw.json";

export type Language = "en" | "sw";
const dictionary: Record<string, string> = sw;
const renderedPhrases = new Map<string, string>();
const patterns = Object.entries(dictionary).filter(([key]) => /\{\d+\}/.test(key))
  .sort(([a], [b]) => b.replace(/\{\d+\}/g, "").length - a.replace(/\{\d+\}/g, "").length)
  .map(([key, translation]) => ({
  expression: new RegExp("^" + key.split(/(\{\d+\})/).map(part => /^\{\d+\}$/.test(part) ? "(.*?)" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("") + "$"),
  translation,
}));

/** Only known interface phrases are translated; names and course content stay intact. */
export function translate<T>(value: T, language: Language): T {
  if (language !== "sw" || typeof value !== "string") return value;
  const key = value.replace(/\s+/g, " ").trim();
  if (!key) return value;
  let translated = Object.hasOwn(dictionary, key) ? dictionary[key] : undefined;
  if (translated === undefined) {
    if (!/\s/.test(key)) return value;
    translated = renderedPhrases.get(key);
  }
  if (translated === undefined) {
    for (const pattern of patterns) {
      const match = pattern.expression.exec(key);
      if (match) { translated = pattern.translation.replace(/\{(\d+)\}/g, (_, index: string) => match[Number(index) + 1]); break; }
    }
    if (translated !== undefined) {
      if (renderedPhrases.size >= 512) renderedPhrases.clear();
      renderedPhrases.set(key, translated);
    }
  }
  if (translated === undefined) return value;
  return value.replace(value.trim(), translated) as T;
}

/** For browser-native alerts emitted outside React components. */
export function translateBrowserMessage(message: string): string {
  return translate(message, typeof document !== "undefined" && document.documentElement.lang === "sw" ? "sw" : "en");
}
