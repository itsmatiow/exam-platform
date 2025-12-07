import React from "react";

export default function Question({
  q,
  questionId,
  questionNumber,
  questionDelete,
  questionUpdate,
  totalQuestions,
}) {
  return (
    <div className="my-4 flex flex-col">
      <div className="flex justify-between px-2">
        <h2 className="mt-2 text-lg font-semibold">
          سوال {questionNumber.toLocaleString("fa-IR")}
        </h2>
        {totalQuestions > 1 && (
          <button
            className="flex cursor-pointer items-center gap-2 text-lg font-semibold"
            onClick={() => questionDelete(questionId)}
          >
            حذف سوال
            <img
              src="https://img.icons8.com/?size=100&id=4XjEkmN5Mz1b&format=png&color=ff0000"
              alt="delete"
              className="w-6"
            />
          </button>
        )}
      </div>
      <textarea
        placeholder="متن سوال..."
        dir="rtl"
        className="my-2 h-33 resize-none rounded-xl border-1 border-gray-300 p-2 text-lg font-light outline-none focus:border-gray-500"
        onChange={(e) => {
          questionUpdate(questionId, "text", e.target.value);
        }}
        name={`question-${questionId}`}
      ></textarea>
      <div className="my-3 flex flex-col gap-3">
        {q.options.map((option, index) => (
          <label
            className="flex items-center justify-between gap-2 text-lg font-semibold"
            key={option.id}
          >
            <div className="flex items-center justify-center gap-2">
              <input
                type="radio"
                name={questionId}
                onChange={() =>
                  questionUpdate(questionId, "correctAnswer", option.id)
                }
              />
              <span className="w-14 text-nowrap">{`گزینه ${(index + 1).toLocaleString("fa-IR")}`}</span>
            </div>
            <input
              type="text"
              placeholder={`متن گزینه ${(index + 1).toLocaleString("fa-IR")}`}
              className="w-full rounded-lg border-1 border-gray-300 px-4 py-2 font-light focus:border-gray-500"
              // onChange={(e) => (option.text = e.target.value)}
              onChange={(e) => {
                const newOptions = q.options.map((o) =>
                  o.id === option.id ? { ...o, text: e.target.value } : o,
                );
                questionUpdate(questionId, "options", newOptions);
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
