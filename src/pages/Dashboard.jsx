import React, { useEffect, useState } from "react";
import Button from "../ui/Button";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import BackButton from "../components/BackButton";

const toEng = (str) =>
  String(str).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("created");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Fetching Logic (Same as before) ---
  const fetchCreatedTests = async () => {
    if (!user?.eitaa_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .eq("created_by", user.eitaa_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTests(data);
    } catch (error) {
      console.error("Error fetching created tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTakenTests = async () => {
    if (!user?.eitaa_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("results")
        .select(`*, tests (*)`)
        .eq("eitaa_id", user.eitaa_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = data.map((item) => ({
        id: item.tests.id,
        title: item.tests.title,
        created_at: item.created_at,
        resultId: item.id,
        score: item.score_percentage,
        description: item.tests.description, // Added description mapping if needed
      }));

      setTests(formattedData);
    } catch (error) {
      console.error("Error fetching taken tests:", error);
    } finally {
      setLoading(false);
    }
  };

  // تعریف آیکون‌ها بیرون از تابع یا داخل کامپوننت (برای تمیزی کد)
  const warningIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-28">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
</svg>`;

  const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-28">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>`;

  const showResults = async (testId, testTitle) => {
    Swal.fire({
      title: "درحال دریافت نتایج...",
      didOpen: () => Swal.showLoading(),
    });

    try {
      // دریافت نتایج از دیتابیس
      const { data, error } = await supabase
        .from("results")
        .select("student_name, student_id, score_percentage, created_at")
        .eq("test_id", testId)
        .order("score_percentage", { ascending: false }); // مرتب سازی بر اساس نمره

      if (error) throw error;

      if (data.length === 0) {
        Swal.fire("هنوز کسی شرکت نکرده!", "", "info");
        return;
      }

      // ساخت جدول HTML برای نمایش در آلرت
      let tableHtml = `
            <div style="overflow-x: auto;">
                <table style="width:100%; text-align: right; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #ddd;">
                            <th style="padding: 8px;">نام</th>
                            <th style="padding: 8px;">ش.دانشجویی</th>
                            <th style="padding: 8px;">نمره</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data
                          .map(
                            (row) => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;">${row.student_name || "بی‌نام"}</td>
                                <td style="padding: 8px;">${row.student_id ? toEng(row.student_id) : "-"}</td>
                                <td style="padding: 8px; font-weight: bold; color: ${row.score_percentage >= 50 ? "green" : "red"};">
                                    ٪${Math.round(row.score_percentage)}
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;

      Swal.fire({
        title: `نتایج: ${testTitle}`,
        html: tableHtml,
        width: "600px",
        confirmButtonText: "بستن",
      });
    } catch (error) {
      console.error(error);
      Swal.fire("خطا در دریافت نتایج", error.message, "error");
    }
  };

  // --- تابع حذف با SweetAlert و Supabase ---
  const deleteTest = (testId) => {
    Swal.fire({
      title: "آیا از حذف این آزمون مطمئن هستید؟",
      text: "این عملیات قابل برگشت نیست.",
      showCancelButton: true,
      cancelButtonText: "انصراف",
      confirmButtonText: "بله، حذف کن",
      iconHtml: warningIcon,
      customClass: {
        icon: "text-amber-400",
      },
      // ✅ این خط دکمه را موقع لودینگ غیرفعال می‌کند و اسپینر نشان می‌دهد
      showLoaderOnConfirm: true,

      didOpen: () => {
        const icon = Swal.getIcon();
        if (icon) {
          icon.style.border = "none";
          icon.style.background = "transparent";
        }
      },
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",

      // ✅ جادوی اصلی اینجاست: عملیات دیتابیس را قبل از بستن مدال انجام می‌دهیم
      preConfirm: async () => {
        try {
          // 1. تلاش برای حذف از دیتابیس
          const { error } = await supabase
            .from("tests")
            .delete()
            .eq("id", testId);

          if (error) {
            // اگر ارور داد، همینجا به کاربر نشان میده و مدال بسته نمیشه
            Swal.showValidationMessage(`خطا در حذف: ${error.message}`);
            return false; // عملیات ناموفق
          }

          return true; // عملیات موفق
        } catch (error) {
          Swal.showValidationMessage(`Request failed: ${error}`);
          return false;
        }
      },
      // اگر کاربر خارج از کادر کلیک کرد، لودینگ قطع نشه
      allowOutsideClick: () => !Swal.isLoading(),
    }).then((result) => {
      // ✅ فقط زمانی که عملیات دیتابیس (preConfirm) موفق بود وارد اینجا میشه
      if (result.isConfirmed && result.value === true) {
        // 2. آپدیت استیت (UI) - چون دیتابیس پاک شده، حالا از صفحه هم پاک میکنیم
        setTests((prevTests) => prevTests.filter((t) => t.id !== testId));

        // 3. نمایش پیام موفقیت (بلافاصله بعد از لودینگ)
        Swal.fire({
          title: "آزمون حذف شد!",
          iconHtml: checkIcon,
          customClass: {
            icon: "text-green-500",
          },
          didOpen: () => {
            const icon = Swal.getIcon();
            if (icon) {
              icon.style.border = "none";
              icon.style.background = "transparent";
            }
          },
          confirmButtonText: "تایید",
        });
      }
    });
  };

  useEffect(() => {
    setTests([]);
    if (activeTab === "created") fetchCreatedTests();
    else fetchTakenTests();
  }, [activeTab, user]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-8">
      <div className="m-4 flex justify-end">
        <BackButton />
      </div>
      {/* --- Tab Buttons --- */}
      <div className="m-4 flex items-center justify-around gap-2 rounded-2xl bg-cyan-700 p-4 shadow-inner max-md:flex-col">
        <Button
          handleClick={() => setActiveTab("created")}
          className={`w-full py-4 md:w-70 ${
            activeTab === "created"
              ? " !bg-white !text-xl !font-extrabold !text-black"
              : ""
          }`}
        >
          آزمون‌های ساخته شده
        </Button>
        <Button
          handleClick={() => setActiveTab("taken")}
          className={`w-full py-4 md:w-70 ${
            activeTab === "taken"
              ? " !bg-white !text-xl !font-extrabold !text-black"
              : " !bg-cyan-700 "
          }`}
        >
          آزمون‌های داده شده
        </Button>
      </div>

      {/* Floating Action Button (Only show if creating tests makes sense for user role, purely optional adjustment) */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          handleClick={() => (window.location.href = "/create")}
          className="flex h-14 w-14 items-center justify-center !rounded-full bg-cyan-600 !p-0 text-2xl shadow-xl transition-colors hover:bg-cyan-700"
        >
          +
        </Button>
      </div>

      {/* --- Content --- */}
      {loading ? (
        <div className="mt-60 text-center text-2xl font-extrabold text-gray-500">
          درحال دریافت اطلاعات...
        </div>
      ) : tests.length === 0 ? (
        <div className="mt-60 text-center text-2xl font-extrabold text-gray-400">
          موردی یافت نشد.
        </div>
      ) : (
        <div>
          <h1 className="mt-8 text-center text-2xl font-extrabold text-cyan-900">
            شما آزمون‌های زیر را
            {activeTab === "created" ? " ساخته‌اید:" : " داده‌اید:"}
          </h1>

          {tests.map((test) => (
            <div
              key={test.id}
              className="m-4 grid grid-cols-2 grid-rows-[auto_auto_auto] items-center gap-y-2 rounded-2xl bg-gray-200/70 p-4 shadow-inner"
            >
              <h2 className="col-span-1 min-w-48 truncate text-right font-bold text-gray-800">
                {test.title}
              </h2>

              <h2 className="justify-self-end text-left text-base text-gray-600">
                {new Date(test.created_at).toLocaleDateString("fa-IR")}
              </h2>

              <p className="col-span-2 my-2 text-center text-lg text-gray-700">
                {test.description || "بدون توضیحات"}
              </p>

              {/* Action Buttons Row */}
              <div className="col-span-2 mt-2 flex flex-col gap-2 sm:flex-row">
                {/* Copy Link Button */}
                <Button
                  className="group relative flex-1 overflow-hidden !py-2 text-base !font-bold"
                  handleClick={() => {
                    const botUsername = "asexam_app"; // 👈 نام کاربری ربات خودت (بدون @)
                    const appName = "app"; // 👈 نام کوتاه اپ (معمولا app هست)
                    const link = `https://eitaa.com/${botUsername}/${appName}?startapp=${test.id}`;

                    navigator.clipboard.writeText(link);
                    alert("لینک آزمون کپی شد!");
                  }}
                >
                  <span className="block w-full truncate group-hover:invisible">
                    کپی لینک آزمون
                  </span>
                  <span className="absolute inset-0 hidden items-center justify-center text-sm [direction:ltr] group-hover:flex">
                    کپی شد! ✅
                  </span>
                </Button>

                {activeTab === "created" && (
                  <Button
                    className="flex-1 border border-cyan-300 !bg-cyan-100 !py-2 text-base !font-bold !text-cyan-800 hover:!bg-cyan-200"
                    handleClick={() => showResults(test.id, test.title)}
                  >
                    📊 نتایج ({test.participant_count || "مشاهده"})
                  </Button>
                )}

                {/* Delete Button - Only shown in 'Created' tab */}
                {activeTab === "created" && (
                  <Button
                    className="flex-1 border border-red-200 !bg-red-100 !py-2 text-base !font-bold !text-red-600 transition-colors hover:!bg-red-200"
                    handleClick={() => deleteTest(test.id)}
                  >
                    حذف آزمون 🗑️
                  </Button>
                )}

                {/* Show Score for Taken Tests */}
                {activeTab === "taken" && (
                  <div className="flex-1 rounded-xl border border-green-200 bg-green-100 py-2 text-center font-bold text-green-700">
                    نمره: {test.score ? `%${test.score}` : "ثبت نشده"}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Bottom spacer */}
          <div className="h-20"></div>
        </div>
      )}
    </div>
  );
}
