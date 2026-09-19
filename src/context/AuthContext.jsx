import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /*
    const initAuth = async () => {
      try {
        let eitaaId = null;
        let eitaaName = null;

        const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;

        if (app?.initDataUnsafe?.user?.id) {
          eitaaId = app.initDataUnsafe.user.id;
          eitaaName =
            app.initDataUnsafe.user.first_name +
            (app.initDataUnsafe.user.last_name
              ? " " + app.initDataUnsafe.user.last_name
              : "");
        }

        if (!eitaaId) {
          setUser(null);
          setLoading(false);
          return;
        }

        await checkUserInDb(eitaaId, eitaaName);
      } catch {
        setLoading(false);
      }
    };

    initAuth();
    */

    // کاربر موقت برای نسخه دمو
    setUser({
      eitaa_id: "demo-user",
      name: "Demo User",
      phone_number: "0000000000",
      isNew: false,
    });

    setLoading(false);
  }, []);

  const checkUserInDb = async (id, defaultName) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("eitaa_id", id)
        .maybeSingle();

      if (data) {
        setUser(data);
      } else {
        setUser({
          eitaa_id: id,
          name: defaultName,
          phone_number: null,
          isNew: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
