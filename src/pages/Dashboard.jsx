import React, { useEffect, useState } from "react";
import Button from "../ui/Button";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user?.role === "admin" ? "created" : "taken",
  );
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Fetching Logic (Same as before) ---
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

  // --- New: Delete Function ---
  const deleteTest = async (testId) => {
    // 1. Ask for confirmation
    if (
      !window.confirm(
        "آیا از حذف این آزمون مطمئن هستید؟ این عملیات قابل برگشت نیست.",
      )
    ) {
      return;
    }

    try {
      // 2. Delete from Supabase
      const { error } = await supabase.from("tests").delete().eq("id", testId);

      if (error) throw error;

      // 3. Update local state to remove the item from UI
      setTests((prevTests) => prevTests.filter((t) => t.id !== testId));
      alert("آزمون با موفقیت حذف شد.");
    } catch (error) {
      console.error("Error deleting test:", error);
      alert("خطا در حذف آزمون: " + error.message);
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
                    const link = `${window.location.origin}/test/${test.id}`;
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
