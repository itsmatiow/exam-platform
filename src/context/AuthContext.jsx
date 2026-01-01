// import React, { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../supabase";

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // تابعی که همان اول اجرا می‌شود تا ببیند کاربر کیست
//     const initAuth = async () => {
//       try {
//         let eitaaId = null;

//         const app = window.Eitaa?.WebApp;

//         if (app?.initDataUnsafe?.user?.id) {
//           eitaaId = app.initDataUnsafe.user.id;
//           console.log("✅ کاربر ایتا شناسایی شد:", eitaaId);
//         }

//         if (eitaaId) {
//           await checkUserInDb(eitaaId);
//         } else {
//           // اگر پیدا نشد (مثلاً در مرورگر کامپیوتر هستی)
//           console.warn("⚠️ محیط ایتا نیست. استفاده از آیدی تست.");
//           // یک آیدی فیک یا آیدی خودت را بگذار برای تست
//           await checkUserInDb(65519322);
//         }
//       } catch (error) {
//         console.error("❌ خطای غیرمنتظره در initAuth:", error);
//         setLoading(false);
//       }
//     };

//     initAuth();
//   }, []);

//   // تابع چک کردن کاربر در دیتابیس Supabase
//   const checkUserInDb = async (id) => {
//     try {
//       const { data, error } = await supabase
//         .from("profiles")
//         .select("*")
//         .eq("eitaa_id", id)
//         .maybeSingle(); // maybeSingle عالیه چون اگه نباشه ارور نمیده، null میده

//       if (error) {
//         console.error("خطای دیتابیس:", error.message);
//       }

//       if (data) {
//         // کاربر قدیمی است (قبلاً ثبت شده)
//         setUser(data);
//       } else {
//         // کاربر جدید است (هنوز شماره نداده)
//         // یک یوزر موقت میسازیم که برنامه بدونه این آیدی وجود داره
//         setUser({ eitaa_id: id, phone_number: null, isNew: true });
//       }
//     } catch (err) {
//       console.error("CheckUser Error:", err);
//     } finally {
//       // در هر صورت لودینگ را خاموش کن تا صفحه نمایش داده شود
//       setLoading(false);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, setUser, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../supabase";

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const initAuth = async () => {
//       try {
//         let eitaaId = null;

//         const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;

//         if (app?.initDataUnsafe?.user?.id) {
//           eitaaId = app.initDataUnsafe.user.id;
//         }

//         if (!eitaaId) {
//           setUser(null);
//           setLoading(false);
//           return;
//         }

//         await checkUserInDb(eitaaId);
//       } catch {
//         setLoading(false);
//       }
//     };

//     initAuth();
//   }, []);

//   const checkUserInDb = async (id) => {
//     try {
//       const { data } = await supabase
//         .from("profiles")
//         .select("*")
//         .eq("eitaa_id", id)
//         .maybeSingle();

//       if (data) {
//         setUser(data);
//       } else {
//         setUser({
//           eitaa_id: id,
//           phone_number: null,
//           isNew: true,
//         });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, setUser, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // eslint-disable-next-line react-refresh/only-export-components
// export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // ۱. دریافت اطلاعات از ایتا
      const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
      const initData = app?.initDataUnsafe?.user;

      if (initData) {
        try {
          // ۲. آماده‌سازی اطلاعات کاربر برای ذخیره
          const userData = {
            eitaa_id: initData.id,
            first_name: initData.first_name || "", // اسم کوچک
            last_name: initData.last_name || "", // فامیل
            username: initData.username || "", // آیدی بدون @
          };

          // ۳. آپدیت یا ساخت کاربر در دیتابیس (Upsert)
          // اگر کاربر از قبل باشه، اطلاعاتش (مثلا اسمش) آپدیت میشه
          const { data, error } = await supabase
            .from("users")
            .upsert(userData, { onConflict: "eitaa_id" })
            .select()
            .single();

          if (error) throw error;

          // ۴. ست کردن یوزر در کل برنامه
          setUser(data);
        } catch (error) {
          console.error("خطا در سینک کردن کاربر:", error.message);
        }
      } else {
        // حالت تست مرورگر (خارج از ایتا)
        console.warn("⚠️ بیرون از ایتا هستید.");
        // برای تست لوکال میتونی اینجا دستی یوزر ست کنی
      }

      setLoading(false);
    };

    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
