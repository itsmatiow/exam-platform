import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check Eitaa Environment
      if (window.eitaa?.initDataUnsafe?.user) {
        const eitaaUser = window.eitaa.initDataUnsafe.user;
        await checkUserInDb(eitaaUser.id);
      } else {
        // ⚠️ حالت تست لوکال (چون ایتا نیست)
        // اینجا باید دستی یک آیدی وارد کنی که توی دیتابیس داریش
        // یا اگر میخوای حالت "کاربر جدید" رو تست کنی، آیدی جدید بده
        console.warn("Local Dev Mode");
        await checkUserInDb(123456789);
      }
    };
    initAuth();
  }, []);

  const checkUserInDb = async (eitaaId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("eitaa_id", eitaaId)
        .maybeSingle();

      if (data) {
        // کاربر پیدا شد (چه شماره داشته باشه چه نداشته باشه)
        // صفحه Login تصمیم میگیره راهش بده یا نه
        setUser(data);
      } else {
        // کاربر اصلا توی جدول نیست (یعنی ربات هم استارت نکرده)
        // ما یک آبجکت موقت میسازیم که فقط آیدی داره
        setUser({ eitaa_id: eitaaId, phone_number: null });
      }
    } catch (err) {
      console.error(err);
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

export const useAuth = () => useContext(AuthContext);
