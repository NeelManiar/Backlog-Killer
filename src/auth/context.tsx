import React, { createContext, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./client";
const Context = createContext<{
  session: Session | null;
  loading: boolean;
  configured: boolean;
  error: string;
}>({ session: null, loading: true, configured: false, error: "" });
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!supabase) return;
    let live = true;
    let observed = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      observed = true;
      if (live) {
        setSession(next);
        setLoading(false);
      }
    });
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (live && !observed) {
          if (error) setError("Could not restore your session. Sign in again.");
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (live) {
          setError("Could not restore your session. Sign in again.");
          setLoading(false);
        }
      });
    const update = () => {
      if (AppState.currentState === "active") supabase!.auth.startAutoRefresh();
      else supabase!.auth.stopAutoRefresh();
    };
    update();
    const sub = AppState.addEventListener("change", update);
    return () => {
      live = false;
      subscription.unsubscribe();
      sub.remove();
      supabase?.auth.stopAutoRefresh();
    };
  }, []);
  return (
    <Context.Provider
      value={{ session, loading, configured: !!supabase, error }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
