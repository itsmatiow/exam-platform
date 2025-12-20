import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import Button from "../ui/Button";

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
  const [phoneSaving, setPhoneSaving] = useState(false); // لودینگ دکمه شماره

  // 💾 تابع حیاتی: ذخیره شماره در دیتابیس
  const savePhoneNumber = async (rawContactData) => {
    setPhoneSaving(true);
    try {
      console.log("دیتای خام دریافتی:", rawContactData);

      let phone = "";

      // 1. استخراج شماره از انواع فرمت‌های احتمالی ایتا
      if (typeof rawContactData === "string") {
        // اگر رشته جیسون بود پارس کن
        try {
          const parsed = JSON.parse(rawContactData);
          phone = parsed.phone_number || parsed.contact?.phone_number;
        } catch (e) {
          // شاید خود رشته مستقیماً شماره باشه؟
          phone = rawContactData;
        }
      } else if (typeof rawContactData === "object") {
        phone =
          rawContactData.phone_number || rawContactData.contact?.phone_number;
      }

      if (!phone) {
        alert("فرمت شماره دریافتی نامعتبر است. لطفا لاگ را چک کنید.");
        alert("Raw: " + JSON.stringify(rawContactData));
        setPhoneSaving(false);
        return;
      }

      // 2. تمیزکاری شماره (حذف +98 و ...)
      // تبدیل به انگلیسی
      phone = toEng(phone);
      if (phone.startsWith("98")) phone = "0" + phone.slice(2);
      if (phone.startsWith("+98")) phone = "0" + phone.slice(3);
      if (!phone.startsWith("0")) phone = "0" + phone;

      // 3. آپدیت دیتابیس
      const { data, error } = await supabase
        .from("profiles")
        .update({ phone_number: phone })
        .eq("eitaa_id", user.eitaa_id)
        .select()
        .single();

      if (error) throw error;

      // 4. 🎉 موفقیت! آپدیت کانتکست (این خط باعث میشه صفحه عوض شه)
      alert("✅ شماره شما با موفقیت ثبت شد!");
      setUser(data);
    } catch (err) {
      console.error(err);
      alert("خطا در ذخیره شماره: " + err.message);
    } finally {
      setPhoneSaving(false);
    }
  };

  // 👂 لیسنر ایونت‌ها
  useEffect(() => {
    const handleEitaaEvent = (eventType, eventData) => {
      if (eventType === "contact_shared") {
        // وقتی ایونت اومد، تابع ذخیره رو صدا بزن
        savePhoneNumber(eventData);
      }
    };

    if (window.Telegram?.WebView) {
      window.Telegram.WebView.onEvent("contact_shared", handleEitaaEvent);
    }

    return () => {
      if (window.Telegram?.WebView) {
        window.Telegram.WebView.offEvent("contact_shared", handleEitaaEvent);
      }
    };
  }, []); // وابستگی خالی

  // 🔥 هندل کلیک دکمه
  const handleRequestPhone = (e) => {
    e.preventDefault();
    try {
      const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
      const webView = window.Eitaa?.WebView || window.Telegram?.WebView;

      if (app && app.requestContact) {
        app.requestContact((isShared, data) => {
          if (isShared) {
            // اگر از طریق کال‌بک جواب داد
            savePhoneNumber(data);
          }
        });
      } else if (webView && webView.postEvent) {
        webView.postEvent("web_app_request_phone", false, "");
      } else {
        throw new Error("امکان درخواست شماره وجود ندارد.");
      }
    } catch (err) {
      // مدیریت خطای WebAppContactRequested
      if (
        err.message === "WebAppContactRequested" ||
        (err.message && err.message.includes("Contact"))
      ) {
        alert("⚠️ پنجره درخواست باز است. لطفا تایید کنید.");
      } else {
        alert("خطا: " + err.message);
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

          <button
            onClick={handleRequestPhone}
            disabled={phoneSaving}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-md transition-transform active:scale-95 disabled:bg-gray-400"
          >
            {phoneSaving ? "درحال ذخیره..." : "ارسال شماره 📱"}
          </button>

          <p className="mt-4 text-xs text-gray-400">
            با زدن این دکمه، پنجره‌ای باز می‌شود. گزینه «ارسال» را بزنید.
          </p>
        </div>
      </div>
    );
  }

  // سناریوی ۲: فرم ثبت نام (بدون تغییر)
  const handleRegister = async () => {
    if (!formData.name.trim()) {
      alert("نام الزامی است");
      return;
    }
    if (roleMode === "admin" && formData.identifier !== ADMIN_SECRET_CODE) {
      alert("کد غلط است");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({
        first_name: formData.name,
        role: roleMode,
        student_id:
          roleMode === "user" && formData.identifier
            ? formData.identifier
            : null,
      })
      .eq("eitaa_id", user.eitaa_id)
      .select()
      .single();

    if (!error) {
      setUser(data);
      navigate("/dashboard");
    } else {
      alert("خطا: " + error.message);
    }
    setIsSubmitting(false);
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
            نام نمایشی <span className="text-red-500">*</span>
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
          {isSubmitting ? "ورود..." : "تایید و ادامه"}
        </Button>
      </div>
    </div>
  );
}
