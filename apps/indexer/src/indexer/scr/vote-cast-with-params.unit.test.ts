import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("VoteCastWithParams handlers", () => {
  it.each(["scr/governor.ts", "op/governor.ts"])(
    "%s listens for module ballots",
    (file) => {
      const source = readFileSync(
        path.join(process.cwd(), "src/indexer", file),
        "utf8",
      );
      expect(source).toContain("VoteCastWithParams");
    },
  );
});
