import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // تابعی که همان اول اجرا می‌شود تا ببیند کاربر کیست
    const initAuth = async () => {
      try {
        let eitaaId = null;

        // 1. جستجوی امن برای پیدا کردن آبجکت WebApp
        // (هم Eitaa و هم Telegram را چک می‌کنیم)
        const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;

        // 2. استخراج آیدی کاربر به روش امن (بدون Destructuring که ارور ندهد)
        // این خط می‌گوید: اگر app بود، و initDataUnsafe بود، و user بود، آنوقت id را بده
        if (app?.initDataUnsafe?.user?.id) {
          eitaaId = app.initDataUnsafe.user.id;
          console.log("✅ کاربر ایتا شناسایی شد:", eitaaId);
        }

        // 3. تصمیم‌گیری
        if (eitaaId) {
          // اگر آیدی واقعی پیدا شد، همان را چک کن
          await checkUserInDb(eitaaId);
        } else {
          // اگر پیدا نشد (مثلاً در مرورگر کامپیوتر هستی)
          console.warn("⚠️ محیط ایتا نیست. استفاده از آیدی تست.");
          // یک آیدی فیک یا آیدی خودت را بگذار برای تست
          await checkUserInDb(65519322);
        }
      } catch (error) {
        console.error("❌ خطای غیرمنتظره در initAuth:", error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // تابع چک کردن کاربر در دیتابیس Supabase
  const checkUserInDb = async (id) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("eitaa_id", id)
        .maybeSingle(); // maybeSingle عالیه چون اگه نباشه ارور نمیده، null میده

      if (error) {
        console.error("خطای دیتابیس:", error.message);
      }

      if (data) {
        // کاربر قدیمی است (قبلاً ثبت شده)
        setUser(data);
      } else {
        // کاربر جدید است (هنوز شماره نداده)
        // یک یوزر موقت میسازیم که برنامه بدونه این آیدی وجود داره
        setUser({ eitaa_id: id, phone_number: null, isNew: true });
      }
    } catch (err) {
      console.error("CheckUser Error:", err);
    } finally {
      // در هر صورت لودینگ را خاموش کن تا صفحه نمایش داده شود
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
