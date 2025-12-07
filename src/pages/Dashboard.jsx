import React, { Activity, useEffect, useState } from "react";
import Button from "../ui/Button";
import { supabase } from "../supabase";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("created");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

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
      console.error("error fetcxhing crated tests:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchTakenTests = async () => {
    setLoading(true);
    const allKey = Object.keys(localStorage);
    const submittedIds = allKey
      .filter((key) => key.startsWith("test_submitted_"))
      .map((key) => key.replace("test_submitted_", ""));

    if (submittedIds.length === 0) {
      setTests([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .in("id", submittedIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTests(data);
    } catch (error) {
      console.error("fetching taken test:", error);
    } finally {
      setLoading(false);
    }
    console.log("fetching taken tests...");
    setLoading(false);
    // localStorage.getItem();
  };

  useEffect(() => {
    setTests([]);
    if (activeTab === "created") fetchCreatedTests();
    else {
      fetchTakenTests();
    }
  }, [activeTab]);

  return (
    <div className="p-4 pb-8">
      <div className="m-4 flex items-center justify-around rounded-2xl bg-cyan-700 p-4 shadow-inner">
        <Button
          handleClick={() => {
            setActiveTab("created");
          }}
          className={`w-70 py-4 ${
            activeTab === "created"
              ? " !bg-white !text-xl !font-extrabold !text-black"
              : ""
          }`}
        >
          آزمون‌های ساخته شده
        </Button>
        <Button
          handleClick={() => {
            setActiveTab("taken");
          }}
          className={`w-70 py-4 ${
            activeTab === "taken"
              ? " !bg-white !text-xl !font-extrabold !text-black"
              : " !bg-cyan-700 "
          }`}
        >
          آزمون‌های داده شده
        </Button>
      </div>
      {loading ? (
        <div className="mt-8 text-center text-2xl font-extrabold">
          درحال دریافت اطلاعات...
        </div>
      ) : tests.length === 0 ? (
        <div className="mt-8 text-center text-2xl font-extrabold">
          موردی یافت نشد.
        </div>
      ) : (
        <div>
          <h1 className="mt-8 text-center text-2xl font-extrabold">
            شما آزمون‌های زیر را
            {activeTab === "created" ? " ساخته‌اید:" : " داده‌اید:"}
          </h1>
          <div className="m-8 flex flex-col items-center gap-3 rounded-2xl bg-gray-200/70 p-8 shadow-inner">
            <div className="mb-2 flex w-full items-center gap-4 px-2 text-xl font-semibold">
              <h1 className="flex-1 text-right">عنوان</h1>
              <h1 className="w-32 text-center">تاریخ ساخت</h1>
              {activeTab === "created" ? (
                <h1 className="w-28">لینک آزمون</h1>
              ) : (
                <h1 className="w-28"> مشاهده نمره</h1>
              )}
            </div>
            {/* <div className="my-4 h-1 w-full rounded-full bg-gray-700/50"></div> */}
            {tests.map((test) => (
              <div
                key={test.id}
                className="flex w-full items-center gap-4 rounded-xl bg-white p-4 text-lg shadow-sm"
              >
                <h2 className="flex-1 truncate text-right font-semibold">
                  {test.title}
                </h2>
                <p className="w-28 text-center font-light text-gray-600">
                  {new Date(test.created_at).toLocaleDateString("fa-IR")}
                </p>
                {/* بخش دکمه‌ها */}
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
                      className="w-full !py-2 text-base !font-bold"
                      handleClick={() =>
                        (window.location.href = `/test/${test.id}`)
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
