import { describe, expect, test } from "vitest";

import { deduplicateHookArray, deepMerge, mergeMarkerSection } from "../merge.js";

describe("deepMerge", () => {
  test("preserves existing keys when adding new keys", () => {
    expect(deepMerge<{ a: number; b: number; c?: number }>({ a: 1, b: 2 }, { c: 3 })).toEqual({
      a: 1,
      b: 2,
      c: 3
    });
  });

  test("merges nested objects without clobbering siblings", () => {
    expect(
      deepMerge(
        { hooks: { pre: ["x"] } },
        { hooks: { post: ["y"] } } as Partial<{ hooks: { pre?: string[]; post?: string[] } }>
      )
    ).toEqual({
      hooks: {
        pre: ["x"],
        post: ["y"]
      }
    });
  });

  test("replaces arrays atomically", () => {
    expect(deepMerge({ hooks: ["existing"] }, { hooks: ["incoming"] })).toEqual({ hooks: ["incoming"] });
  });
});

describe("deduplicateHookArray", () => {
  test("preserves user entries and skips duplicate hook paths", () => {
    expect(
      deduplicateHookArray(
        ["codewiki/pre.sh", "user/hook.sh"],
        ["codewiki/pre.sh", "codewiki/post.sh"]
      )
    ).toEqual(["codewiki/pre.sh", "user/hook.sh", "codewiki/post.sh"]);
  });
});

describe("mergeMarkerSection", () => {
  test("appends markers on first run", () => {
    expect(mergeMarkerSection("# Existing\nContent", "wiki instructions", false)).toBe(
      "# Existing\nContent\n\n<!-- codewiki:start -->\nwiki instructions\n<!-- codewiki:end -->\n"
    );
  });

  test("skips duplicate marker sections without force", () => {
    const existing = "# Existing\n<!-- codewiki:start -->\nold\n<!-- codewiki:end -->";
    expect(mergeMarkerSection(existing, "new", false)).toBe(existing);
  });

  test("replaces marker content with force=true", () => {
    expect(
      mergeMarkerSection("# Existing\n<!-- codewiki:start -->\nold\n<!-- codewiki:end -->\nAfter", "new", true)
    ).toBe("# Existing\n<!-- codewiki:start -->\nnew\n<!-- codewiki:end -->\nAfter");
  });

  test("handles empty markdown content", () => {
    expect(mergeMarkerSection("", "content", false)).toBe(
      "<!-- codewiki:start -->\ncontent\n<!-- codewiki:end -->\n"
    );
  });

  test("throws when only one marker exists", () => {
    expect(() => mergeMarkerSection("# Existing\n<!-- codewiki:start -->\nold", "new", false)).toThrow(
      /Malformed CodeWiki marker section/
    );
  });

  test("throws when markers are out of order", () => {
    expect(() => mergeMarkerSection("<!-- codewiki:end -->\ntext\n<!-- codewiki:start -->", "new", true)).toThrow(
      /Malformed CodeWiki marker section/
    );
  });
});