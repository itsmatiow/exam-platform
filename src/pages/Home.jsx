import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2"; // 👈 ایمپورت سوییت الرت

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
  // ❌ استیت errorMsg حذف شد چون دیگه با آلرت نشون میدیم

  const [targetTestId, setTargetTestId] = useState(null);

  useEffect(() => {
    const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
    const startParam = app?.initDataUnsafe?.start_param;

    if (startParam) {
      console.log("ورود با لینک آزمون:", startParam);
      setTargetTestId(startParam);
    }
  }, []);

  //redirect if already logged in
  useEffect(() => {
    if (!loading && user?.phone_number) {
      if (targetTestId) {
        navigate(`/test/${targetTestId}`, { replace: true });
      } else {
        navigate("/landing", { replace: true });
      }
    }
  }, [user, loading, navigate, targetTestId]);

  //save phone number to supabase
  const savePhoneNumber = async (rawData) => {
    setSaving(true);

    // 👈 نمایش لودینگ
    Swal.fire({
      title: "درحال بررسی هویت...",
      html: "لطفا کمی صبر کنید",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const phone =
        rawData?.responseUnsafe?.contact?.phone ||
        rawData?.contact?.phone ||
        rawData?.phone_number;

      if (!phone) throw new Error("شماره یافت نشد");

      const finalPhone = normalizePhone(phone);

      const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;
      const eitaaUser = app?.initDataUnsafe?.user || rawData?.user;
      const eitaaId = eitaaUser?.id || user?.eitaa_id;

      const firstName = eitaaUser?.first_name || "";
      const lastName = eitaaUser?.last_name || "";

      //search in database
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone_number", finalPhone)
        .maybeSingle();

      let finalUser = null;

      if (existing) {
        const updates = {
          eitaa_id: eitaaId,
          first_name: existing.first_name || firstName,
          last_name: existing.last_name || lastName,
        };

        //update eitaa id if missing or changed
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("phone_number", finalPhone)
          .select()
          .single();
        if (error) throw error;
        finalUser = data;
      } else {
        // sign up new user
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            phone_number: finalPhone,
            eitaa_id: eitaaId,
            first_name: firstName,
            last_name: lastName,
            role: "user",
          })
          .select()
          .single();
        if (error) throw error;
        finalUser = data;
      }

      // 👈 نمایش پیام موفقیت قبل از انتقال
      await Swal.fire({
        icon: "success",
        title: "خوش آمدید! 👋",
        text: "اطلاعات شما تایید شد. در حال انتقال...",
        timer: 1500,
        showConfirmButton: false,
      });

      setUser(finalUser);
    } catch (err) {
      // 👈 نمایش خطا با Swal
      Swal.fire({
        icon: "error",
        title: "خطا",
        text: "خطا در ذخیره اطلاعات: " + err.message,
        confirmButtonText: "باشه",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShareClick = () => {
    const app = window.Eitaa?.WebApp || window.Telegram?.WebApp;

    if (app?.requestContact) {
      app.requestContact((shared, data) => {
        if (shared) {
          savePhoneNumber(data);
        } else {
          setSaving(false);
          // 👈 هشدار در صورت لغو اشتراک‌گذاری
          Swal.fire({
            icon: "warning",
            title: "توجه",
            text: "برای ادامه کار با ربات، اشتراک‌گذاری شماره الزامی است ⚠️",
            confirmButtonText: "متوجه شدم",
          });
        }
      });
    } else {
      // fallback for testing in browser
      window.Eitaa?.WebView?.postEvent("web_app_request_phone", false, "");
    }
  };

  //rendering

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        درحال بارگذاری...
      </div>
    );

  if (user?.phone_number)
    return (
      <div className="flex h-screen items-center justify-center font-bold text-green-600">
        انتقال به برنامه...
      </div>
    );

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-4 text-3xl font-black text-gray-800">سلام! 👋</h1>

        <p className="mb-8 text-lg leading-relaxed font-semibold text-gray-600">
          ما برای ثبت هویت شما در آزمون‌ها، <br />
          به شماره همراهتون نیاز داریم. <br />
          لطفا با ما به اشتراک بذارید...
        </p>

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
