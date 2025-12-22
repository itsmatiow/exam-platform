// import React from "react";
// import Button from "../ui/Button";
// import { useNavigate } from "react-router-dom";

// export default function Home() {
//   const navigate = useNavigate();

//   return (
//     <div className="mt-70 flex flex-col items-center justify-center">
//       <h1 className="text-3xl font-black">سلام!</h1>
//       <p className="mx-4 mt-8 text-center text-xl font-semibold">
//         ما برای ثبت هویت شما در آزمون‌ها، <br />
//         به شماره همراهتون نیاز داریم. <br />
//         لطفا با ما به اشتراک بذارید...
//       </p>
//       <Button
//         className="mt-8 text-2xl"
//         handleClick={() => {
//           navigate("/landing");
//         }}
//       >
//         اشتراک گذاری
//       </Button>
//     </div>
//   );
// }
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

  // 🔴 متغیر برای ذخیره پیام خطا (سناریو ۲)
  const [errorMsg, setErrorMsg] = useState("");

  // 🚀 سناریو ۳: اگر کاربر قبلاً لاگین کرده، مستقیم برو لندینگ
  useEffect(() => {
    if (!loading && user?.phone_number) {
      navigate("/landing", { replace: true });
    }
  }, [user, loading, navigate]);

  // --- منطق ذخیره شماره ---
  const savePhoneNumber = async (rawData) => {
    setSaving(true);
    setErrorMsg(""); // پاک کردن ارورهای قبلی
    try {
      const phone =
        rawData?.responseUnsafe?.contact?.phone ||
        rawData?.contact?.phone ||
        rawData?.phone_number;

      if (!phone) throw new Error("شماره یافت نشد");

      const finalPhone = normalizePhone(phone);
      const eitaaId = rawData?.user?.id || user?.eitaa_id;

      // جستجو در دیتابیس
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone_number", finalPhone)
        .maybeSingle();

      let finalUser = null;
      if (existing) {
        // آپدیت آیدی ایتا (سینک کردن)
        const { data, error } = await supabase
          .from("profiles")
          .update({ eitaa_id: eitaaId })
          .eq("phone_number", finalPhone)
          .select()
          .single();
        if (error) throw error;
        finalUser = data;
      } else {
        // ثبت نام جدید (سناریو ۱)
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
      setErrorMsg("خطا در ذخیره اطلاعات: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShareClick = () => {
    setErrorMsg(""); // ریست کردن ارور هنگام کلیک جدید
    const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;

    if (app?.requestContact) {
      app.requestContact((shared, data) => {
        if (shared) {
          // کاربر قبول کرد -> ذخیره کن
          savePhoneNumber(data);
        } else {
          // ⚠️ سناریو ۲: کاربر لغو کرد -> نمایش پیام خطا
          setSaving(false);
          setErrorMsg(
            "برای ادامه کار با ربات، اشتراک‌گذاری شماره الزامی است ⚠️",
          );
        }
      });
    } else {
      // فال‌بک برای تست
      window.Eitaa?.WebView?.postEvent("web_app_request_phone", false, "");
    }
  };

  // --- رندر ---

  // اگر هنوز وضعیت مشخص نیست
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        درحال بررسی هویت...
      </div>
    );

  // اگر لاگین است (جهت جلوگیری از پرش تصویر قبل از ریدایرکت)
  if (user?.phone_number)
    return (
      <div className="flex h-screen items-center justify-center font-bold text-green-600">
        انتقال به برنامه...
      </div>
    );

  // صفحه اصلی (برای کاربر جدید یا لاگین نشده)
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-4 text-3xl font-black text-gray-800">سلام! 👋</h1>

        <p className="mb-8 text-lg leading-relaxed font-semibold text-gray-600">
          ما برای ثبت هویت شما در آزمون‌ها، <br />
          به شماره همراهتون نیاز داریم. <br />
          لطفا با ما به اشتراک بذارید...
        </p>

        {/* 🔥 محل نمایش پیام خطا (سناریو ۲) */}
        {errorMsg && (
          <div className="mb-4 animate-pulse rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-600">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleShareClick}
          disabled={saving}
          className={`w-full rounded-2xl py-4 text-xl font-bold text-white shadow-lg transition-all active:scale-95 ${saving ? "cursor-not-allowed bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {saving ? "درحال ورود..." : "📲 اشتراک‌گذاری"}
        </button>
      </div>
    </div>
  );
}
