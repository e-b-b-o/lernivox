/**
 * Client-Side In-Memory Cache for Lernivox Dashboard & Workspaces
 *
 * Guarantees instantaneous navigation between Dashboard, Settings, and Workspaces
 * without unnecessary re-fetching or skeleton flashes, while preserving strict
 * multi-user isolation, mutation invalidation, and background synchronization.
 */

import type {
  DocumentDto,
  WorkspaceDto,
  WorkspacesListResponseDto,
} from '@lernivox/contracts';

interface CachedDashboard {
  userId: string;
  data: WorkspacesListResponseDto;
  cachedAt: number;
}

interface CachedWorkspace {
  userId: string;
  data: WorkspaceDto;
  cachedAt: number;
}

// In-memory cache stores (isolated per browser session)
let dashboardCache: CachedDashboard | null = null;
const workspaceCacheMap = new Map<string, CachedWorkspace>();

// 60-second fresh window for instant transitions
const CACHE_TTL_MS = 60 * 1000;

export const clientCache = {
  /**
   * Retrieves cached dashboard data if valid for the current user.
   */
  getDashboard(userId: string): WorkspacesListResponseDto | null {
    if (!dashboardCache) return null;
    if (dashboardCache.userId !== userId) return null;
    const isFresh = Date.now() - dashboardCache.cachedAt < CACHE_TTL_MS;
    return isFresh ? dashboardCache.data : null;
  },

  /**
   * Stores fresh dashboard data for the active user.
   */
  setDashboard(userId: string, data: WorkspacesListResponseDto): void {
    dashboardCache = {
      userId,
      data: JSON.parse(JSON.stringify(data)), // Deep copy to prevent accidental outside mutation
      cachedAt: Date.now(),
    };
  },

  /**
   * Updates a single document in the cached dashboard (e.g. after status poll or check).
   */
  updateDashboardDocument(
    userId: string,
    docId: string,
    updates: Partial<DocumentDto>,
  ): void {
    if (!dashboardCache || dashboardCache.userId !== userId) return;

    const updateDoc = (doc: DocumentDto): DocumentDto =>
      doc.id === docId ? { ...doc, ...updates } : doc;

    dashboardCache.data = {
      myBooks: dashboardCache.data.myBooks.map((item) => ({
        ...item,
        document: updateDoc(item.document),
      })),
      sharedWithMe: dashboardCache.data.sharedWithMe.map((item) => ({
        ...item,
        document: updateDoc(item.document),
      })),
    };
  },

  /**
   * Removes a document from the cached dashboard (e.g. after deletion).
   */
  removeDashboardDocument(userId: string, docId: string): void {
    if (!dashboardCache || dashboardCache.userId !== userId) return;
    dashboardCache.data = {
      myBooks: dashboardCache.data.myBooks.filter((item) => item.document.id !== docId),
      sharedWithMe: dashboardCache.data.sharedWithMe.filter(
        (item) => item.document.id !== docId,
      ),
    };
  },

  /**
   * Invalidates dashboard cache so the next visit triggers a fresh fetch.
   */
  invalidateDashboard(): void {
    dashboardCache = null;
  },

  /**
   * Retrieves cached workspace data if valid for the current user.
   */
  getWorkspace(workspaceId: string, userId: string): WorkspaceDto | null {
    const entry = workspaceCacheMap.get(workspaceId);
    if (!entry || entry.userId !== userId) return null;
    const isFresh = Date.now() - entry.cachedAt < CACHE_TTL_MS;
    return isFresh ? entry.data : null;
  },

  /**
   * Stores fresh workspace data for the active user.
   */
  setWorkspace(workspaceId: string, userId: string, data: WorkspaceDto): void {
    workspaceCacheMap.set(workspaceId, {
      userId,
      data: JSON.parse(JSON.stringify(data)),
      cachedAt: Date.now(),
    });
  },

  /**
   * Invalidates a specific workspace cache.
   */
  invalidateWorkspace(workspaceId: string): void {
    workspaceCacheMap.delete(workspaceId);
  },

  /**
   * Clears all caches immediately (called on logout, account switch, or token expiry).
   */
  clearAll(): void {
    dashboardCache = null;
    workspaceCacheMap.clear();
  },
};

