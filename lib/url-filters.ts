"use client";
import { useSyncExternalStore } from "react";
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("aidmap:filters", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("aidmap:filters", listener);
  };
}
export function useURLFilters() {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  const params = new URLSearchParams(search);
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${next.size ? `?${next}` : ""}`,
    );
    window.dispatchEvent(new Event("aidmap:filters"));
  };
  const reset = () => {
    window.history.replaceState(null, "", window.location.pathname);
    window.dispatchEvent(new Event("aidmap:filters"));
  };
  return { params, set, reset };
}
