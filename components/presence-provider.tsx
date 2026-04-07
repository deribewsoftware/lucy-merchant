"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PRESENCE_ONLINE_MS } from "@/lib/presence-label";

/** Dispatched after session ends so presence UI clears without waiting for the next heartbeat. */
export const LM_LOGOUT_EVENT = "lm:logout";

/** Dispatched after a new session starts (e.g. login) so we heartbeat immediately. */
export const LM_LOGIN_EVENT = "lm:login";

type PresenceCtx = {
  /** Last successful heartbeat time (ms), or null if not logged in / never pinged */
  lastPingAtMs: number | null;
  /** True when last ping was within the online window */
  selfIsOnline: boolean;
};

const PresenceContext = createContext<PresenceCtx>({
  lastPingAtMs: null,
  selfIsOnline: false,
});

export function usePresenceSelf(): PresenceCtx {
  return useContext(PresenceContext);
}

/**
 * Sends periodic presence heartbeats when the session is valid.
 * Wrap the app (or header) so consumers can show "Online" on the account avatar.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const [lastPingAtMs, setLastPingAtMs] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  /** Only show “online” when this tab is visible — avoids “always on” while another tab/app is focused */
  const [tabVisible, setTabVisible] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) setLastPingAtMs(null);
    } catch {
      /* ignore */
    }
  }, []);

  const ping = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    try {
      const res = await fetch("/api/presence", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        setLastPingAtMs(Date.now());
      } else if (res.status === 401) {
        setLastPingAtMs(null);
      }
      /* 429 etc.: keep last successful ping so we don’t flash “offline” on rate limits */
    } catch {
      /* network error — keep prior state */
    }
  }, []);

  useEffect(() => {
    function onLogout() {
      setLastPingAtMs(null);
    }
    function onLogin() {
      void ping();
    }
    window.addEventListener(LM_LOGOUT_EVENT, onLogout);
    window.addEventListener(LM_LOGIN_EVENT, onLogin);
    return () => {
      window.removeEventListener(LM_LOGOUT_EVENT, onLogout);
      window.removeEventListener(LM_LOGIN_EVENT, onLogin);
    };
  }, [ping]);

  useEffect(() => {
    const syncVis = () => setTabVisible(document.visibilityState === "visible");
    syncVis();

    const onVis = () => {
      syncVis();
      if (document.visibilityState === "visible") {
        void checkAuth();
        void ping();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    void checkAuth();
    void ping();
    const intervalId = window.setInterval(ping, 45_000);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ping, checkAuth]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const selfIsOnline = useMemo(() => {
    void tick;
    if (!tabVisible) return false;
    if (lastPingAtMs == null) return false;
    return Date.now() - lastPingAtMs < PRESENCE_ONLINE_MS;
  }, [lastPingAtMs, tick, tabVisible]);

  const value = useMemo(
    () => ({ lastPingAtMs, selfIsOnline }),
    [lastPingAtMs, selfIsOnline],
  );

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}
