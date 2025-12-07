import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateTest() {
  const navigate = useNavigate();
  const [test, setTest] = useState({
    title: "",
    description: "",
    duration: 30,
    questions: [],
  });

  const addQuestion = () => {
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

  const removeQuestion = (questionId) => {
    setTest({
      ...test,
      questions: test.questions.filter((q) => q.id !== questionId),
    });
  };

  const updateQuestion = (questionId, field, value) => {
    setTest({
      ...test,
      questions: test.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    });
  };

  const updateOption = (questionId, optionId, value) => {
    setTest({
      ...test,
      questions: test.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optionId ? { ...opt, text: value } : opt
              ),
            }
          : q
      ),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!test.title.trim()) {
      alert("لطفا عنوان آزمون را وارد کنید");
      return;
    }

    if (test.questions.length === 0) {
      alert("لطفا حداقل یک سوال اضافه کنید");
      return;
    }

    for (let q of test.questions) {
      if (!q.text.trim()) {
        alert("لطفا متن تمام سوالات را وارد کنید");
        return;
      }
      if (!q.correctAnswer) {
        alert("لطفا پاسخ صحیح برای تمام سوالات را مشخص کنید");
        return;
      }
      for (let opt of q.options) {
        if (!opt.text.trim()) {
          alert("لطفا تمام گزینه‌ها را پر کنید");
          return;
        }
      }
    }

    console.log("آزمون ایجاد شد:", test);
    localStorage.setItem("currentTest", JSON.stringify(test));
    alert("آزمون با موفقیت ایجاد شد!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            ایجاد آزمون آنلاین
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                عنوان آزمون: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={test.title}
                onChange={(e) => setTest({ ...test, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: آزمون ریاضی پایه هفتم"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                توضیحات:
              </label>
              <textarea
                value={test.description}
                onChange={(e) =>
                  setTest({ ...test, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="توضیحات مختصری درباره آزمون..."
              ></textarea>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                مدت زمان آزمون (دقیقه):
              </label>
              <input
                type="number"
                value={test.duration}
                onChange={(e) =>
                  setTest({ ...test, duration: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">سوالات</h2>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  + افزودن سوال
                </button>
              </div>

              {test.questions.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  هنوز سوالی اضافه نشده است. روی دکمه "افزودن سوال" کلیک کنید.
                </p>
              )}

              {test.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-gray-50 rounded-lg p-6 mb-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">
                      سوال {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      حذف
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                      متن سوال: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(question.id, "text", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="متن سوال را وارد کنید..."
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                      گزینه‌های پاسخ: <span className="text-red-500">*</span>
                    </label>
                    {question.options.map((option, optIndex) => (
                      <div key={option.id} className="flex items-center mb-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === option.id}
                          onChange={() =>
                            updateQuestion(
                              question.id,
                              "correctAnswer",
                              option.id
                            )
                          }
                          className="ml-2"
                        />
                        <span className="ml-2 font-semibold text-gray-600">
                          {optIndex + 1}.
                        </span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) =>
                            updateOption(question.id, option.id, e.target.value)
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`گزینه ${optIndex + 1}`}
                        />
                      </div>
                    ))}
                    <p className="text-sm text-gray-500 mt-2">
                      پاسخ صحیح را با کلیک بر روی دایره کنار آن مشخص کنید
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                ذخیره و ایجاد آزمون
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
