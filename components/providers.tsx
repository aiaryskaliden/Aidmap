"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { Check, X } from "lucide-react";
import { emptyState, parseStoredData, STORAGE_KEY } from "@/lib/storage/state";
import { storageSchema, type LocalState } from "@/types/domain";

type Snapshot = {
  state: LocalState;
  ready: boolean;
  error: string | null;
  blocked: boolean;
};
const initial: Snapshot = {
  state: emptyState(),
  ready: false,
  error: null,
  blocked: false,
};
let snapshot = initial;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
function hydrate() {
  try {
    const result = parseStoredData(localStorage.getItem(STORAGE_KEY));
    snapshot = { ...result, ready: true, blocked: !!result.error };
  } catch {
    snapshot = {
      state: emptyState(),
      ready: true,
      error:
        "Browser storage is unavailable. Changes will last only for this session; export a backup.",
      blocked: false,
    };
  }
  emit();
}
function commit(updater: (state: LocalState) => LocalState, force = false) {
  if (!snapshot.ready)
    throw new Error("Your local workspace is still loading.");
  if (snapshot.blocked && !force)
    throw new Error(
      "Your saved data needs attention. Export the original data and reset or import a valid backup in Preferences.",
    );
  const next = storageSchema.parse(updater(snapshot.state));
  let error: string | null = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    error =
      "Changes are available in this session, but browser storage failed. Export a backup before leaving.";
  }
  snapshot = { state: next, ready: true, error, blocked: false };
  emit();
}
type Store = Snapshot & {
  update: (fn: (s: LocalState) => LocalState) => boolean;
  replace: (s: LocalState) => void;
  toast: (text: string) => void;
};
const Context = createContext<Store | null>(null);
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function Providers({ children }: { children: React.ReactNode }) {
  const data = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  );
  const [message, setMessage] = useState("");
  const toast = useCallback((text: string) => setMessage(text), []);
  useEffect(() => {
    hydrate();
    window.addEventListener("storage", hydrate);
    return () => window.removeEventListener("storage", hydrate);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = data.state.theme;
  }, [data.state.theme]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  const update = (fn: (s: LocalState) => LocalState) => {
    try {
      commit(fn);
      return true;
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to save changes.");
      return false;
    }
  };
  return (
    <Context.Provider
      value={{
        ...data,
        update,
        replace: (s) => {
          commit(() => s, true);
        },
        toast,
      }}
    >
      {children}
      {data.error && (
        <div className="storage-alert" role="alert">
          {data.error} <a href="/profile#data">Manage data</a>
        </div>
      )}
      {message && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing AidMap provider");
  return context;
}
