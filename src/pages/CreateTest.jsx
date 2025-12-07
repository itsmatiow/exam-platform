import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Button from "../ui/Button";
import Question from "../ui/Question";
import Switch from "../ui/Switch";
import DatePicker from "../components/DatePicker.jsx";
import jalaali from "jalaali-js";

// --- Helper Functions ---

// Converts Persian digits to English digits for calculations
const toEng = (str) =>
  String(str).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));

export default function CreateTest() {
  // --- 1. State Management ---
  const [test, setTest] = useState({
    title: "",
    description: "",
    duration: 30,
    start: new Date().toISOString(), // Defaults to current time
    end: null,
    reviewable: false,
    questions: [],
  });

  // --- 2. Side Effects ---

  // Ensure there is at least one question when the component mounts
  useEffect(() => {
    if (test.questions.length === 0) {
      addQuestion();
    }
  }, []);

  // --- 3. Time & Date Handlers ---

  // Handles date selection from the DatePicker component
  const handleTime = ({ date, time }) => {
    // Convert inputs to English integers
    const pDay = parseInt(toEng(date.day));
    const pHour = parseInt(toEng(time.hour));
    const pMin = parseInt(toEng(time.minute));

    // Get month index and current Jalaali year
    const pMonth = date.monthIndex;
    const curYear = jalaali.toJalaali(new Date()).jy;

    // Convert Jalaali to Gregorian
    const { gy, gm, gd } = jalaali.toGregorian(curYear, pMonth, pDay);

    // Create Date object
    const finalDateStart = new Date(gy, gm - 1, gd, pHour, pMin);

    // Validate and update state
    if (!isNaN(finalDateStart.getTime())) {
      const isoDateStart = finalDateStart.toISOString();
      setTest((prev) => ({
        ...prev,
        start: isoDateStart,
      }));
    }
  };

  // --- 4. Form Input Handlers ---

  // Handles general input changes (Title, Description, Duration)
  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "duration") {
      value = toEng(value);
      value = value.replace(/[^0-9]/g, "");
    }
    setTest({ ...test, [name]: value });
  };

  // --- 5. Question Management Handlers ---

  // Adds a new empty question to the list
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

  // Removes a question by its ID
  const deleteQuestion = (id) => {
    setTest({
      ...test,
      questions: test.questions.filter((q) => q.id !== id),
    });
  };

  // Updates a specific field of a question
  const updateQuestion = (id, field, value) => {
    setTest({
      ...test,
      questions: test.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q,
      ),
    });
  };

  // --- 6. Submission Handler ---

  // Saves the test and its questions to Supabase
  async function saveTest(e) {
    e.preventDefault();

    // Validation
    if (!test.title.trim()) {
      alert("لطفا نام آزمون را وارد کنید");
      return;
    }

    if (!test.duration || Number(test.duration) <= 0) {
      alert("لطفا مدت زمان آزمون را به درستی وارد کنید.");
      return;
    }

    if (!test.start) {
      alert("لطفا زمان شروع آزمون را انتخاب کنید.");
      return;
    }

    if (test.questions.length === 0) {
      alert("آزمون شما هیچ سوالی ندارد! لطفا حداقل یک سوال اضافه کنید.");
      return;
    }

    for (let i = 0; i < test.questions.length; i++) {
      const q = test.questions[i];
      const qIndex = i + 1; // شماره سوال برای نمایش در پیام

      // الف) بررسی متن سوال
      if (!q.text.trim()) {
        alert(`متن سوال شماره ${qIndex} خالی است! لطفا آن را بنویسید.`);
        return;
      }

      // ب) بررسی متن گزینه‌ها (حلقه داخل حلقه)
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          alert(`در سوال شماره ${qIndex}، متن گزینه ${j + 1} خالی است!`);
          return;
        }
      }

      // ج) بررسی انتخاب گزینه صحیح
      if (!q.correctAnswer) {
        alert(`لطفا گزینه صحیح را برای سوال شماره ${qIndex} مشخص کنید.`);
        return;
      }
    }

    // Calculate End Time based on Start Time + Duration
    const startObj = new Date(test.start);
    const endObj = new Date(startObj);
    endObj.setMinutes(startObj.getMinutes() + Number(test.duration));
    const finalEndTime = endObj.toISOString();

    // Step 1: Insert Test Metadata
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
      })
      .select()
      .single();

    if (testError) {
      console.log("Error inserting test:", testError);
      alert("خطا در ذخیره آزمون");
      return;
    }

    // Step 2: Prepare and Insert Questions (Bulk Insert)
    const questionsData = test.questions.map((q) => ({
      test_id: savedTest.id,
      question_text: q.text,
      options: q.options,
      correct_option: Number(q.correctAnswer),
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionsData);

    if (questionsError) {
      console.log("Error saving questions:", questionsError);
    }

    // Step 3: Success Feedback and Reset
    alert("آزمون با موفقیت ذخیره شد!");
    const link = `${window.location.origin}/test/${savedTest.id}`;
    alert(`آزمون ساخته شد! \n لینک آزمون:\n${link}`);
    console.log("Test link:", link);
    console.log("test:", test);

    setTest({
      title: "",
      description: "",
      duration: 30,
      questions: [],
      start: new Date().toISOString(),
      end: null,
      reviewable: false,
    });
  }

  // --- 7. Render ---
  return (
    <div className="bg-gray-200 p-4 pb-8">
      <div className="rounded-lg bg-white px-2 shadow-md">
        <h1 className="pt-6 text-center text-2xl font-black">
          ایجاد آزمون جدید
        </h1>
        <form className="flex flex-col p-4" action="">
          {/* Title Input */}
          <label className="mt-2 text-lg font-semibold">نام آزمون:</label>
          <input
            type="text"
            name="title"
            value={test.title}
            onChange={handleChange}
            placeholder="عنوان آزمون خود را وارد کنید..."
            maxLength="20"
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
            placeholder="توضیحاتی برای آزمون یا نحوه پاسخگویی به آن اضافه کنید..."
            maxLength="200"
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
            min="1"
            onKeyDown={(e) => {
              if (["-", "+", "e", "E", "/", "*"].includes(e.key)) {
                e.preventDefault();
              }
            }}
            className="my-2 appearance-none rounded-lg border-1 border-gray-300 bg-white p-2 text-lg font-light outline-none focus:border-gray-500"
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

          {/* Actions Buttons */}
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

          <Button handleClick={saveTest} className="mt-2">
            ایجاد آزمون
          </Button>
        </form>
      </div>
    </div>
  );
}
