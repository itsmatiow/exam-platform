import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import Button from "../ui/Button";

// توابع کمکی
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
  const [phoneSaving, setPhoneSaving] = useState(false);

  // ----------------------------------------------------------------
  // 1️⃣ تابع ذخیره شماره (با اصلاحیه Upsert برای رفع خطای دیتابیس)
  // ----------------------------------------------------------------
  const savePhoneNumber = async (rawContactData) => {
    setPhoneSaving(true);
    try {
      console.log("دیتای خام دریافتی:", rawContactData);

      let parsedData = rawContactData;
      let phone = "";

      // تبدیل رشته به جیسون اگر لازم بود
      if (typeof rawContactData === "string") {
        try {
          parsedData = JSON.parse(rawContactData);
        } catch (e) {
          console.warn("پارس جیسون ناموفق بود", e);
        }
      }

      // استخراج شماره (طبق عکس شما و حالت‌های دیگر)
      if (parsedData?.responseUnsafe?.contact?.phone) {
        phone = parsedData.responseUnsafe.contact.phone;
      } else if (parsedData?.phone_number) {
        phone = parsedData.phone_number;
      } else if (parsedData?.contact?.phone) {
        phone = parsedData.contact.phone;
      }

      if (!phone) {
        alert("شماره خوانده نشد. فرمت نامعتبر است.");
        setPhoneSaving(false);
        return;
      }

      // فرمت‌دهی شماره
      phone = toEng(phone.toString());
      if (phone.startsWith("98")) phone = "0" + phone.slice(2);
      else if (phone.startsWith("+98")) phone = "0" + phone.slice(3);
      else if (!phone.startsWith("0")) phone = "0" + phone;

      // 🔥 Upsert: اگر هست آپدیت کن، اگر نیست بساز
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            eitaa_id: user.eitaa_id,
            phone_number: phone,
            role: "user",
          },
          // { onConflict: "eitaa_id" },
          { onConflict: "phone_number" },
        )
        .select()
        .single();

      if (error) throw error;

      alert("✅ شماره شما ثبت شد: " + phone);
      setUser(data);
    } catch (err) {
      console.error(err);
      alert("خطا در ذخیره: " + err.message);
    } finally {
      setPhoneSaving(false);
    }
  };

  // ----------------------------------------------------------------
  // 2️⃣ لیسنر (گوش‌بایست) برای شنیدن جواب از ایتا
  // ----------------------------------------------------------------
  useEffect(() => {
    const handleEitaaEvent = (eventType, eventData) => {
      if (eventType === "contact_shared") {
        savePhoneNumber(eventData);
      }
    };

    // اتصال به وب‌ویوی تلگرام/ایتا
    if (window.Telegram?.WebView) {
      window.Telegram.WebView.onEvent("contact_shared", handleEitaaEvent);
    }

    return () => {
      if (window.Telegram?.WebView) {
        window.Telegram.WebView.offEvent("contact_shared", handleEitaaEvent);
      }
    };
  }, []); // وابستگی خالی (فقط یک بار اجرا شود)

  // ----------------------------------------------------------------
  // 3️⃣ تابع درخواست شماره (این همونیه که گم شده بود!)
  // ----------------------------------------------------------------
  const handleRequestPhone = (e) => {
    e.preventDefault(); // جلوگیری از رفرش صفحه
    try {
      const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
      const webView = window.Eitaa?.WebView || window.Telegram?.WebView;

      if (app && app.requestContact) {
        // روش استاندارد
        app.requestContact((isShared, data) => {
          if (isShared) {
            savePhoneNumber(data);
          }
        });
      } else if (webView && webView.postEvent) {
        // روش مستقیم (اگر استاندارد کار نکرد)
        webView.postEvent("web_app_request_phone", false, "");
      } else {
        throw new Error("امکان درخواست شماره وجود ندارد.");
      }
    } catch (err) {
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

  // ----------------------------------------------------------------
  // 4️⃣ رندر صفحه (UI)
  // ----------------------------------------------------------------
  if (authLoading)
    return <div className="p-10 text-center">در حال بارگذاری...</div>;

  // سناریوی ۱: شماره تایید نشده -> نمایش دکمه درخواست
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

  // سناریوی ۲: فرم تکمیل مشخصات (نام و ...)
  const handleRegister = async () => {
    if (!formData.name.trim()) {
      alert("نام الزامی است");
      return;
    }
    // if (roleMode === "admin" && formData.identifier !== ADMIN_SECRET_CODE) {
    //   alert("کد غلط است");
    //   return;
    // }

    setIsSubmitting(true);
    // اینجا چون شماره قبلا ثبت شده، فقط آپدیت میکنیم
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
      .eq("phone_number", user.phone_number)
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
        {/* انتخاب نقش */}
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
