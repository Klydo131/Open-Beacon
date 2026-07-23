'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Person, Store } from './types';
import { LAST_STAGE } from './journey';
import { makeSeed } from './seed';

// -----------------------------------------------------------------------------
// Offline-first store.
//
// The whole app runs on this — a plain React context backed by localStorage.
// There is no server, no database, no network. That's the point of the demo:
// you can see a role-based app work end-to-end with nothing but the browser.
//
// The one subtlety worth learning: we render nothing until we've hydrated from
// localStorage (`ready`). Without that gate, the server-rendered HTML (seed
// data) and the first client render (saved data) can differ and React warns
// about a hydration mismatch.
// -----------------------------------------------------------------------------

const KEY = 'open-beacon-v1';
const WHO = 'open-beacon-who';

interface Ctx {
  store: Store;
  currentId: string | null;
  current: Person | null;
  signInAs: (id: string) => void;
  signOut: () => void;
  advance: (memberId: string) => void;
  reset: () => void;
}

const Context = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(makeSeed);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate once, on the client.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setStore(JSON.parse(saved));
      const who = localStorage.getItem(WHO);
      if (who) setCurrentId(who);
    } catch {
      /* corrupt storage — fall back to the seed */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Store) => {
    setStore(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked — the app still works in memory */
    }
  }, []);

  const signInAs = useCallback((id: string) => {
    setCurrentId(id);
    try {
      localStorage.setItem(WHO, id);
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setCurrentId(null);
    try {
      localStorage.removeItem(WHO);
    } catch {}
  }, []);

  // Move a member one stage forward (capped at the last stage).
  const advance = useCallback(
    (memberId: string) => {
      setStore((prev) => {
        const next: Store = {
          ...prev,
          people: prev.people.map((p) =>
            p.id === memberId && p.role === 'member'
              ? { ...p, stage_index: Math.min(p.stage_index + 1, LAST_STAGE) }
              : p,
          ),
        };
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    persist(makeSeed());
    signOut();
  }, [persist, signOut]);

  const current = store.people.find((p) => p.id === currentId) ?? null;

  const value: Ctx = {
    store,
    currentId,
    current,
    signInAs,
    signOut,
    advance,
    reset,
  };

  // Hold render until hydrated so saved state doesn't flash-replace the seed.
  if (!ready) return null;

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
