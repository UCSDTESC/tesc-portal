export const SIDEBAR_PAGE_SIZE = 8;

export function sidebarPageCount(total: number, pageSize = SIDEBAR_PAGE_SIZE) {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
}

export function sidebarPageForIndex(index: number, pageSize = SIDEBAR_PAGE_SIZE) {
  if (index < 0) return 1;
  return Math.floor(index / pageSize) + 1;
}

export function sidebarPageSlice<T>(items: T[], page: number, pageSize = SIDEBAR_PAGE_SIZE) {
  const totalPages = sidebarPageCount(items.length, pageSize);
  const current = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (current - 1) * pageSize;
  return {
    page: current,
    totalPages,
    start: items.length === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + pageSize, items.length),
    items: items.slice(startIndex, startIndex + pageSize),
  };
}
