import redirects from "./data/legacy-redirects.json";

export const legacyRedirects: Readonly<Record<string, string>> = redirects;

export function legacyRedirectFor(pathname: string): string | undefined {
  return legacyRedirects[pathname];
}
