import { describe, expect, it } from "vitest";
import { sidebarPageCount, sidebarPageForIndex, sidebarPageSlice } from "./sidebarPage";

describe("sidebar pages", () => {
  const rows = Array.from({ length: 20 }, (_, index) => index);

  it("splits a long list into pages of eight", () => {
    expect(sidebarPageCount(20)).toBe(3);
    expect(sidebarPageSlice(rows, 1)).toEqual({
      page: 1,
      totalPages: 3,
      start: 1,
      end: 8,
      items: [0, 1, 2, 3, 4, 5, 6, 7],
    });
    expect(sidebarPageSlice(rows, 3)).toMatchObject({
      page: 3,
      start: 17,
      end: 20,
      items: [16, 17, 18, 19],
    });
  });

  it("keeps a short list on one page", () => {
    expect(sidebarPageCount(0)).toBe(1);
    expect(sidebarPageSlice([1, 2], 4)).toMatchObject({ page: 1, totalPages: 1, items: [1, 2] });
  });

  it("finds the page that contains a selected row", () => {
    expect(sidebarPageForIndex(-1)).toBe(1);
    expect(sidebarPageForIndex(0)).toBe(1);
    expect(sidebarPageForIndex(8)).toBe(2);
  });
});
