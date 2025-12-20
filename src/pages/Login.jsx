import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";

const toEng = (str) =>
  str
    ?.toString()
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[^0-9]/g, "") || "";
const ADMIN_SECRET_CODE = "123456";

export default function Login() {
  const { user, setUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [roleMode, setRoleMode] = useState("user");
  const [formData, setFormData] = useState({ name: "", identifier: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 👂 گوش‌بایست برای شنیدن جواب ایتا
  useEffect(() => {
    // تابعی که وقتی ایتا جواب میده اجرا میشه
    const handleEitaaEvent = (eventType, eventData) => {
      if (eventType === "contact_shared") {
        // اگر شماره اومد، نشون بده (اینجا فقط الرت میدیم فعلا)
        alert("✅ شماره دریافت شد!\n" + JSON.stringify(eventData));
        // قدم بعدی: ذخیره در دیتابیس
      }
    };

    // متصل کردن گوش‌بایست
    if (window.Telegram?.WebView) {
      window.Telegram.WebView.onEvent("contact_shared", handleEitaaEvent);
    }

    return () => {
      // پاکسازی هنگام خروج
      if (window.Telegram?.WebView) {
        window.Telegram.WebView.offEvent("contact_shared", handleEitaaEvent);
      }
    };
  }, []);

  // 🔥 تابع درخواست شماره (با مدیریت خطا)
  const handleRequestPhone = (e) => {
    // 1. جلوگیری از رفرش شدن صفحه (حیاتی!)
    e.preventDefault();

    try {
      // پیدا کردن آبجکت اصلی (بر اساس کدی که دادی، باید WebApp باشه)
      const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
      const webView = window.Eitaa?.WebView || window.Telegram?.WebView;

      if (app && app.requestContact) {
        console.log("تلاش با روش استاندارد...");
        // فراخوانی تابع رسمی
        app.requestContact((isShared, data) => {
          if (isShared) alert("تایید شد: " + data);
          else alert("رد شد.");
        });
      }
      // اگر تابع استاندارد نبود یا ارور داد، میریم سراغ روش مستقیم (طبق کد خودت)
      else if (webView && webView.postEvent) {
        console.log("تلاش با روش مستقیم (postEvent)...");
        webView.postEvent("web_app_request_phone", false, "");
      } else {
        throw new Error("هیچ راه ارتباطی با ایتا پیدا نشد.");
      }
    } catch (err) {
      // 🛡️ اینجا ارورهای ایتا رو میگیریم که صفحه نپره
      console.error("خطای ایتا:", err);

      if (err.message === "WebAppContactRequested") {
        alert("⚠️ درخواست قبلی هنوز در جریان است. لطفا چند لحظه صبر کنید.");
      } else {
        alert("❌ خطا: " + err.message);
      }
    }
  };

  // --- رندر ---
  if (authLoading) return <div className="p-10 text-center">...</div>;

  // سناریوی ۱: شماره نیست
  if (!user || !user.phone_number) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="mb-4 text-xl font-bold">تایید شماره موبایل</h1>

          {/* دکمه ساده HTML برای اطمینان از نبودن باگ کامپوننت */}
          <button
            onClick={handleRequestPhone}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-md transition-transform active:scale-95"
          >
            ارسال شماره 📱
          </button>

          <p className="mt-4 text-xs text-gray-400">
            اگر دکمه کار نکرد، لطفا از دکمه پایین ربات استفاده کنید.
          </p>
        </div>
      </div>
    );
  }

  // ... (بقیه کدهای فرم ثبت نام بدون تغییر) ...
  // فقط بخش return نهایی را کپی کن:
  const handleRegister = async () => {
    /* ... کد قبلی ... */
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        {/* تب‌ها */}
        <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setRoleMode("user")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${roleMode === "user" ? "bg-white text-cyan-800 shadow-sm" : "text-gray-500"}`}
          >
            👤 شرکت‌کننده
          </button>
          <button
            onClick={() => setRoleMode("admin")}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${roleMode === "admin" ? "bg-white text-cyan-800 shadow-sm" : "text-gray-500"}`}
          >
            🎓 برگزارکننده
          </button>
        </div>

        <h1 className="mb-2 text-center text-xl font-black text-cyan-800">
          {roleMode === "user" ? "اطلاعات کاربری" : "پنل اساتید"}
        </h1>

        <div className="mb-6 text-center">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            شماره تایید شده: {user.phone_number} ✅
          </span>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-bold text-gray-700">
            نام و نام خانوادگی <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border border-gray-300 p-3 text-center outline-none focus:border-cyan-600"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-bold text-gray-700">
            {roleMode === "user" ? "شماره دانشجویی (اختیاری)" : "کد دسترسی"}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.identifier}
            onChange={(e) =>
              setFormData({ ...formData, identifier: toEng(e.target.value) })
            }
            className="w-full rounded-xl border border-gray-300 p-3 text-center tracking-widest outline-none focus:border-cyan-600"
          />
        </div>

        <Button handleClick={handleRegister} className="w-full">
          {isSubmitting ? "درحال ثبت..." : "ورود به سامانه"}
        </Button>
      </div>
    </div>
  );
}
