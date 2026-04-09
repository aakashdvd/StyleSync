"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { TokenSet, TokenSetRecord } from "@/lib/tokens/types";
import { resolveTokenSet, setTokenValue } from "@/lib/tokens/merge";

/**
 * Client-side token store.
 *
 * Why zustand + subscribeWithSelector:
 *   - We need instant (<100ms / next frame) propagation of edits to the
 *     preview canvas. The preview subscribes to the resolved TokenSet and
 *     writes CSS variables on change; going through React Context + a
 *     re-render of every component in the preview would be too slow.
 *   - subscribeWithSelector lets us derive the resolved TokenSet once and
 *     notify only components that care.
 *
 * The store holds a {@link TokenSetRecord} (extracted + overrides + locks)
 * and exposes a memoized resolved {@link TokenSet} for consumers.
 */

export interface SiteSummary {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  status: string;
  statusReason: string | null;
  scrapedAt: string;
}

interface TokenStoreState {
  siteId: string | null;
  site: SiteSummary | null;
  record: TokenSetRecord | null;
  resolved: TokenSet | null;
  dirtyPaths: Set<string>;
  isSaving: boolean;

  hydrate(siteId: string, site: SiteSummary, record: TokenSetRecord): void;
  editToken(path: string, value: unknown): void;
  toggleLock(path: string): void;
  setLocalRecord(record: TokenSetRecord): void;
  markClean(path: string): void;
  setSaving(saving: boolean): void;
  reset(): void;
}

export const useTokenStore = create<TokenStoreState>()(
  subscribeWithSelector((set, get) => ({
    siteId: null,
    site: null,
    record: null,
    resolved: null,
    dirtyPaths: new Set(),
    isSaving: false,

    hydrate(siteId, site, record) {
      set({
        siteId,
        site,
        record,
        resolved: resolveTokenSet(record),
        dirtyPaths: new Set(),
      });
    },

    editToken(path, value) {
      const { record } = get();
      if (!record) return;
      const nextRecord = setTokenValue(record, path, value);
      if (nextRecord === record) return;
      const nextDirty = new Set(get().dirtyPaths);
      nextDirty.add(path);
      set({
        record: nextRecord,
        resolved: resolveTokenSet(nextRecord),
        dirtyPaths: nextDirty,
      });
    },

    toggleLock(path) {
      const { record } = get();
      if (!record) return;
      const set2 = new Set(record.locked);
      if (set2.has(path)) set2.delete(path);
      else set2.add(path);
      const nextRecord: TokenSetRecord = {
        ...record,
        locked: [...set2],
      };
      set({ record: nextRecord, resolved: resolveTokenSet(nextRecord) });
    },

    setLocalRecord(record) {
      set({ record, resolved: resolveTokenSet(record) });
    },

    markClean(path) {
      const dirty = new Set(get().dirtyPaths);
      dirty.delete(path);
      set({ dirtyPaths: dirty });
    },

    setSaving(saving) {
      set({ isSaving: saving });
    },

    reset() {
      set({
        siteId: null,
        site: null,
        record: null,
        resolved: null,
        dirtyPaths: new Set(),
        isSaving: false,
      });
    },
  })),
);
