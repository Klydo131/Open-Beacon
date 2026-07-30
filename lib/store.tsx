'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { LAST_STAGE } from './journey';
import { makeSeed } from './seed';
import { isSafeId, parseStoredStore } from './store-data.mjs';
import type {
  MotionPreference,
  Person,
  Store,
  TextSize,
  WorkspaceTheme,
} from './types';

const STORE_KEY = 'open-beacon-v3';
const LEGACY_STORE_KEY = 'open-beacon-v2';
const PERSON_KEY = 'open-beacon-person';
const MAX_BODY_CHARACTERS = 500;
const MAX_ITEMS = 100;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;

interface StoreContext {
  store: Store;
  current: Person | null;
  signInAs: (id: string) => void;
  signOut: () => void;
  advance: (memberId: string) => void;
  reassignMember: (memberId: string, guideId: string) => void;
  toggleTask: (taskId: string) => void;
  toggleSavedResource: (resourceId: string) => void;
  addNote: (subjectId: string, body: string) => boolean;
  sendMessage: (participantId: string, body: string) => boolean;
  addSupportRequest: (body: string, shareAnonymously: boolean) => boolean;
  updateCurrentName: (name: string) => boolean;
  setTextSize: (value: TextSize) => void;
  setMotion: (value: MotionPreference) => void;
  setWorkspaceTheme: (value: WorkspaceTheme) => void;
  restoreData: (raw: string) => boolean;
  reset: () => void;
}

const Context = createContext<StoreContext | null>(null);

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // Storage can be unavailable; the in-memory experience still works.
  }
}

function isSafeBody(value: string) {
  return (
    value.length > 0 &&
    value.length <= MAX_BODY_CHARACTERS &&
    !CONTROL_CHARACTERS.test(value)
  );
}

function itemId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(makeSeed);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let hydratedStore = makeSeed();

    try {
      const currentValue = localStorage.getItem(STORE_KEY);
      const legacyValue = currentValue
        ? null
        : localStorage.getItem(LEGACY_STORE_KEY);
      const saved = currentValue ?? legacyValue;

      if (saved) {
        const parsed = parseStoredStore(saved, LAST_STAGE);
        if (parsed) {
          hydratedStore = legacyValue
            ? { ...makeSeed(), people: parsed.people }
            : parsed;
          setStore(hydratedStore);
          saveStore(hydratedStore);
          localStorage.removeItem(LEGACY_STORE_KEY);
        } else {
          localStorage.removeItem(currentValue ? STORE_KEY : LEGACY_STORE_KEY);
        }
      }

      const selectedId = localStorage.getItem(PERSON_KEY);
      if (
        selectedId &&
        hydratedStore.people.some((person) => person.id === selectedId)
      ) {
        setCurrentId(selectedId);
      } else {
        localStorage.removeItem(PERSON_KEY);
      }
    } catch {
      // Invalid or blocked storage falls back to fictional sample data.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.textSize = store.preferences.text_size;
    document.documentElement.dataset.motion = store.preferences.motion;
    document.documentElement.dataset.workspaceTheme =
      store.preferences.workspace_theme;
  }, [store.preferences]);

  const commit = useCallback((update: (previous: Store) => Store) => {
    setStore((previous) => {
      const next = update(previous);
      if (next !== previous) saveStore(next);
      return next;
    });
  }, []);

  const signInAs = useCallback(
    (id: string) => {
      if (!store.people.some((person) => person.id === id)) return;

      setCurrentId(id);
      try {
        localStorage.setItem(PERSON_KEY, id);
      } catch {
        // The current page can still use the in-memory selection.
      }
    },
    [store.people],
  );

  const signOut = useCallback(() => {
    setCurrentId(null);
    try {
      localStorage.removeItem(PERSON_KEY);
    } catch {
      // Nothing else is required for an in-memory sign-out.
    }
  }, []);

  const advance = useCallback(
    (memberId: string) => {
      commit((previous) => {
        const actor = previous.people.find(
          (person) => person.id === currentId,
        );
        if (
          !actor ||
          (actor.role !== 'guide' && actor.role !== 'coordinator')
        ) {
          return previous;
        }

        return {
          ...previous,
          people: previous.people.map((person) => {
            if (person.id !== memberId || person.role !== 'member') return person;
            if (
              actor.role === 'guide' &&
              person.guide_id !== actor.id
            ) {
              return person;
            }
            return {
              ...person,
              stage_index: Math.min(person.stage_index + 1, LAST_STAGE),
            };
          }),
        };
      });
    },
    [commit, currentId],
  );

  const reassignMember = useCallback(
    (memberId: string, guideId: string) => {
      commit((previous) => {
        const actor = previous.people.find(
          (person) => person.id === currentId,
        );
        const guide = previous.people.find(
          (person) => person.id === guideId && person.role === 'guide',
        );
        if (actor?.role !== 'coordinator' || !guide) return previous;

        return {
          ...previous,
          people: previous.people.map((person) =>
            person.id === memberId && person.role === 'member'
              ? { ...person, guide_id: guide.id }
              : person,
          ),
        };
      });
    },
    [commit, currentId],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      if (!isSafeId(taskId)) return;
      commit((previous) => {
        const completed = previous.completed_task_ids.includes(taskId);
        const completedTaskIds = completed
          ? previous.completed_task_ids.filter((id) => id !== taskId)
          : [...previous.completed_task_ids, taskId].slice(-MAX_ITEMS);
        return { ...previous, completed_task_ids: completedTaskIds };
      });
    },
    [commit],
  );

  const toggleSavedResource = useCallback(
    (resourceId: string) => {
      if (!isSafeId(resourceId)) return;
      commit((previous) => {
        const saved = previous.saved_resource_ids.includes(resourceId);
        const savedResourceIds = saved
          ? previous.saved_resource_ids.filter((id) => id !== resourceId)
          : [...previous.saved_resource_ids, resourceId].slice(-MAX_ITEMS);
        return { ...previous, saved_resource_ids: savedResourceIds };
      });
    },
    [commit],
  );

  const addNote = useCallback(
    (subjectId: string, body: string) => {
      const cleanBody = body.trim();
      if (
        !currentId ||
        !isSafeId(subjectId) ||
        !isSafeBody(cleanBody) ||
        store.notes.length >= MAX_ITEMS ||
        !store.people.some((person) => person.id === currentId) ||
        !store.people.some((person) => person.id === subjectId)
      ) {
        return false;
      }

      commit((previous) => {
        return {
          ...previous,
          notes: [
            ...previous.notes,
            {
              id: itemId('note'),
              author_id: currentId,
              subject_id: subjectId,
              body: cleanBody,
            },
          ],
        };
      });
      return true;
    },
    [commit, currentId, store.notes.length, store.people],
  );

  const sendMessage = useCallback(
    (participantId: string, body: string) => {
      const cleanBody = body.trim();
      if (
        !currentId ||
        participantId === currentId ||
        !isSafeId(participantId) ||
        !isSafeBody(cleanBody) ||
        store.messages.length >= MAX_ITEMS ||
        !store.people.some((person) => person.id === currentId) ||
        !store.people.some((person) => person.id === participantId)
      ) {
        return false;
      }

      commit((previous) => {
        return {
          ...previous,
          messages: [
            ...previous.messages,
            {
              id: itemId('message'),
              author_id: currentId,
              participant_id: participantId,
              body: cleanBody,
            },
          ],
        };
      });
      return true;
    },
    [commit, currentId, store.messages.length, store.people],
  );

  const addSupportRequest = useCallback(
    (body: string, shareAnonymously: boolean) => {
      const cleanBody = body.trim();
      if (
        !currentId ||
        !isSafeBody(cleanBody) ||
        store.support_requests.length >= MAX_ITEMS ||
        !store.people.some((person) => person.id === currentId)
      ) {
        return false;
      }

      commit((previous) => {
        return {
          ...previous,
          support_requests: [
            ...previous.support_requests,
            {
              id: itemId('request'),
              person_id: currentId,
              body: cleanBody,
              share_anonymously: shareAnonymously,
            },
          ],
        };
      });
      return true;
    },
    [commit, currentId, store.people, store.support_requests.length],
  );

  const updateCurrentName = useCallback(
    (name: string) => {
      const cleanName = name.trim();
      if (
        !currentId ||
        cleanName.length === 0 ||
        cleanName.length > 80 ||
        CONTROL_CHARACTERS.test(cleanName)
      ) {
        return false;
      }
      commit((previous) => ({
        ...previous,
        people: previous.people.map((person) =>
          person.id === currentId ? { ...person, name: cleanName } : person,
        ),
      }));
      return true;
    },
    [commit, currentId],
  );

  const setTextSize = useCallback(
    (value: TextSize) => {
      commit((previous) => ({
        ...previous,
        preferences: { ...previous.preferences, text_size: value },
      }));
    },
    [commit],
  );

  const setMotion = useCallback(
    (value: MotionPreference) => {
      commit((previous) => ({
        ...previous,
        preferences: { ...previous.preferences, motion: value },
      }));
    },
    [commit],
  );

  const setWorkspaceTheme = useCallback(
    (value: WorkspaceTheme) => {
      commit((previous) => ({
        ...previous,
        preferences: { ...previous.preferences, workspace_theme: value },
      }));
    },
    [commit],
  );

  const restoreData = useCallback(
    (raw: string) => {
      const restored = parseStoredStore(raw, LAST_STAGE);
      if (!restored) return false;

      setStore(restored);
      saveStore(restored);
      if (
        currentId &&
        !restored.people.some((person) => person.id === currentId)
      ) {
        signOut();
      }
      return true;
    },
    [currentId, signOut],
  );

  const reset = useCallback(() => {
    const seed = makeSeed();
    setStore(seed);
    saveStore(seed);
    signOut();
  }, [signOut]);

  const current =
    store.people.find((person) => person.id === currentId) ?? null;

  if (!ready) return null;

  return (
    <Context.Provider
      value={{
        store,
        current,
        signInAs,
        signOut,
        advance,
        reassignMember,
        toggleTask,
        toggleSavedResource,
        addNote,
        sendMessage,
        addSupportRequest,
        updateCurrentName,
        setTextSize,
        setMotion,
        setWorkspaceTheme,
        restoreData,
        reset,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useStore(): StoreContext {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return context;
}
