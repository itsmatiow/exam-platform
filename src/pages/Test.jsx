// /* eslint-disable react-hooks/exhaustive-deps */
// import React, { useEffect, useState } from "react";
// import { supabase } from "../supabase";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate, useParams } from "react-router-dom";
// import Button from "../ui/Button";

// // --- Utility Functions ---

// const toFarsi = (str) => {
//   const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
//   return str.toString().replace(/[0-9]/g, (d) => farsiDigits[parseInt(d)]);
// };

// const formatTime = (sec) => {
//   if (sec === null) return "۰۰:۰۰";
//   const m = Math.floor(sec / 60);
//   const s = sec % 60;
//   const englishTime = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
//   return toFarsi(englishTime);
// };

// export default function Test() {
//   // --- State ---
//   const [testData, setTestData] = useState(null);
//   const [status, setStatus] = useState("loading"); // loading | checking | waiting | active | finished
//   const [timer, setTimer] = useState(null);
//   const [curQIndex, setCurQIndex] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [score, setScore] = useState(null);

//   const { user } = useAuth(); // گرفتن اطلاعات کاربر

//   const navigate = useNavigate();

//   const { id } = useParams();

//   // LocalStorage Keys
//   const STORAGE_KEY_ANSWERS = `test_answers_${id}`;
//   const STORAGE_KEY_SUBMITTED = `test_submitted_${id}`;

//   // --- Effects ---

//   // 1. Initial Load & Auth Check
//   useEffect(() => {
//     if (id) {
//       const isSubmitted = localStorage.getItem(STORAGE_KEY_SUBMITTED);
//       if (isSubmitted === "true") {
//         setStatus("finished");
//       } else {
//         fetchTest();
//         loadSavedAnswers();
//       }
//     }
//   }, [id]);

//   // 2. Timer Logic
//   useEffect(() => {
//     if (status === "finished" || timer === null) return;

//     const interval = setInterval(() => {
//       setTimer((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           handleTimeFinish();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [status, timer]);

//   // --- Logic Helpers ---

//   const loadSavedAnswers = () => {
//     const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
//     if (savedAnswers) {
//       setAnswers(JSON.parse(savedAnswers));
//     }
//   };

//   const fetchTest = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("tests")
//         .select("*, questions(*)")
//         .eq("id", id)
//         .single();

//       if (error) throw error;

//       setTestData(data);
//       checkTimeStatus(data);
//     } catch (error) {
//       console.error("Error fetching test:", error);
//       alert("آزمون پیدا نشد یا مشکلی پیش آمده!");
//     }
//   };

//   const checkTimeStatus = (test) => {
//     const now = new Date().getTime();
//     const start = new Date(test.start_time).getTime();
//     const end = new Date(test.end_time).getTime();

//     if (now < start) {
//       setStatus("waiting");
//       setTimer(Math.floor((start - now) / 1000));
//     } else if (now >= start && now < end) {
//       setStatus("active");
//       setTimer(Math.floor((end - now) / 1000));
//     } else {
//       setStatus("finished");
//       setTimer(0);
//     }
//   };

//   const handleTimeFinish = () => {
//     if (status === "waiting") {
//       checkTimeStatus(testData); // Refresh status to active
//     } else if (status === "active") {
//       setStatus("finished");
//       // Optional: Auto-submit logic here if needed
//     }
//   };

//   const handleOptionSelect = (qId, optionId) => {
//     setAnswers((prev) => {
//       const newAnswers = { ...prev, [qId]: optionId };
//       localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(newAnswers));
//       return newAnswers;
//     });
//   };

//   const submitExam = async () => {
//     // 1. Set Local Flags
//     localStorage.removeItem(STORAGE_KEY_ANSWERS);
//     localStorage.setItem(STORAGE_KEY_SUBMITTED, "true");

//     // 2. Calculate Score
//     let correctCount = 0;
//     const totalQuestions = testData.questions.length;

//     const answersPayload = testData.questions.map((q) => {
//       const userAnswerId = answers[q.id];
//       const userAnsNum = Number(userAnswerId);

//       if (userAnsNum === q.correct_option) {
//         correctCount++;
//       }
//       return {
//         test_id: id,
//         eitaa_id: user.eitaa_id,
//         question_id: q.id,
//         user_answer: userAnsNum || null,
//       };
//     });

//     const percentage = (correctCount / totalQuestions) * 100;

//     // 3. Send to Supabase
//     try {
//       // Save Result
//       const { error: resultError } = await supabase.from("results").insert({
//         test_id: id,
//         eitaa_id: user.eitaa_id,
//         total_questions: totalQuestions,
//         correct_answers: correctCount,
//         score_percentage: percentage,
//       });
//       if (resultError) throw resultError;

//       // Save Detailed Answers
//       const { error: answersError } = await supabase
//         .from("answers")
//         .insert(answersPayload);
//       if (answersError) throw answersError;

//       setScore({
//         correct: correctCount,
//         total: totalQuestions,
//         percentage: percentage,
//       });
//       setStatus("finished");

//       // Optional: Show score in alert
//       // alert(`نمره شما: ${correctCount} از ${totalQuestions}`);
//     } catch (error) {
//       console.error("Error submitting exam:", error);
//       // Even on error, we finish the exam to prevent stuck state
//       setStatus("finished");
//     }
//   };

//   // --- Views ---

//   if (status === "loading") {
//     return (
//       <div className="p-10 text-center text-xl">
//         ⏳ در حال دریافت اطلاعات آزمون...
//       </div>
//     );
//   }

//   if (status === "finished") {
//     return (
//       <div className="flex h-screen items-center justify-center bg-gray-100">
//         <div className="rounded-xl bg-white p-10 text-center shadow-lg">
//           <h1 className="text-3xl font-black text-cyan-700">پایان آزمون</h1>
//           {score ? (
//             <div className="mt-8">
//               <p className="text-3xl font-black">
//                 نمره شما: {toFarsi(score.correct)} از {toFarsi(score.total)}
//               </p>
//               <p className="mt-4 text-xl text-gray-700">
//                 درصد: ٪{toFarsi(Math.round(score.percentage))}
//               </p>
//               <Button
//                 className="mt-8 flex w-full items-center justify-center text-2xl"
//                 handleClick={() => navigate("/")}
//               >
//                 بازگشت
//               </Button>
//             </div>
//           ) : (
//             <p className="mt-4">آزمون شما قبلاً ثبت شده است.</p>
//           )}
//           {/* <p className="mt-4 text-xl text-gray-600">
//             زمان آزمون به پایان رسیده است.
//           </p> */}
//         </div>
//       </div>
//     );
//   }

//   if (status === "waiting") {
//     return (
//       <div className="flex h-screen flex-col items-center justify-center bg-blue-50">
//         <h1 className="text-center text-2xl font-bold">
//           آزمون {testData?.title} <br />
//           هنوز شروع نشده است.
//         </h1>
//         <div className="mt-8 text-5xl font-bold text-cyan-700">
//           {formatTime(timer)}
//         </div>
//         <p className="mt-2 text-lg font-bold text-gray-500">مانده تا شروع...</p>
//       </div>
//     );
//   }

//   // Active View
//   const currentQuestion = testData?.questions[curQIndex];

//   return (
//     <div className="min-h-screen bg-gray-200 p-4 pb-8">
//       {/* Header */}
//       <div className="sticky top-0 mb-4 flex items-center justify-between rounded-lg bg-white p-4 px-2 shadow-md">
//         <span className="text-xl font-bold text-gray-700">
//           سوال {toFarsi(curQIndex + 1)} از {toFarsi(testData?.questions.length)}
//         </span>
//         <div className="rounded-lg bg-red-50 px-4 py-2 text-xl font-bold text-red-600">
//           {formatTime(timer)}
//         </div>
//       </div>

//       {/* Question Text */}
//       <div className="mb-8 flex min-h-[200px] items-center justify-center rounded-lg bg-white p-4 px-2 text-center text-2xl font-black shadow-md">
//         <h2>{currentQuestion?.question_text}</h2>
//       </div>

//       {/* Options */}
//       <div>
//         {currentQuestion?.options.map((option) => {
//           const isSelected = answers[currentQuestion.id] === option.id;
//           return (
//             <div
//               key={option.id}
//               onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
//               dir="rtl"
//               className={`mb-4 flex cursor-pointer items-center gap-4 rounded-lg border-1 p-4 text-right transition-all ${
//                 isSelected
//                   ? " border-white bg-cyan-700 text-white"
//                   : " border-gray-400 bg-cyan-50 text-black"
//               }`}
//             >
//               <div
//                 className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${isSelected ? "border-white" : "border-cyan-700"}`}
//               >
//                 {isSelected && (
//                   <div className="h-2 w-2 rounded-full bg-white"></div>
//                 )}
//               </div>
//               <span>{option.text}</span>
//             </div>
//           );
//         })}
//       </div>

//       {/* Navigation Buttons */}
//       <div className="mt-8 flex justify-between">
//         <Button
//           disabled={curQIndex === 0 || !testData.reviewable}
//           handleClick={() => setCurQIndex((prev) => prev - 1)}
//           className={`w-40 border-2 transition-colors ${
//             curQIndex === 0 || !testData.reviewable
//               ? "cursor-not-allowed border-transparent bg-gray-500 hover:bg-gray-400"
//               : "border-cyan-700 text-cyan-700 hover:bg-cyan-800"
//           }`}
//         >
//           سوال قبلی
//         </Button>

//         {curQIndex === testData.questions.length - 1 ? (
//           <Button
//             handleClick={submitExam}
//             className="w-40 bg-green-600 px-8 hover:bg-green-700"
//           >
//             اتمام آزمون
//           </Button>
//         ) : (
//           <Button
//             handleClick={() => setCurQIndex((prev) => prev + 1)}
//             className="w-40 px-8"
//           >
//             سوال بعدی
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// }

// -------------------
// ---------------------
// import React, { useEffect, useState } from "react";
// import { supabase } from "../supabase";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate, useParams } from "react-router-dom";
// import Button from "../ui/Button";

// // --- Utility Functions ---

// const toFarsi = (str) => {
//   const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
//   return str.toString().replace(/[0-9]/g, (d) => farsiDigits[parseInt(d)]);
// };

// const formatTime = (sec) => {
//   if (sec === null) return "۰۰:۰۰";
//   const m = Math.floor(sec / 60);
//   const s = sec % 60;
//   const englishTime = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
//   return toFarsi(englishTime);
// };

// export default function Test() {
//   // --- State ---
//   const [testData, setTestData] = useState(null);
//   const [status, setStatus] = useState("loading"); // loading | checking | waiting | active | finished
//   const [timer, setTimer] = useState(null);
//   const [curQIndex, setCurQIndex] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [score, setScore] = useState(null);

//   // 👈 استیت جدید برای جلوگیری از ارسال تکراری
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const { id } = useParams();

//   // LocalStorage Keys
//   const STORAGE_KEY_ANSWERS = `test_answers_${id}`;
//   const STORAGE_KEY_SUBMITTED = `test_submitted_${id}`;

//   // --- Effects ---

//   // 1. Initial Load & Auth Check
//   useEffect(() => {
//     if (id) {
//       const isSubmitted = localStorage.getItem(STORAGE_KEY_SUBMITTED);
//       if (isSubmitted === "true") {
//         setStatus("finished");
//       } else {
//         fetchTest();
//         loadSavedAnswers();
//       }
//     }
//   }, [id]);

//   // 2. Timer Logic
//   useEffect(() => {
//     if (status === "finished" || timer === null) return;

//     const interval = setInterval(() => {
//       setTimer((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           handleTimeFinish(); // وقتی زمان تموم شد
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [status, timer]);

//   // 👈 3. جلوگیری از خروج تصادفی (Refresh/Back)
//   useEffect(() => {
//     const handleBeforeUnload = (e) => {
//       if (status === "active") {
//         e.preventDefault();
//         e.returnValue = ""; // استاندارد مرورگرها برای نمایش پیام هشدار
//       }
//     };
//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
//   }, [status]);

//   // --- Logic Helpers ---

//   const loadSavedAnswers = () => {
//     const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
//     if (savedAnswers) {
//       setAnswers(JSON.parse(savedAnswers));
//     }
//   };

//   const fetchTest = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("tests")
//         .select("*, questions(*)")
//         .eq("id", id)
//         .single();

//       if (error) throw error;

//       setTestData(data);
//       checkTimeStatus(data);
//     } catch (error) {
//       console.error("Error fetching test:", error);
//       alert("آزمون پیدا نشد یا مشکلی پیش آمده!");
//     }
//   };

//   const checkTimeStatus = (test) => {
//     const now = new Date().getTime();
//     const start = new Date(test.start_time).getTime();
//     const end = new Date(test.end_time).getTime();

//     if (now < start) {
//       setStatus("waiting");
//       setTimer(Math.floor((start - now) / 1000));
//     } else if (now >= start && now < end) {
//       setStatus("active");
//       setTimer(Math.floor((end - now) / 1000));
//     } else {
//       setStatus("finished");
//       setTimer(0);
//     }
//   };

//   const handleTimeFinish = () => {
//     if (status === "waiting") {
//       checkTimeStatus(testData); // Refresh status to active
//     } else if (status === "active") {
//       // 👈 وقتی زمان تموم شد، خودکار سابمیت کن
//       submitExam();
//     }
//   };

//   const handleOptionSelect = (qId, optionId) => {
//     // اگر در حال سابمیت هستیم، اجازه تغییر گزینه نده
//     if (isSubmitting) return;

//     setAnswers((prev) => {
//       const newAnswers = { ...prev, [qId]: optionId };
//       localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(newAnswers));
//       return newAnswers;
//     });
//   };

//   const submitExam = async () => {
//     // 👈 جلوگیری از ارسال مجدد
//     if (isSubmitting) return;
//     setIsSubmitting(true);

//     // 1. Set Local Flags
//     localStorage.removeItem(STORAGE_KEY_ANSWERS);
//     localStorage.setItem(STORAGE_KEY_SUBMITTED, "true");

//     // 2. Calculate Score
//     let correctCount = 0;
//     const totalQuestions = testData.questions.length;

//     const answersPayload = testData.questions.map((q) => {
//       const userAnswerId = answers[q.id];
//       const userAnsNum = Number(userAnswerId);

//       if (userAnsNum === q.correct_option) {
//         correctCount++;
//       }
//       return {
//         test_id: id,
//         eitaa_id: user.eitaa_id,
//         question_id: q.id,
//         user_answer: userAnsNum || null,
//       };
//     });

//     const percentage = (correctCount / totalQuestions) * 100;

//     // 3. Send to Supabase
//     try {
//       // Save Result
//       const { error: resultError } = await supabase.from("results").insert({
//         test_id: id,
//         eitaa_id: user.eitaa_id,
//         total_questions: totalQuestions,
//         correct_answers: correctCount,
//         score_percentage: percentage,
//       });
//       if (resultError) throw resultError;

//       // Save Detailed Answers
//       const { error: answersError } = await supabase
//         .from("answers")
//         .insert(answersPayload);
//       if (answersError) throw answersError;

//       setScore({
//         correct: correctCount,
//         total: totalQuestions,
//         percentage: percentage,
//       });
//       setStatus("finished");
//     } catch (error) {
//       console.error("Error submitting exam:", error);
//       // حتی اگه ارور داد، وضعیت رو تمام شده کن تا کاربر گیر نکنه (میتونی اینجا آلرت بذاری)
//       setStatus("finished");
//     } finally {
//       // 👈 چه موفق باشه چه ناموفق، لودینگ رو خاموش نمیکنیم چون صفحه فینیش میاد
//       // ولی اگه بخوایم تمیز باشه:
//       setIsSubmitting(false);
//     }
//   };

//   // --- Views ---

//   if (status === "loading") {
//     return (
//       <div className="p-10 text-center text-xl">
//         ⏳ در حال دریافت اطلاعات آزمون...
//       </div>
//     );
//   }

//   if (status === "finished") {
//     return (
//       <div className="flex h-screen items-center justify-center bg-gray-100">
//         <div className="rounded-xl bg-white p-10 text-center shadow-lg">
//           <h1 className="text-3xl font-black text-cyan-700">پایان آزمون</h1>
//           {score ? (
//             <div className="mt-8">
//               <p className="text-3xl font-black">
//                 نمره شما: {toFarsi(score.correct)} از {toFarsi(score.total)}
//               </p>
//               <p className="mt-4 text-xl text-gray-700">
//                 درصد: ٪{toFarsi(Math.round(score.percentage))}
//               </p>
//               <Button
//                 className="mt-8 flex w-full items-center justify-center text-2xl"
//                 handleClick={() => navigate("/")}
//               >
//                 بازگشت
//               </Button>
//             </div>
//           ) : (
//             <div className="mt-8">
//               <p>آزمون شما ثبت شده است.</p>
//               {/* دکمه بازگشت در حالتی که نمره نیست هم لازمه */}
//               <Button
//                 className="mt-8 flex w-full items-center justify-center text-2xl"
//                 handleClick={() => navigate("/dashboard", { replace: true })}
//               >
//                 بازگشت
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   if (status === "waiting") {
//     return (
//       <div className="flex h-screen flex-col items-center justify-center bg-blue-50">
//         <h1 className="text-center text-2xl font-bold">
//           آزمون {testData?.title} <br />
//           هنوز شروع نشده است.
//         </h1>
//         <div className="mt-8 text-5xl font-bold text-cyan-700">
//           {formatTime(timer)}
//         </div>
//         <p className="mt-2 text-lg font-bold text-gray-500">مانده تا شروع...</p>
//       </div>
//     );
//   }

//   // Active View
//   const currentQuestion = testData?.questions[curQIndex];

//   return (
//     <div className="min-h-screen bg-gray-200 p-4 pb-8">
//       {/* Header */}
//       <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-lg bg-white p-4 px-2 shadow-md">
//         <span className="text-xl font-bold text-gray-700">
//           سوال {toFarsi(curQIndex + 1)} از {toFarsi(testData?.questions.length)}
//         </span>
//         <div className="rounded-lg bg-red-50 px-4 py-2 text-xl font-bold text-red-600">
//           {formatTime(timer)}
//         </div>
//       </div>

//       {/* Question Text */}
//       <div className="mb-8 flex min-h-[200px] items-center justify-center rounded-lg bg-white p-4 px-2 text-center text-2xl font-black shadow-md">
//         <h2>{currentQuestion?.question_text}</h2>
//       </div>

//       {/* Options */}
//       <div>
//         {currentQuestion?.options.map((option) => {
//           const isSelected = answers[currentQuestion.id] === option.id;
//           return (
//             <div
//               key={option.id}
//               onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
//               dir="rtl"
//               className={`mb-4 flex cursor-pointer items-center gap-4 rounded-lg border-1 p-4 text-right transition-all ${
//                 isSelected
//                   ? " border-white bg-cyan-700 text-white"
//                   : " border-gray-400 bg-cyan-50 text-black"
//               }`}
//             >
//               <div
//                 className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${isSelected ? "border-white" : "border-cyan-700"}`}
//               >
//                 {isSelected && (
//                   <div className="h-2 w-2 rounded-full bg-white"></div>
//                 )}
//               </div>
//               <span>{option.text}</span>
//             </div>
//           );
//         })}
//       </div>

//       {/* Navigation Buttons */}
//       <div className="mt-8 flex justify-between">
//         <Button
//           disabled={curQIndex === 0 || !testData.reviewable || isSubmitting}
//           handleClick={() => setCurQIndex((prev) => prev - 1)}
//           className={`w-40 border-2 transition-colors ${
//             curQIndex === 0 || !testData.reviewable || isSubmitting
//               ? "cursor-not-allowed border-transparent bg-gray-500 hover:bg-gray-400"
//               : "border-cyan-700 text-cyan-700 hover:bg-cyan-800"
//           }`}
//         >
//           سوال قبلی
//         </Button>

//         {curQIndex === testData.questions.length - 1 ? (
//           // 👈 دکمه اتمام آزمون با لودینگ
//           <Button
//             handleClick={submitExam}
//             disabled={isSubmitting} // غیرفعال شدن موقع ثبت
//             className={`w-40 px-8 transition-colors ${
//               isSubmitting
//                 ? "cursor-wait bg-gray-400"
//                 : "bg-green-600 hover:bg-green-700"
//             }`}
//           >
//             {isSubmitting ? "درحال ثبت..." : "اتمام آزمون"}
//           </Button>
//         ) : (
//           <Button
//             handleClick={() => setCurQIndex((prev) => prev + 1)}
//             disabled={isSubmitting}
//             className="w-40 px-8"
//           >
//             سوال بعدی
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// }
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../ui/Button";

// --- Utility Functions ---
const toFarsi = (str) => {
  if (!str) return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.toString().replace(/[0-9]/g, (d) => farsiDigits[parseInt(d)]);
};

const formatTime = (sec) => {
  if (sec === null) return "۰۰:۰۰";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const englishTime = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return toFarsi(englishTime);
};

export default function Test() {
  // --- State ---
  const [testData, setTestData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [timer, setTimer] = useState(null);
  const [curQIndex, setCurQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 👈 استیت‌های جدید برای فرم ورود
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [isInfoSubmitted, setIsInfoSubmitted] = useState(false); // آیا فرم پر شده؟

  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const STORAGE_KEY_ANSWERS = `test_answers_${id}`;
  const STORAGE_KEY_SUBMITTED = `test_submitted_${id}`;
  const STORAGE_KEY_INFO = `test_info_${id}`; // ذخیره موقت مشخصات

  // --- Effects ---

  useEffect(() => {
    if (id) {
      const isSubmitted = localStorage.getItem(STORAGE_KEY_SUBMITTED);
      if (isSubmitted === "true") {
        setStatus("finished");
      } else {
        fetchTest();
        loadSavedAnswers();

        // بازیابی مشخصات اگر قبلا وارد کرده و رفرش کرده
        const savedInfo = localStorage.getItem(STORAGE_KEY_INFO);
        if (savedInfo) {
          const { name, sId } = JSON.parse(savedInfo);
          setStudentName(name);
          setStudentId(sId);
          setIsInfoSubmitted(true);
        }
      }
    }
  }, [id]);

  useEffect(() => {
    if (status === "finished" || timer === null) return;
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, timer]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (status === "active") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  // --- Logic Helpers ---

  const loadSavedAnswers = () => {
    const savedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
  };

  const fetchTest = async () => {
    try {
      const { data, error } = await supabase
        .from("tests")
        .select("*, questions(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      setTestData(data);
      checkTimeStatus(data);
    } catch (error) {
      console.error("Error:", error);
      alert("آزمون پیدا نشد!");
    }
  };

  const checkTimeStatus = (test) => {
    const now = new Date().getTime();
    const start = new Date(test.start_time).getTime();
    const end = new Date(test.end_time).getTime();

    if (now < start) {
      setStatus("waiting");
      setTimer(Math.floor((start - now) / 1000));
    } else if (now >= start && now < end) {
      setStatus("active");
      setTimer(Math.floor((end - now) / 1000));
    } else {
      setStatus("finished");
      setTimer(0);
    }
  };

  const handleTimeFinish = () => {
    if (status === "waiting") checkTimeStatus(testData);
    else if (status === "active") submitExam();
  };

  const handleOptionSelect = (qId, optionId) => {
    if (isSubmitting) return;
    setAnswers((prev) => {
      const newAnswers = { ...prev, [qId]: optionId };
      localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  // 👈 تابع جدید برای ثبت فرم مشخصات
  const handleInfoSubmit = (e) => {
    e.preventDefault();

    // اگر نام خالی بود، از اسم ایتا استفاده کن
    let finalName = studentName.trim();
    if (!finalName) {
      // تلاش برای گرفتن نام از دیتای یوزر (اگر موجود باشه)
      const eitaaName = user?.first_name || user?.username || "کاربر ایتا";
      finalName = eitaaName;
      setStudentName(finalName);
    }

    // ذخیره در لوکال استوریج که اگه رفرش شد نپره
    localStorage.setItem(
      STORAGE_KEY_INFO,
      JSON.stringify({ name: finalName, sId: studentId }),
    );
    setIsInfoSubmitted(true);
  };

  const submitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    localStorage.removeItem(STORAGE_KEY_ANSWERS);
    localStorage.removeItem(STORAGE_KEY_INFO); // پاک کردن اطلاعات موقت
    localStorage.setItem(STORAGE_KEY_SUBMITTED, "true");

    let correctCount = 0;
    const totalQuestions = testData.questions.length;
    const answersPayload = testData.questions.map((q) => {
      const userAnsNum = Number(answers[q.id]);
      if (userAnsNum === q.correct_option) correctCount++;
      return {
        test_id: id,
        eitaa_id: user.eitaa_id,
        question_id: q.id,
        user_answer: userAnsNum || null,
      };
    });

    const percentage = (correctCount / totalQuestions) * 100;

    try {
      // 👈 ارسال نام و شماره دانشجویی به دیتابیس
      const { error: resultError } = await supabase.from("results").insert({
        test_id: id,
        eitaa_id: user.eitaa_id,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        score_percentage: percentage,
        student_name: studentName || user?.first_name || "کاربر ناشناس", // اگر استیت خالی بود فال‌بک بزن
        student_id: studentId || null,
      });
      if (resultError) throw resultError;

      const { error: answersError } = await supabase
        .from("answers")
        .insert(answersPayload);
      if (answersError) throw answersError;

      setScore({ correct: correctCount, total: totalQuestions, percentage });
      setStatus("finished");
    } catch (error) {
      console.error("Error submitting:", error);
      setStatus("finished");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Views ---

  if (status === "loading")
    return (
      <div className="p-10 text-center text-xl">
        ⏳ در حال دریافت اطلاعات...
      </div>
    );

  if (status === "finished") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white p-10 text-center shadow-lg">
          <h1 className="text-3xl font-black text-cyan-700">پایان آزمون</h1>
          {score ? (
            <div className="mt-8">
              <p className="text-3xl font-black">
                نمره شما: {toFarsi(score.correct)} از {toFarsi(score.total)}
              </p>
              <p className="mt-4 text-xl text-gray-700">
                درصد: ٪{toFarsi(Math.round(score.percentage))}
              </p>
              <Button
                className="mt-8 w-full text-2xl"
                handleClick={() => navigate("/dashboard", { replace: true })}
              >
                بازگشت به داشبورد
              </Button>
            </div>
          ) : (
            <div className="mt-8">
              <p>آزمون ثبت شده است.</p>
              <Button
                className="mt-8 w-full text-2xl"
                handleClick={() => navigate("/dashboard", { replace: true })}
              >
                بازگشت به داشبورد
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-blue-50">
        <h1 className="text-center text-2xl font-bold">
          آزمون {testData?.title} <br /> هنوز شروع نشده است.
        </h1>
        <div className="mt-8 text-5xl font-bold text-cyan-700">
          {formatTime(timer)}
        </div>
        <p className="mt-2 text-lg font-bold text-gray-500">مانده تا شروع...</p>
      </div>
    );
  }

  // 👈 ویوی جدید: فرم ورود مشخصات
  // اگر آزمون فعال است اما کاربر هنوز فرم را پر نکرده
  if (status === "active" && !isInfoSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-200 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="mb-2 text-center text-2xl font-black text-cyan-900">
            مشخصات داوطلب
          </h1>
          <p className="mb-6 text-center text-sm text-gray-500">
            لطفا نام و شماره دانشجویی خود را وارد کنید.
          </p>

          <form onSubmit={handleInfoSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block font-bold text-gray-700">
                نام و نام خانوادگی:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={
                  user?.first_name
                    ? `${user.first_name} (پیش‌فرض)`
                    : "مثال: علی رضایی"
                }
                className="w-full rounded-xl border bg-gray-50 p-3 transition-colors outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-gray-700">
                شماره دانشجویی (اختیاری):
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="مثال: ۱۴۰۲۰۱"
                className="w-full rounded-xl border bg-gray-50 p-3 transition-colors outline-none focus:border-cyan-500"
              />
            </div>

            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              ⚠️ در صورت خالی گذاشتن نام، از نام کاربری ایتا استفاده خواهد شد.
            </div>

            <Button className="mt-2 w-full py-3 text-lg">شروع آزمون</Button>
          </form>
        </div>
      </div>
    );
  }

  // Active View (سوالات)
  const currentQuestion = testData?.questions[curQIndex];
  return (
    <div className="min-h-screen bg-gray-200 p-4 pb-8">
      <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-lg bg-white p-4 px-2 shadow-md">
        <span className="text-xl font-bold text-gray-700">
          سوال {toFarsi(curQIndex + 1)} از {toFarsi(testData?.questions.length)}
        </span>
        <div className="rounded-lg bg-red-50 px-4 py-2 text-xl font-bold text-red-600">
          {formatTime(timer)}
        </div>
      </div>

      <div className="mb-8 flex min-h-[200px] items-center justify-center rounded-lg bg-white p-4 px-2 text-center text-2xl font-black shadow-md">
        <h2>{currentQuestion?.question_text}</h2>
      </div>

      <div>
        {currentQuestion?.options.map((option) => {
          const isSelected = answers[currentQuestion.id] === option.id;
          return (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
              dir="rtl"
              className={`mb-4 flex cursor-pointer items-center gap-4 rounded-lg border-1 p-4 text-right transition-all ${isSelected ? " border-white bg-cyan-700 text-white" : " border-gray-400 bg-cyan-50 text-black"}`}
            >
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${isSelected ? "border-white" : "border-cyan-700"}`}
              >
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                )}
              </div>
              <span>{option.text}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <Button
          disabled={curQIndex === 0 || !testData.reviewable || isSubmitting}
          handleClick={() => setCurQIndex((prev) => prev - 1)}
          className={`w-40 border-2 transition-colors ${curQIndex === 0 || !testData.reviewable || isSubmitting ? "cursor-not-allowed border-transparent bg-gray-500 hover:bg-gray-400" : "border-cyan-700 text-cyan-700 hover:bg-cyan-800"}`}
        >
          سوال قبلی
        </Button>
        {curQIndex === testData.questions.length - 1 ? (
          <Button
            handleClick={submitExam}
            disabled={isSubmitting}
            className={`w-40 px-8 transition-colors ${isSubmitting ? "cursor-wait bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          >
            {isSubmitting ? "درحال ثبت..." : "اتمام آزمون"}
          </Button>
        ) : (
          <Button
            handleClick={() => setCurQIndex((prev) => prev + 1)}
            disabled={isSubmitting}
            className="w-40 px-8"
          >
            سوال بعدی
          </Button>
        )}
      </div>
    </div>
  );
}
