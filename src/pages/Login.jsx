import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import Button from "../ui/Button";

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
  const { user, setUser, loading } = useAuth(); // وضعیت کلی کاربر از کانتکست

  const [formData, setFormData] = useState({ name: "", identifier: "" });
  const [savingPhone, setSavingPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ حل مشکل ۲ و ۳: چک کردن وضعیت کاربر به محض ورود
  useEffect(() => {
    // اگر کاربر وجود دارد، شماره دارد و نامش هم ثبت شده -> برو داشبورد
    if (user && user.phone_number && user.first_name) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  /* -------- Save Phone Logic (هوشمند) -------- */
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

      // 2. اول چک میکنیم این شماره قبلا هست یا نه؟
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone_number", normalizedPhone)
        .maybeSingle();

      let finalUser = null;

      if (existingUser) {
        // 🔄 اگر کاربر قبلا بوده، فقط آیدی ایتا رو آپدیت کن (سینک کردن)
        const { data, error } = await supabase
          .from("profiles")
          .update({ eitaa_id: currentEitaaId })
          .eq("phone_number", normalizedPhone)
          .select()
          .single();

        if (error) throw error;
        finalUser = data;
      } else {
        // 🆕 اگر کاربر جدیده، بسازش
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            phone_number: normalizedPhone,
            eitaa_id: currentEitaaId,
            role: "user", // فعلا پیش‌فرض
          })
          .select()
          .single();

        if (error) throw error;
        finalUser = data;
      }

      // آپدیت کانتکست (این باعث میشه UI خودکار بره مرحله بعد)
      setUser(finalUser);
    } catch (err) {
      alert("خطا: " + err.message);
    } finally {
      setSavingPhone(false);
    }
  };

  /* -------- Request Phone -------- */
  const requestPhone = (e) => {
    e.preventDefault();
    const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;

    if (app?.requestContact) {
      app.requestContact((shared, data) => {
        if (shared) savePhoneNumber(data);
      });
    } else {
      // فال‌بک برای تست دستی یا نسخه وب
      const webView = window.Eitaa?.WebView || window.Telegram?.WebView;
      if (webView?.postEvent) {
        webView.postEvent("web_app_request_phone", false, "");
      } else {
        alert("لطفا با نسخه جدید ایتا وارد شوید.");
      }
    }
  };

  /* -------- Submit Profile (Name) -------- */
  const submitProfile = async () => {
    if (!formData.name.trim()) {
      alert("نام الزامی است");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        first_name: formData.name,
        // فعلا identifier (شماره دانشجویی) رو همونطور ساده میگیریم
        student_id: formData.identifier || null,
      })
      .eq("phone_number", user.phone_number)
      .select()
      .single();

    if (!error) {
      setUser(data);
      // ✅ حل مشکل ۳: هدایت قطعی به داشبورد
      navigate("/dashboard", { replace: true });
    } else {
      alert(error.message);
    }

    setSubmitting(false);
  };

  // ------------------------------------------------------
  // رندرینگ (UI)
  // ------------------------------------------------------

  if (loading) return <div className="p-10 text-center">در حال بررسی...</div>;

  // سناریو ۱: هنوز شماره موبایل ندارد
  if (!user?.phone_number) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-xl font-bold">تأیید شماره موبایل</h1>
          <p className="mb-6 text-xs text-gray-500">
            برای ورود، شماره خود را ارسال کنید
          </p>

          <button
            onClick={requestPhone}
            disabled={savingPhone}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-md active:scale-95 disabled:bg-gray-400"
          >
            {savingPhone ? "در حال پردازش..." : "ارسال شماره 📱"}
          </button>
        </div>
      </div>
    );
  }

  // سناریو ۲: شماره دارد ولی نام ندارد (تکمیل ثبت نام)
  if (!user?.first_name) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
          <div className="mb-6 text-center">
            <div className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              {user.phone_number} ✅
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-800">
              تکمیل مشخصات
            </h2>
          </div>

          {/* ✅ حل مشکل ۱: حذف تب‌ها و ساده‌سازی فرم */}
          <input
            placeholder="نام و نام خانوادگی"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mb-4 w-full rounded-xl border border-gray-300 p-3 text-center outline-none focus:border-blue-500"
          />

          <input
            placeholder="شماره دانشجویی (اختیاری)"
            value={formData.identifier}
            onChange={(e) =>
              setFormData({ ...formData, identifier: toEng(e.target.value) })
            }
            className="mb-6 w-full rounded-xl border border-gray-300 p-3 text-center outline-none focus:border-blue-500"
          />

          <Button handleClick={submitProfile} className="w-full">
            {submitting ? "در حال ثبت..." : "ورود به داشبورد"}
          </Button>
        </div>
      </div>
    );
  }

  // اگر همه چیز کامل است (معمولا useEffect بالا ریدایرکت میکند ولی محض اطمینان)
  return <div className="p-10 text-center">در حال انتقال به داشبورد...</div>;
}
