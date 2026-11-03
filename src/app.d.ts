import type { OwnerSession } from "$lib/server/auth/sessions";

declare global {
  namespace App {
    interface Locals {
      owner: OwnerSession | null;
    }
  }
}

export {};
