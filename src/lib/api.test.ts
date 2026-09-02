import { describe, expect, it } from "vitest";
import { redactSecrets } from "@/lib/api";

// The message shape a DNS failure produced in production, which put the key in the logs.
const fetchFailure =
  "request to https://translation.googleapis.com/language/translate/v2?key=AIzaSyFAKE0000fake000fake000fake000fake0 failed, reason: getaddrinfo EAI_AGAIN translation.googleapis.com";

describe("redactSecrets", () => {
  it("removes the credential from a failed translation request", () => {
    const safe = redactSecrets(fetchFailure);
    expect(safe).not.toContain("AIzaSyFAKE0000fake000fake000fake000fake0");
    expect(safe).toContain("key=[redacted]");
    // The parts that make the error useful survive.
    expect(safe).toContain("translation.googleapis.com");
    expect(safe).toContain("EAI_AGAIN");
  });

  it("redacts a bare Google key, tokens, and auth headers wherever they appear", () => {
    expect(redactSecrets("leaked AIzaSyFAKE0000fake000fake000fake000fake0 here")).toBe("leaked [redacted] here");
    expect(redactSecrets("https://x.test/a?access_token=abc123&b=2")).toBe("https://x.test/a?access_token=[redacted]&b=2");
    expect(redactSecrets("Authorization: Bearer ya29.abcdefghijklmnop")).toBe("Authorization: [redacted]");
  });

  it("leaves ordinary messages untouched", () => {
    for (const message of ["Unable to open the database file", "Book not found", "key= "]) {
      expect(redactSecrets(message)).toBe(message);
    }
  });
});
