import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import Button from "../ui/Button";

export default function Login() {
  const { user, setUser, loading: authLoading } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // اگر کانتکست هنوز داره لود میشه، صبر کن
  if (authLoading)
    return <div className="p-10 text-center">درحال بررسی هویت...</div>;

  // --- سناریوی ۱: کاربر اصلاً شماره‌اش ثبت نشده (قفل کامل) ---
  // یعنی ربات هنوز شماره رو نگرفته یا کاربر دکمه رو نزده
  if (!user || !user.phone_number) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-full max-w-sm rounded-2xl border-t-4 border-red-500 bg-white p-8 shadow-lg">
          <div className="mb-4 flex justify-center">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-xl font-black text-gray-800">
            احراز هویت انجام نشده!
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            ما هنوز شماره تماس شما را نداریم. برای امنیت آزمون، باید شماره شما
            توسط ایتا تایید شود.
          </p>

          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-xs text-yellow-800">
            <p className="mb-1 font-bold">راه حل:</p>
            ۱. به ربات برگردید.
            <br />
            ۲. دکمه <b>«ارسال شماره تماس»</b> را بزنید.
            <br />
            ۳. مجدداً وارد این صفحه شوید.
          </div>

          <Button
            className="mt-6 w-full bg-gray-600 hover:bg-gray-700"
            handleClick={() => window.eitaa?.close()} // بستن مینی‌اپ
          >
            بازگشت به ربات
          </Button>
        </div>
      </div>
    );
  }

  // --- سناریوی ۲: شماره هست، ولی شماره دانشجویی نیست (تکمیل ثبت‌نام) ---
  const handleRegister = async () => {
    if (!studentId.trim()) {
      alert("وارد کردن شماره دانشجویی الزامی است.");
      return;
    }

    setIsSubmitting(true);

    // آپدیت کردن ردیفی که ربات قبلاً ساخته
    // ما فقط student_id رو اضافه می‌کنیم، چون phone_number و eitaa_id قبلاً هستن
    const { data, error } = await supabase
      .from("profiles")
      .update({
        student_id: studentId,
        first_name:
          window.eitaa?.initDataUnsafe?.user?.first_name || "کاربر ایتا",
      })
      .eq("eitaa_id", user.eitaa_id)
      .select()
      .single();

    if (error) {
      console.error(error);
      if (error.code === "23505") {
        // کد ارور تکراری بودن unique
        alert("این شماره دانشجویی قبلاً ثبت شده است!");
      } else {
        alert("خطا در ثبت اطلاعات. لطفاً دوباره تلاش کنید.");
      }
    } else {
      // موفقیت: کانتکست رو آپدیت کن تا گارد اجازه عبور بده
      setUser(data);
      // نیازی به navigate نیست، خود ProtectedRoute میفهمه و ریدایرکت میکنه
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-black text-cyan-800">
          تکمیل مشخصات
        </h1>

        {/* نمایش شماره موبایل (فقط خواندنی - جهت اطمینان کاربر) */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-bold text-gray-500">
            شماره موبایل تایید شده:
          </label>
          <div className="w-full rounded-xl border border-green-200 bg-green-50 p-3 text-center font-mono font-bold tracking-widest text-green-700">
            {user.phone_number} ✅
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-bold text-gray-700">
            شماره دانشجویی:
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="مثلا 99123456"
            className="w-full rounded-xl border border-gray-300 p-3 text-center text-lg tracking-widest transition-all outline-none focus:border-cyan-600"
          />
        </div>

        <Button handleClick={handleRegister} className="w-full">
          {isSubmitting ? "درحال ثبت..." : "تایید و ورود به سامانه"}
        </Button>
      </div>
    </div>
  );
}
