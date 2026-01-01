import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

/* --- توابع کمکی --- */
const toEng = (str = "") =>
  str
    .toString()
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/\D/g, "");
const normalizePhone = (p) => {
  let phone = toEng(p);
  if (phone.startsWith("98")) phone = "0" + phone.slice(2);
  if (!phone.startsWith("0")) phone = "0" + phone;
  return phone;
};

export default function Home() {
  const navigate = useNavigate();
  const { user, setUser, loading } = useAuth();
  const [saving, setSaving] = useState(false);

  // 🚀 بخش اصلی جادو: هدایت خودکار
  useEffect(() => {
    // اگر لودینگ تمام شده و کاربر شماره دارد -> برو لندینگ
    if (!loading && user?.phone_number) {
      navigate("/landing", { replace: true });
    }
  }, [user, loading, navigate]);

  // --- منطق دریافت و ذخیره شماره ---
  const savePhoneNumber = async (rawData) => {
    setSaving(true);
    try {
      const phone =
        rawData?.responseUnsafe?.contact?.phone ||
        rawData?.contact?.phone ||
        rawData?.phone_number;
      if (!phone) throw new Error("شماره یافت نشد");

      const finalPhone = normalizePhone(phone);
      const eitaaId = rawData?.user?.id || user?.eitaa_id;

      // جستجو یا ثبت کاربر
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone_number", finalPhone)
        .maybeSingle();

      let finalUser = null;
      if (existing) {
        // آپدیت آیدی ایتا
        const { data, error } = await supabase
          .from("profiles")
          .update({ eitaa_id: eitaaId })
          .eq("phone_number", finalPhone)
          .select()
          .single();
        if (error) throw error;
        finalUser = data;
      } else {
        // ثبت نام جدید
        const { data, error } = await supabase
          .from("profiles")
          .insert({ phone_number: finalPhone, eitaa_id: eitaaId, role: "user" })
          .select()
          .single();
        if (error) throw error;
        finalUser = data;
      }

      setUser(finalUser);
      // نکته: با تغییر setUser، اون useEffect بالا خودکار اجرا میشه و میبره به لندینگ
    } catch (err) {
      alert("خطا: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShareClick = () => {
    const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
    if (app?.requestContact) {
      app.requestContact((shared, data) => {
        if (shared) savePhoneNumber(data);
      });
    } else {
      // فال‌بک برای وب‌ویو مستقیم
      window.Eitaa?.WebView?.postEvent("web_app_request_phone", false, "");
    }
  };

  // --- رندر ---

  // ۱. اگر هنوز داریم چک میکنیم کیه، هیچی نشون نده (یا لودینگ خوشگل)
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        درحال بررسی...
      </div>
    );

  // ۲. اگر کاربر لاگین بود، باز هم هیچی نشون نده (چون داره ریدایرکت میشه)
  if (user?.phone_number)
    return (
      <div className="flex h-screen items-center justify-center text-green-600">
        انتقال به برنامه...
      </div>
    );

  // ۳. فقط اگر "غریبه" بود اینو نشون بده
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-sm text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">
          به آزمون‌ساز خوش آمدید 👋
        </h1>
        <p className="mb-8 text-gray-500">
          برای ورود به حساب کاربری، لطفاً شماره خود را تایید کنید.
        </p>

        <button
          onClick={handleShareClick}
          disabled={saving}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg transition-all active:scale-95"
        >
          {saving ? "درحال ورود..." : "📲 اشتراک‌گذاری شماره"}
        </button>
      </div>
    </div>
  );
}
