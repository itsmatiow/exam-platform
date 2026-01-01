import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Button from "../ui/Button";
import Question from "../ui/Question";
import Switch from "../ui/Switch";
import DatePicker from "../components/DatePicker.jsx";
import jalaali from "jalaali-js";
import BackButton from "../components/BackButton.jsx";

// --- Helper Functions ---
const toEng = (str) =>
  String(str).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

export default function CreateTest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [test, setTest] = useState({
    title: "",
    description: "",
    duration: 30,
    start: new Date().toISOString(),
    end: null,
    reviewable: false,
    questions: [],
  });
  const BOT_TOKEN = import.meta.env.VITE_EITAA_BOT_TOKEN;

  // اطمینان از وجود حداقل یک سوال هنگام لود صفحه
  useEffect(() => {
    if (test.questions.length === 0) {
      addQuestion();
    }
  }, []);

  // --- Handlers ---

  const handleTime = ({ date, time }) => {
    // تبدیل اعداد فارسی به انگلیسی برای محاسبه
    const pDay = parseInt(toEng(date.day));
    const pHour = parseInt(toEng(time.hour));
    const pMin = parseInt(toEng(time.minute));
    const pMonth = date.monthIndex; // ایندکس ماه (0 تا 11)

    // گرفتن سال جاری شمسی
    const curYear = jalaali.toJalaali(new Date()).jy;

    // تبدیل به میلادی برای ساخت آبجکت Date
    const { gy, gm, gd } = jalaali.toGregorian(curYear, pMonth, pDay);
    const finalDateStart = new Date(gy, gm - 1, gd, pHour, pMin);

    if (!isNaN(finalDateStart.getTime())) {
      const isoDateStart = finalDateStart.toISOString();
      setTest((prev) => ({
        ...prev,
        start: isoDateStart,
      }));
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "duration") {
      value = toEng(value);
      value = value.replace(/[^0-9]/g, "");
    }
    setTest({ ...test, [name]: value });
  };

  const addQuestion = (e) => {
    if (e) e.preventDefault();
    const newQuestion = {
      id: Date.now(),
      text: "",
      options: [
        { id: "1", text: "" },
        { id: "2", text: "" },
        { id: "3", text: "" },
        { id: "4", text: "" },
      ],
      correctAnswer: "",
    };
    setTest({ ...test, questions: [...test.questions, newQuestion] });
  };

  const deleteQuestion = (id) => {
    setTest({
      ...test,
      questions: test.questions.filter((q) => q.id !== id),
    });
  };

  const updateQuestion = (id, field, value) => {
    setTest({
      ...test,
      questions: test.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q,
      ),
    });
  };

  const sendConfirmationMessage = async (testId, testTitle) => {
    try {
      const botUsername = "asexam_app"; // نام کاربری ربات
      const appName = "app";
      // لینک مستقیم به آزمون
      const link = `https://eitaa.com/${botUsername}/${appName}?startapp=${testId}`;

      // متن پیام
      const messageText = `
✅ آزمون جدید با موفقیت ساخته شد!

📝 عنوان: ${testTitle}
⏳ مدت زمان: ${test.duration} دقیقه

🔗 لینک شرکت در آزمون:
${link}

میتوانید این پیام را برای دانشجویان فوروارد کنید.
      `.trim();

      // ارسال درخواست به ایتایار
      const response = await fetch("https://eitaayar.ir/api/app/sendMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: BOT_TOKEN,
          chat_id: user.eitaa_id, // آیدی عددی کاربر که در AuthContext داریم
          text: messageText,
        }),
      });

      const result = await response.json();
      console.log("Eitaa Message Result:", result);

      if (!result.ok) {
        console.error("خطا در ارسال پیام ایتا:", result);
      }
    } catch (error) {
      console.error("خطا در ارتباط با ایتایار:", error);
    }
  };

  // --- Submission Handler (Logic with Swal) ---
  async function saveTest(e) {
    e.preventDefault();

    // 1. Validations
    if (!test.title.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "توجه",
        text: "عنوان آزمون الزامی است",
        confirmButtonText: "تایید",
      });
    }
    if (!test.duration || Number(test.duration) <= 0) {
      return Swal.fire({
        icon: "warning",
        title: "توجه",
        text: "مدت زمان نامعتبر است",
        confirmButtonText: "تایید",
      });
    }
    if (!test.start) {
      return Swal.fire({
        icon: "warning",
        title: "توجه",
        text: "لطفا زمان شروع را انتخاب کنید",
        confirmButtonText: "تایید",
      });
    }
    if (test.questions.length === 0) {
      return Swal.fire({
        icon: "warning",
        title: "توجه",
        text: "حداقل یک سوال اضافه کنید",
        confirmButtonText: "تایید",
      });
    }

    for (let i = 0; i < test.questions.length; i++) {
      const q = test.questions[i];
      if (!q.text.trim()) {
        return Swal.fire({
          icon: "warning",
          title: "سوال ناقص",
          text: `متن سوال شماره ${i + 1} خالی است`,
          confirmButtonText: "تایید",
        });
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          return Swal.fire({
            icon: "warning",
            title: "گزینه ناقص",
            text: `گزینه ${j + 1} در سوال ${i + 1} خالی است`,
            confirmButtonText: "تایید",
          });
        }
      }
      if (!q.correctAnswer) {
        return Swal.fire({
          icon: "warning",
          title: "پاسخ صحیح را انتخاب کنید",
          text: `لطفا گزینه صحیح سوال ${i + 1} را مشخص کنید`,
          confirmButtonText: "تایید",
        });
      }
    }

    // 2. Start Loading
    setIsSubmitting(true);

    // باز کردن مدال لودینگ
    Swal.fire({
      title: "درحال ساخت آزمون...",
      html: "لطفا چند لحظه صبر کنید",
      allowOutsideClick: false,
      allowEscapeKey: false,
      draggable: true,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // محاسبه زمان پایان
      const startObj = new Date(test.start);
      const endObj = new Date(startObj);
      endObj.setMinutes(startObj.getMinutes() + Number(test.duration));
      const finalEndTime = endObj.toISOString();

      // Step A: Insert Test
      const { data: savedTest, error: testError } = await supabase
        .from("tests")
        .insert({
          title: test.title,
          created_at: new Date(),
          description: test.description,
          duration_minutes: Number(test.duration),
          start_time: test.start,
          end_time: finalEndTime,
          reviewable: test.reviewable,
          created_by: user.eitaa_id,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Step B: Insert Questions
      const questionsData = test.questions.map((q) => ({
        test_id: savedTest.id,
        question_text: q.text,
        options: q.options,
        correct_option: Number(q.correctAnswer),
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsData);

      if (questionsError) throw questionsError;
      const botUsername = "asexam_app"; // 👈 نام کاربری ربات خودت (بدون @)
      const appName = "app"; // 👈 نام کوتاه اپ (معمولا app هست)
      const link = `https://eitaa.com/${botUsername}/${appName}?startapp=${savedTest.id}`;
      navigator.clipboard.writeText(link);
      sendConfirmationMessage(savedTest.id, test.title);
      // 3. Success -> Show Success Modal -> Navigate
      await Swal.fire({
        title: "آزمون ساخته شد! 🎉",
        text: "در حال انتقال به داشبورد...",
        icon: "success",
        draggable: true,
        timer: 3000,
        showConfirmButton: false,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error:", error);

      // 4. Error -> Show Error Modal
      Swal.fire({
        title: "خطا در ساخت آزمون",
        text: error.message || "مشکلی پیش آمده است",
        icon: "error",
        draggable: true,
        confirmButtonText: "باشه",
      });

      setIsSubmitting(false); // فعال کردن دوباره دکمه در صورت خطا
    }
  }

  // --- Render ---
  return (
    <div className="bg-gray-200 p-4 pb-8">
      <div className="rounded-lg bg-white px-2 shadow-md">
        <div className="flex justify-between px-4 pt-4">
          <h1 className="pt-6 text-center text-2xl font-black">آزمون جدید</h1>
          <BackButton className="mt-4" />
        </div>
        <form className="flex flex-col p-4">
          {/* Title Input */}
          <label className="mt-2 text-lg font-semibold">نام آزمون:</label>
          <input
            type="text"
            name="title"
            value={test.title}
            onChange={handleChange}
            placeholder="عنوان آزمون..."
            className="my-2 rounded-lg border-1 border-gray-300 bg-white p-2 text-lg font-light outline-none focus:border-gray-500"
          />

          {/* Description Input */}
          <label className="mt-2 text-lg font-semibold">
            توضیحات: (اختیاری)
          </label>
          <textarea
            name="description"
            value={test.description}
            onChange={handleChange}
            placeholder="توضیحات..."
            dir="rtl"
            className="my-2 h-33 resize-none rounded-lg border-1 border-gray-300 bg-white px-3 py-2 text-lg font-light outline-none focus:border-gray-500"
          ></textarea>

          {/* Duration Input */}
          <label className="mt-2 text-lg font-semibold">زمان آزمون:</label>
          <input
            type="text"
            inputMode="numeric"
            name="duration"
            value={test.duration}
            onChange={handleChange}
            className="my-2 rounded-lg border-1 border-gray-300 bg-white p-2 text-lg font-light outline-none focus:border-gray-500"
          />

          {/* Date Picker */}
          <div>
            <DatePicker onChange={handleTime} />
          </div>

          {/* Reviewable Switch */}
          <div className="mt-3 flex items-center justify-between">
            <p className="mt-2 text-lg font-bold">
              دسترسی به سوالات قبلی مجاز باشد
            </p>
            <Switch
              checked={test.reviewable}
              onChange={(val) =>
                setTest((prev) => ({ ...prev, reviewable: val }))
              }
            />
          </div>

          <div className="mt-6 w-full self-center rounded-full border-t-2 border-cyan-700"></div>

          {/* Questions List */}
          <h1 className="mt-4 flex justify-center text-2xl font-bold">
            سوالات
          </h1>
          {test.questions.map((q, index) => (
            <Question
              q={q}
              key={q.id}
              questionId={q.id}
              questionNumber={index + 1}
              questionDelete={deleteQuestion}
              questionUpdate={updateQuestion}
              totalQuestions={test.questions.length}
            />
          ))}

          {/* Add Question Button */}
          <Button className="mt-4" handleClick={addQuestion}>
            <p className="flex gap-1 font-semibold text-nowrap">
              افزودن سوال
              <img
                className="h-5 w-5 self-center"
                src="https://img.icons8.com/?size=100&id=84991&format=png&color=ffffff"
                alt="add"
              />
            </p>
          </Button>

          {/* Submit Button (Simplified as requested) */}
          <Button
            handleClick={saveTest}
            className={`mt-2 transition-opacity ${
              isSubmitting ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isSubmitting}
          >
            ایجاد آزمون
          </Button>
        </form>
      </div>
    </div>
  );
}
