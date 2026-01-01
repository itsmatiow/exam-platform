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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
        const eitaaUser = app?.initDataUnsafe?.user;

        if (!eitaaUser?.id) {
          setUser(null);
          setLoading(false);
          return;
        }

        await checkUserInDb(eitaaUser);
      } catch (error) {
        console.error("Auth Error:", error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const checkUserInDb = async (eitaaUser) => {
    try {
      const updates = {
        eitaa_id: eitaaUser.id,
        first_name: eitaaUser.first_name || "",
        last_name: eitaaUser.last_name || "",
        username: eitaaUser.username || "",
        // phone_number را نمی‌فرستیم تا نال نشود
      };

      // ۱. استفاده از upsert و گرفتن خروجی
      const { data, error } = await supabase
        .from("profiles")
        .upsert(updates, { onConflict: "eitaa_id" })
        .select(); // 👈 حذف .maybeSingle() برای رفع ارور

      if (error) throw error;

      // ۲. دستی چک می‌کنیم که دیتا داریم یا نه
      const profile = data && data.length > 0 ? data[0] : null;

      if (profile && profile.phone_number) {
        setUser(profile);
      } else if (profile) {
        // کاربر جدید است (شماره ندارد)
        setUser({
          ...profile,
          isNew: true,
        });
      } else {
        // حالت نادر: دیتا ذخیره شد ولی برنگشت (معمولا بخاطر RLS)
        // اینجا دستی آبجکت رو میسازیم که برنامه کرش نکنه
        setUser({
          ...updates,
          phone_number: null,
          isNew: true,
        });
      }
    } catch (error) {
      console.error("DB Error:", error);
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

// import React, { createContext, useContext, useEffect, useState } from "react";
// import { supabase } from "../supabase";

// const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const initAuth = async () => {
//       try {
//         const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
//         const eitaaUser = app?.initDataUnsafe?.user;

//         if (!eitaaUser?.id) {
//           setUser(null);
//           setLoading(false);
//           return;
//         }

//         await checkUserInDb(eitaaUser);
//       } catch (error) {
//         console.error("Auth Error:", error);
//         setLoading(false);
//       }
//     };

//     initAuth();
//   }, []);

//   const checkUserInDb = async (eitaaUser) => {
//     try {
//       const updates = {
//         eitaa_id: eitaaUser.id,
//         first_name: eitaaUser.first_name || "",
//         last_name: eitaaUser.last_name || "",
//         username: eitaaUser.username || "",
//         // نکته: phone_number را اینجا نمی‌نویسیم تا نال نشود
//       };

//       const { data, error } = await supabase
//         .from("profiles")
//         .upsert(updates, { onConflict: "eataa_id" })
//         // .select("*")
//         // .eq("eitaa_id", id)
//         .select("*")
//         .maybeSingle();

//       if (error) throw error;
//       if (data && data.phone_number) {
//         setUser(data);
//       } else {
//         setUser({
//           ...data,
//           // eitaa_id: eitaaUser.id,
//           // phone_number: null,
//           isNew: true,
//         });
//       }
//     } catch (err) {
//       console.error("CheckUser Error:", err);
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
