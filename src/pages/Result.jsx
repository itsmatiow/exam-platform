import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import Button from "../ui/Button";

// تابع فارسی‌ساز اعداد
const toFarsi = (n) => n?.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

export default function Result() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [result, setResult] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("loading");

  useEffect(() => {
    if (id && user?.eitaa_id) {
      fetchFullReport();
    }
  }, [id, user]);

  const fetchFullReport = async () => {
    try {
      setLoading(true);

      // ۱. دریافت اطلاعات آزمون
      const { data: test, error: testError } = await supabase
        .from("tests")
        .select("*, questions(*)")
        .eq("id", id)
        .single();

      if (testError) throw testError;
      setTestData(test);

      // ۲. دریافت نمره کاربر
      const { data: resultData, error: resError } = await supabase
        .from("results")
        .select("*")
        .eq("test_id", id)
        .eq("eitaa_id", user.eitaa_id)
        .single();

      if (resError) {
        console.warn("نتیجه‌ای یافت نشد");
        alert("شما هنوز این آزمون را شرکت نکرده‌اید.");
        navigate(`/test/${id}`);
        return;
      }
      setResult(resultData);

      // ۳. دریافت ریزِ جواب‌های کاربر
      const { data: answersData } = await supabase
        .from("answers")
        .select("question_id, user_answer")
        .eq("test_id", id)
        .eq("eitaa_id", user.eitaa_id);

      // تبدیل آرایه به آبجکت { question_id: user_answer }
      const answersMap = {};
      if (answersData) {
        answersData.forEach((item) => {
          answersMap[item.question_id] = item.user_answer;
        });
      }
      setUserAnswers(answersMap);

      // ۴. بررسی زمان آزمون (برای نمایش کارنامه کامل)
      checkViewMode(test);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkViewMode = (test) => {
    const now = new Date().getTime();
    const endTime = new Date(test.end_time).getTime();
    if (now > endTime) {
      setViewMode("full-report");
    } else {
      setViewMode("score-only");
    }
  };

  if (loading)
    return <div className="p-10 text-center">درحال دریافت کارنامه...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-10">
      <div className="mx-auto max-w-3xl">
        {/* --- کارت نمره --- */}
        <div className="mb-6 rounded-2xl bg-white p-8 text-center shadow-md">
          <h1 className="text-2xl font-black text-cyan-800">
            {testData?.title}
          </h1>
          <div className="mt-6 flex justify-center gap-8">
            <div className="flex flex-col">
              <span className="text-gray-500">تعداد صحیح</span>
              <span className="text-3xl font-bold text-green-600">
                {toFarsi(result?.correct_answers)} /{" "}
                {toFarsi(result?.total_questions)}
              </span>
            </div>
            <div className="h-12 w-[1px] bg-gray-300"></div>
            <div className="flex flex-col">
              <span className="text-gray-500">نمره شما</span>
              <span className="text-3xl font-bold text-cyan-600">
                ٪{toFarsi(Math.round(result?.score_percentage))}
              </span>
            </div>
          </div>

          {viewMode === "score-only" && (
            <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              ⚠️ پاسخ‌نامه تشریحی پس از پایان مهلت آزمون نمایش داده می‌شود.
            </div>
          )}
        </div>

        {/* --- کارنامه تشریحی --- */}
        {viewMode === "full-report" && (
          <div className="flex flex-col gap-4">
            <h2 className="mr-2 text-lg font-bold text-gray-700">
              پاسخ‌نامه تشریحی:
            </h2>

            {testData.questions.map((q, index) => {
              // ⚠️ تبدیل حیاتی به Number برای مقایسه صحیح
              const userAnswer = Number(userAnswers[q.id]);
              const correctAnswer = Number(q.correct_option);

              const isCorrectAnswered = userAnswer === correctAnswer;
              const isSkipped = !userAnswer;

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  {/* صورت سوال */}
                  <div className="mb-4 flex gap-2">
                    <span className="font-bold text-cyan-700">
                      {toFarsi(index + 1)}.
                    </span>
                    <h3 className="leading-relaxed font-bold text-gray-800">
                      {q.question_text}
                    </h3>
                  </div>

                  {/* لیست گزینه‌ها */}
                  <div className="flex flex-col gap-3">
                    {q.options.map((opt) => {
                      // ⚠️ تبدیل حیاتی آیدی گزینه به Number
                      const optionId = Number(opt.id);

                      const isThisCorrectOpt = optionId === correctAnswer;
                      const isThisUserSelected = optionId === userAnswer;

                      // استایل پیش‌فرض (خنثی)
                      let containerStyle =
                        "border-gray-200 bg-white text-gray-600 hover:bg-gray-50";
                      let icon = null;

                      if (isThisCorrectOpt) {
                        // ✅ گزینه صحیح (سبز)
                        containerStyle =
                          "border-2 border-green-500 bg-green-50/30 text-green-800 font-bold shadow-sm";
                        icon = <span className="text-lg">✅</span>;
                      } else if (isThisUserSelected) {
                        // ❌ گزینه غلط انتخابی (قرمز)
                        containerStyle =
                          "border-2 border-red-400 bg-red-50/30 text-red-800 font-bold";
                        icon = <span className="text-lg">❌</span>;
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center justify-between gap-4 rounded-xl border p-4 text-sm transition-all ${containerStyle}`}
                        >
                          <div className="flex flex-1 flex-wrap items-center gap-2">
                            <span className="leading-6">{opt.text}</span>

                            {/* برچسب (Badge) انتخاب شما */}
                            {isThisUserSelected && (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${
                                  isThisCorrectOpt
                                    ? "border-green-300 bg-green-100 text-green-900"
                                    : "border-red-300 bg-red-100 text-red-900"
                                }`}
                              >
                                {isThisCorrectOpt
                                  ? "انتخاب صحیح"
                                  : "انتخاب شما"}
                              </span>
                            )}
                          </div>

                          <div className="w-6 flex-shrink-0 text-center">
                            {icon}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* وضعیت نهایی سوال (پایین کارت) */}
                  <div className="mt-4 flex justify-end border-t pt-3 text-xs font-bold">
                    {isSkipped ? (
                      <span className="flex items-center gap-1 text-gray-400">
                        ⚪️ بدون پاسخ
                      </span>
                    ) : isCorrectAnswered ? (
                      <span className="flex items-center gap-1 text-green-600">
                        👏 پاسخ صحیح
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500">
                        اشتباه پاسخ دادید
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 pb-8 text-center">
          <Button
            handleClick={() => navigate("/dashboard")}
            className="mx-auto w-full bg-gray-600 hover:bg-gray-700 md:w-auto md:px-12"
          >
            بازگشت به داشبورد
          </Button>
        </div>
      </div>
    </div>
  );
}
