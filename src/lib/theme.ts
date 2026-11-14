export type ThemePreference = "system" | "light" | "dark";
export const THEME_KEY = "semjid:theme";
let memoryPreference: ThemePreference | null = null;
export function parseTheme(value: string | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}
export function readTheme(): ThemePreference {
  if (memoryPreference) return memoryPreference;
  if (typeof window === "undefined") return "system";
  try { return parseTheme(localStorage.getItem(THEME_KEY)); } catch { return "system"; }
}
export function applyTheme(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
export function chooseTheme(preference: ThemePreference) {
  try { localStorage.setItem(THEME_KEY, preference); memoryPreference = null; }
  catch { memoryPreference = preference; }
  applyTheme(preference);
  window.dispatchEvent(new Event("semjid:theme"));
}
export function subscribeTheme(notify: () => void) {
  const changed = () => { applyTheme(readTheme()); notify(); };
  const stored = (event: StorageEvent) => { if (event.key === THEME_KEY || event.key === null) { memoryPreference = null; changed(); } };
  const media = matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", stored);
  window.addEventListener("semjid:theme", changed);
  media.addEventListener("change", changed);
  return () => { window.removeEventListener("storage", stored); window.removeEventListener("semjid:theme", changed); media.removeEventListener("change", changed); };
}
// Runs before hydration. Only a validated display preference is read.
export const THEME_BOOTSTRAP_SCRIPT = `(function(){var p='system';try{var v=localStorage.getItem('semjid:theme');if(v==='light'||v==='dark')p=v;}catch(e){}var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';})();`;
