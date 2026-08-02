import { version } from "$app/environment";

export function publicPageEtag(contentVersion: string): string {
  return `"${version}-${contentVersion}"`;
}
