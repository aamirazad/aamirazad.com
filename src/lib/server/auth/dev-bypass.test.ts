import { describe, expect, it } from "vitest";

import { devBypassOwner } from "./dev-bypass";

const local = new URL("http://127.0.0.1:3000/admin/create");

describe("local auth bypass", () => {
  it("signs loopback requests in when the local flag is set", () => {
    expect(devBypassOwner({ ENVIRONMENT: "local", DEV_AUTH_BYPASS: "true" }, local)).toMatchObject({
      subject: "local-dev",
    });
  });

  it("stays off without the flag", () => {
    expect(devBypassOwner({ ENVIRONMENT: "local" }, local)).toBeNull();
    expect(devBypassOwner({ ENVIRONMENT: "local", DEV_AUTH_BYPASS: "1" }, local)).toBeNull();
  });

  it("never applies to deployed environments or non-loopback hosts", () => {
    for (const ENVIRONMENT of ["preview", "production"]) {
      expect(devBypassOwner({ ENVIRONMENT, DEV_AUTH_BYPASS: "true" }, local)).toBeNull();
    }
    expect(
      devBypassOwner(
        { ENVIRONMENT: "local", DEV_AUTH_BYPASS: "true" },
        new URL("https://aamirazad.com/admin"),
      ),
    ).toBeNull();
  });
});
