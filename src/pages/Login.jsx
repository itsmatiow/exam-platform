import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

/* ---------------- Utils ---------------- */
const toEng = (str = "") =>
  str
    .toString()
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/\D/g, "");

const normalizePhone = (phone) => {
  let p = toEng(phone);
  if (p.startsWith("98")) p = "0" + p.slice(2);
  if (!p.startsWith("0")) p = "0" + p;
  return p;
};
/* --------------------------------------- */

export default function Login() {
  const navigate = useNavigate();
  const { user, setUser, loading } = useAuth();
  const [savingPhone, setSavingPhone] = useState(false);

  // 🚀 هدایت خودکار: اگر شماره دارد، یعنی لاگین است -> برو داشبورد
  useEffect(() => {
    if (user?.phone_number) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  /* -------- منطق اصلی: ذخیره شماره و ورود -------- */
  const savePhoneNumber = async (rawData) => {
    try {
      setSavingPhone(true);

      // 1. استخراج شماره
      const phone =
        rawData?.responseUnsafe?.contact?.phone ||
        rawData?.contact?.phone ||
        rawData?.phone_number;

      if (!phone) throw new Error("شماره معتبر دریافت نشد");

      const normalizedPhone = normalizePhone(phone);
      const currentEitaaId = rawData?.user?.id || user?.eitaa_id;

      // 2. چک کردن وضعیت کاربر (قدیمی یا جدید؟)
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone_number", normalizedPhone)
        .maybeSingle();

      let finalUser = null;

      if (existingUser) {
        // ✅ کاربر قدیمی: فقط آیدی ایتا را آپدیت کن
        const { data, error } = await supabase
          .from("profiles")
          .update({ eitaa_id: currentEitaaId })
          .eq("phone_number", normalizedPhone)
          .select()
          .single();

        if (error) throw error;
        finalUser = data;
      } else {
        // 🆕 کاربر جدید: ثبت نام فوری با نام پیش‌فرض
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            phone_number: normalizedPhone,
            eitaa_id: currentEitaaId,
            role: "user",
            first_name: "کاربر جدید", // نام پیش‌فرض (چون فرم را برداشتیم)
          })
          .select()
          .single();

        if (error) throw error;
        finalUser = data;
      }

      // 3. پایان: آپدیت کانتکست (که باعث فعال شدن useEffect و انتقال به داشبورد می‌شود)
      setUser(finalUser);
    } catch (err) {
      alert("خطا: " + err.message);
      setSavingPhone(false); // فقط در صورت خطا لودینگ را خاموش کن
    }
  };

  /* -------- دکمه درخواست شماره از ایتا -------- */
  const requestPhone = (e) => {
    e.preventDefault();
    const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;

    if (app?.requestContact) {
      app.requestContact((shared, data) => {
        if (shared) savePhoneNumber(data);
      });
    } else {
      // فال‌بک برای متد مستقیم
      const webView = window.Eitaa?.WebView || window.Telegram?.WebView;
      if (webView?.postEvent) {
        webView.postEvent("web_app_request_phone", false, "");
      } else {
        alert("لطفا با نسخه جدید ایتا وارد شوید.");
      }
    }
  };

  /* -------- رندر صفحه (UI ساده) -------- */
  if (loading) return <div className="p-10 text-center">در حال بررسی...</div>;

  // اگر قبلاً لاگین کرده باشد، useEffect بالا ریدایرکت می‌کند، اما اینجا یک لودینگ نشان میدهیم
  if (user?.phone_number) {
    return (
      <div className="p-10 text-center text-green-600">
        در حال انتقال به داشبورد...
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="mb-4 text-xl font-bold">ورود به سامانه</h1>
        <p className="mb-6 text-xs text-gray-500">
          برای ورود و احراز هویت، شماره موبایل خود را تایید کنید.
        </p>

        <button
          onClick={requestPhone}
          disabled={savingPhone}
          className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-md transition-transform active:scale-95 disabled:bg-gray-400"
        >
          {savingPhone ? "در حال ورود..." : "ورود با شماره ایتا 📱"}
        </button>
      </div>
    </div>
  );
}
