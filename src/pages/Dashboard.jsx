// import React, { Activity, useEffect, useState } from "react";
// import Button from "../ui/Button";
// import { supabase } from "../supabase";

// export default function Dashboard() {
//   const [activeTab, setActiveTab] = useState("created");
//   const [tests, setTests] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const fetchCreatedTests = async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from("tests")
//         .select("*")
//         .order("created_at", { ascending: false });
//       if (error) throw error;
//       setTests(data);
//     } catch (error) {
//       console.error("error fetcxhing crated tests:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const fetchTakenTests = async () => {
//     setLoading(true);
//     const allKey = Object.keys(localStorage);
//     const submittedIds = allKey
//       .filter((key) => key.startsWith("test_submitted_"))
//       .map((key) => key.replace("test_submitted_", ""));

//     if (submittedIds.length === 0) {
//       setTests([]);
//       setLoading(false);
//       return;
//     }

//     try {
//       const { data, error } = await supabase
//         .from("tests")
//         .select("*")
//         .in("id", submittedIds)
//         .order("created_at", { ascending: false });
//       if (error) throw error;
//       setTests(data);
//     } catch (error) {
//       console.error("fetching taken test:", error);
//     } finally {
//       setLoading(false);
//     }
//     console.log("fetching taken tests...");
//     setLoading(false);
//     // localStorage.getItem();
//   };

//   useEffect(() => {
//     setTests([]);
//     if (activeTab === "created") fetchCreatedTests();
//     else {
//       fetchTakenTests();
//     }
//   }, [activeTab]);

//   return (
//     <div className="p-4 pb-8">
//       <div className="m-4 flex items-center justify-around rounded-2xl bg-cyan-700 p-4 shadow-inner">
//         <Button
//           handleClick={() => {
//             setActiveTab("created");
//           }}
//           className={`w-70 py-4 ${
//             activeTab === "created"
//               ? " !bg-white !text-xl !font-extrabold !text-black"
//               : ""
//           }`}
//         >
//           آزمون‌های ساخته شده
//         </Button>
//         <Button
//           handleClick={() => {
//             setActiveTab("taken");
//           }}
//           className={`w-70 py-4 ${
//             activeTab === "taken"
//               ? " !bg-white !text-xl !font-extrabold !text-black"
//               : " !bg-cyan-700 "
//           }`}
//         >
//           آزمون‌های داده شده
//         </Button>
//       </div>
//       {loading ? (
//         <div className="mt-8 text-center text-2xl font-extrabold">
//           درحال دریافت اطلاعات...
//         </div>
//       ) : tests.length === 0 ? (
//         <div className="mt-8 text-center text-2xl font-extrabold">
//           موردی یافت نشد.
//         </div>
//       ) : (
//         <div>
//           <h1 className="mt-8 text-center text-2xl font-extrabold">
//             شما آزمون‌های زیر را
//             {activeTab === "created" ? " ساخته‌اید:" : " داده‌اید:"}
//           </h1>
//           <div className="m-8 flex flex-col items-center gap-3 rounded-2xl bg-gray-200/70 p-8 shadow-inner">
//             <div className="mb-2 flex w-full items-center gap-4 px-2 text-xl font-semibold">
//               <h1 className="flex-1 text-right">عنوان</h1>
//               <h1 className="w-32 text-center">تاریخ ساخت</h1>
//               {activeTab === "created" ? (
//                 <h1 className="w-28">لینک آزمون</h1>
//               ) : (
//                 <h1 className="w-28"> مشاهده نمره</h1>
//               )}
//             </div>
//             {/* <div className="my-4 h-1 w-full rounded-full bg-gray-700/50"></div> */}
//             {tests.map((test) => (
//               <div
//                 key={test.id}
//                 className="flex w-full items-center gap-4 rounded-xl bg-white p-4 text-lg shadow-sm"
//               >
//                 <h2 className="flex-1 truncate text-right font-semibold">
//                   {test.title}
//                 </h2>
//                 <p className="w-28 text-center font-light text-gray-600">
//                   {new Date(test.created_at).toLocaleDateString("fa-IR")}
//                 </p>
//                 {/* بخش دکمه‌ها */}
//                 <div className="flex w-28 justify-center">
//                   {activeTab === "created" ? (
//                     <Button
//                       className="w-full !py-2 text-base !font-bold"
//                       handleClick={() => {
//                         const link = `${window.location.origin}/test/${test.id}`;
//                         navigator.clipboard.writeText(link);
//                         alert("لینک آزمون کپی شد!");
//                       }}
//                     >
//                       کپی لینک
//                     </Button>
//                   ) : (
//                     <Button
//                       className="w-full !py-2 text-base !font-bold"
//                       handleClick={() =>
//                         (window.location.href = `/result/${test.id}`)
//                       }
//                     >
//                       مشاهده
//                     </Button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// ------------------------------------------------------------------------------
import React, { useEffect, useState } from "react";
import Button from "../ui/Button";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext"; // 👈 اضافه شد

export default function Dashboard() {
  const { user } = useAuth(); // 👈 گرفتن آیدی کاربر لاگین شده
  // const [activeTab, setActiveTab] = useState("created");
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" ? "created" : "taken",
  );
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- 1. دریافت آزمون‌های ساخته شده (همه آزمون‌ها) ---
  const fetchCreatedTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTests(data);
    } catch (error) {
      console.error("Error fetching created tests:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. دریافت آزمون‌های داده شده (نمرات من) ---
  const fetchTakenTests = async () => {
    // اگر کاربر لاگین نیست یا آیدی ندارد، کاری نکن
    if (!user?.eitaa_id) return;

    setLoading(true);
    try {
      // دریافت نتایج از جدول results (فقط مال خودم) + اطلاعات آزمون مربوطه
      const { data, error } = await supabase
        .from("results")
        .select(
          `
          *,
          tests (*)
        `,
        )
        .eq("eitaa_id", user.eitaa_id) // فیلتر روی آیدی من
        .order("created_at", { ascending: false });

      if (error) throw error;

      // فرمت‌دهی دیتا برای اینکه مثل آرایه tests معمولی بشه
      const formattedData = data.map((item) => ({
        id: item.tests.id, // آیدی آزمون (برای لینک)
        title: item.tests.title,
        created_at: item.created_at, // تاریخ امتحان دادن
        resultId: item.id, // آیدی نتیجه
        score: item.score_percentage, // نمره
      }));

      setTests(formattedData);
    } catch (error) {
      console.error("Error fetching taken tests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTests([]);
    if (activeTab === "created") fetchCreatedTests();
    else fetchTakenTests();
  }, [activeTab, user]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-8">
      {/* --- Tab Buttons --- */}
      {/* <div className="m-4 flex items-center justify-around rounded-2xl bg-cyan-700 p-4 shadow-inner">
        <Button
          handleClick={() => setActiveTab("created")}
          className={`w-70 py-4 ${
            activeTab === "created"
              ? " !bg-white !text-xl !font-extrabold !text-black"
              : ""
          }`}
        >
          آزمون‌های ساخته شده
        </Button>
        <Button
          handleClick={() => setActiveTab("taken")}
          className={`w-70 py-4 ${
            activeTab === "taken"
              ? " !bg-white !text-xl !font-extrabold !text-black"
              : " !bg-cyan-700 "
          }`}
        >
          آزمون‌های داده شده
        </Button>
      </div> */}

      <div className="m-4 flex items-center justify-around rounded-2xl bg-cyan-700 p-4 shadow-inner">
        {/* 🔒 فقط اگر ادمین بود این تب رو نشون بده */}
        {user?.role === "admin" && (
          <Button
            handleClick={() => setActiveTab("created")}
            className={`w-70 py-4 ${activeTab === "created" ? " !bg-white !text-black" : ""}`}
          >
            آزمون‌های ساخته شده
          </Button>
        )}

        <Button
          handleClick={() => setActiveTab("taken")}
          className={`w-70 py-4 ${activeTab === "taken" ? " !bg-white !text-black" : " !bg-cyan-700 "}`}
        >
          آزمون‌های داده شده
        </Button>
      </div>

      {/* --- دکمه شناور ساخت آزمون (Floating Action Button) --- */}
      {/* این دکمه رو فقط برای ادمین بذار */}
      {user?.role === "admin" && activeTab === "created" && (
        <div className="fixed bottom-6 left-6 z-50">
          <Button
            handleClick={() => (window.location.href = "/create")}
            className="flex h-14 w-14 items-center justify-center !rounded-full bg-cyan-600 !p-0 text-2xl shadow-xl"
          >
            +
          </Button>
        </div>
      )}

      {/* --- Content --- */}
      {loading ? (
        <div className="mt-8 text-center text-2xl font-extrabold text-gray-500">
          درحال دریافت اطلاعات...
        </div>
      ) : tests.length === 0 ? (
        <div className="mt-8 text-center text-2xl font-extrabold text-gray-400">
          موردی یافت نشد.
        </div>
      ) : (
        <div>
          <h1 className="mt-8 text-center text-2xl font-extrabold text-cyan-900">
            شما آزمون‌های زیر را
            {activeTab === "created" ? " ساخته‌اید:" : " داده‌اید:"}
          </h1>

          <div className="m-8 flex flex-col items-center gap-3 rounded-2xl bg-gray-200/70 p-8 shadow-inner">
            {/* --- Header Row --- */}
            <div className="mb-2 flex w-full items-center gap-4 px-4 text-xl font-semibold text-gray-700">
              <h1 className="flex-1 text-right">عنوان</h1>
              <h1 className="w-32 text-center">تاریخ</h1>
              {activeTab === "created" ? (
                <h1 className="w-28 text-center">لینک آزمون</h1>
              ) : (
                <h1 className="w-28 text-center">مشاهده نمره</h1>
              )}
            </div>

            {/* --- List Items --- */}
            {tests.map((test) => (
              <div
                key={test.id || test.resultId}
                className="flex w-full items-center gap-4 rounded-xl bg-white p-4 text-lg shadow-sm transition hover:shadow-md"
              >
                {/* 1. Title + Score Badge */}
                <h2 className="flex-1 truncate text-right font-semibold text-gray-800">
                  {test.title}
                  {/* اگر تب نمرات است، نمره را هم نمایش بده */}
                  {activeTab === "taken" && (
                    <span className="mr-3 rounded-md bg-green-100 px-2 py-1 text-sm text-green-700">
                      ٪{Math.round(test.score)}
                    </span>
                  )}
                </h2>

                {/* 2. Date */}
                <p className="w-28 text-center text-base font-light text-gray-600">
                  {new Date(test.created_at).toLocaleDateString("fa-IR")}
                </p>

                {/* 3. Button */}
                <div className="flex w-28 justify-center">
                  {activeTab === "created" ? (
                    <Button
                      className="w-full !py-2 text-base !font-bold"
                      handleClick={() => {
                        const link = `${window.location.origin}/test/${test.id}`;
                        navigator.clipboard.writeText(link);
                        alert("لینک آزمون کپی شد!");
                      }}
                    >
                      کپی لینک
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-cyan-50 !px-4 !py-2 text-xs text-cyan-700 hover:bg-cyan-100"
                      // 👈 لینک اصلاح شده برای رفتن به صفحه نتیجه
                      handleClick={() =>
                        (window.location.href = `/result/${test.id}`)
                      }
                    >
                      مشاهده
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
