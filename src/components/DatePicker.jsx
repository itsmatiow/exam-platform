// import { useEffect, useState } from "react";
// import Picker from "react-mobile-picker";
// import jalaali from "jalaali-js";

// // --- Helper Functions & Constants ---

// function toPersianNumber(n) {
//   const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
//   return n
//     .toString()
//     .split("")
//     .map((d) => persianDigits[d])
//     .join("");
// }

// const generateRange = (start, end) => {
//   return Array.from({ length: end - start + 1 }, (_, i) =>
//     toPersianNumber((i + start).toString().padStart(2, "0")),
//   );
// };

// // Static data (defined once)
// const selections = {
//   month: [
//     "فروردین",
//     "اردیبهشت",
//     "خرداد",
//     "تیر",
//     "مرداد",
//     "شهریور",
//     "مهر",
//     "آبان",
//     "آذر",
//     "دی",
//     "بهمن",
//     "اسفند",
//   ],
//   day: generateRange(1, 31),
//   hour: generateRange(0, 23),
//   minute: generateRange(0, 59),
// };

// // Extracted render function to avoid re-creation on every render
// const renderItem = (option, selected, itemHeight) => (
//   <div
//     className={`flex items-center justify-center ${
//       selected
//         ? "rounded-lg bg-gray-100 px-6 font-bold text-cyan-700"
//         : "font-light text-gray-400"
//     }`}
//     style={{ height: `${itemHeight}px` }}
//   >
//     {option}
//   </div>
// );

// export default function DateTimePicker({ onChange }) {
//   // --- State Initialization ---

//   // 1. Initialize Date (Lazy initialization to get CURRENT time on mount)
//   const [dateValue, setDateValue] = useState(() => {
//     const { jm, jd } = jalaali.toJalaali(new Date());
//     return {
//       month: selections.month[jm - 1],
//       day: toPersianNumber(jd.toString().padStart(2, "0")),
//     };
//   });

//   // 2. Initialize Time
//   const [timeValue, setTimeValue] = useState(() => {
//     const now = new Date();
//     return {
//       hour: toPersianNumber(now.getHours().toString().padStart(2, "0")),
//       minute: toPersianNumber(now.getMinutes().toString().padStart(2, "0")),
//     };
//   });

//   const itemHeight = 40;
//   const totalHeight = itemHeight * 3;

//   // --- Effects ---

//   useEffect(() => {
//     if (onChange) {
//       // Find month index dynamically
//       const curMonthIndex = selections.month.indexOf(dateValue.month) + 1;

//       onChange({
//         date: { ...dateValue, monthIndex: curMonthIndex },
//         time: timeValue,
//       });
//     }
//   }, [dateValue, timeValue]); // Only runs when user changes the picker

//   // --- Render ---
//   return (
//     <>
//       <div className="flex flex-col gap-2">
//         <label className="mt-2 text-lg font-semibold">روز شروع آزمون</label>

//         {/* Date Section (RTL) */}
//         <div className="mt-2 flex flex-col gap-6" dir="rtl">
//           <div className="rounded-xl border-1 border-gray-300 px-4 py-2">
//             <Picker
//               value={dateValue}
//               onChange={setDateValue}
//               wheelMode="natural"
//               height={totalHeight}
//               itemHeight={itemHeight}
//             >
//               {/* Order: Day (Right), Month (Left) because of RTL */}
//               {["day", "month"].map((name) => (
//                 <Picker.Column key={name} name={name}>
//                   {selections[name].map((option) => (
//                     <Picker.Item key={option} value={option}>
//                       {({ selected }) =>
//                         renderItem(option, selected, itemHeight)
//                       }
//                     </Picker.Item>
//                   ))}
//                 </Picker.Column>
//               ))}
//             </Picker>
//           </div>
//         </div>
//       </div>

//       <div className="mt-2 flex flex-col gap-2">
//         <label className="mt-2 text-lg font-semibold">ساعت شروع آزمون</label>

//         {/* Time Section (LTR) */}
//         <div className="mt-2 flex flex-col gap-6">
//           <div
//             className="rounded-xl border-1 border-gray-300 px-4 py-2"
//             dir="ltr"
//           >
//             <Picker
//               value={timeValue}
//               onChange={setTimeValue}
//               wheelMode="natural"
//               height={totalHeight}
//               itemHeight={itemHeight}
//             >
//               {/* Order: Hour (Left), Minute (Right) because of LTR */}
//               {["hour", "minute"].map((name) => (
//                 <Picker.Column key={name} name={name}>
//                   {selections[name].map((option) => (
//                     <Picker.Item key={option} value={option}>
//                       {({ selected }) =>
//                         renderItem(option, selected, itemHeight)
//                       }
//                     </Picker.Item>
//                   ))}
//                 </Picker.Column>
//               ))}
//             </Picker>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
import React, { useEffect, useState } from "react";
import jalaali from "jalaali-js";

const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const toFarsi = (num) => String(num).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

export default function DatePicker({ onChange }) {
  // گرفتن زمان حال برای مقایسه
  const now = new Date();
  const jNow = jalaali.toJalaali(now); // تبدیل به شمسی: jy, jm, jd
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // استیت‌های انتخاب شده (پیش‌فرض: همین الان)
  const [selectedMonth, setSelectedMonth] = useState(jNow.jm); // 1-12
  const [selectedDay, setSelectedDay] = useState(jNow.jd);
  const [selectedHour, setSelectedHour] = useState(currentHour);
  const [selectedMinute, setSelectedMinute] = useState(currentMinute);

  // محاسبه تعداد روزهای ماه انتخاب شده
  const daysInMonth =
    selectedMonth <= 6
      ? 31
      : selectedMonth === 12 && !jalaali.isLeapJalaaliYear(jNow.jy)
        ? 29
        : 30;

  // --- منطق فیلتر کردن زمان‌های گذشته ---

  // ۱. تولید لیست روزها
  // اگر ماهِ انتخاب شده همان ماهِ جاری باشد، روزها از "امروز" شروع می‌شوند، وگرنه از ۱
  const startDay = selectedMonth === jNow.jm ? jNow.jd : 1;
  const daysList = Array.from(
    { length: daysInMonth - startDay + 1 },
    (_, i) => startDay + i,
  );

  // ۲. تولید لیست ساعت‌ها
  // اگر "امروز" انتخاب شده باشد، ساعت از "ساعت الان" شروع می‌شود، وگرنه از ۰
  const isToday = selectedMonth === jNow.jm && selectedDay === jNow.jd;
  const startHour = isToday ? currentHour : 0;
  const hoursList = Array.from(
    { length: 24 - startHour },
    (_, i) => startHour + i,
  );

  // ۳. تولید لیست دقیقه‌ها
  // اگر "همین ساعت" انتخاب شده باشد، دقیقه از "دقیقه الان" شروع می‌شود
  const isNowHour = isToday && selectedHour === currentHour;
  const startMinute = isNowHour ? currentMinute : 0;
  // دقیقه‌ها رو ۵ تا ۵ تا نشون میدیم که تمیزتر باشه (اختیاری)
  const minutesList = [];
  for (let i = startMinute; i < 60; i += 5) {
    minutesList.push(i);
  }
  // اگر لیست دقیقه‌ها خالی شد (مثلا ساعت ۵:۵۹ هست)، یه دونه 59 دستی اضافه کن
  if (minutesList.length === 0) minutesList.push(59);

  // --- ارسال تغییرات به کامپوننت پدر ---
  useEffect(() => {
    // هر وقت استیت‌ها عوض شد، به پدر خبر بده
    if (onChange) {
      onChange({
        date: {
          day: selectedDay,
          monthIndex: selectedMonth, // تبدیل به فرمت مورد نیاز پدر
        },
        time: {
          hour: selectedHour,
          minute: selectedMinute,
        },
      });
    }
  }, [selectedMonth, selectedDay, selectedHour, selectedMinute]);

  // --- هندلرها (وقتی کاربر تغییر میده) ---

  // وقتی ماه عوض میشه، شاید روز انتخاب شده توی ماه جدید غیرمجاز باشه (مثلا روز ۳۱ام ماه قبل بودیم الان رفتیم ماهی که ۳۰ روزه)
  // یا برگشتیم به ماه جاری و روز انتخاب شده مال قبله. باید ریست بشه.
  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setSelectedMonth(newMonth);

    // اگر رفتیم به ماه جاری، روز رو بذار روی امروز. اگر ماه دیگه بود بذار روز ۱
    if (newMonth === jNow.jm) setSelectedDay(jNow.jd);
    else setSelectedDay(1);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-300 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-500">
          تاریخ و ساعت شروع:
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-2" dir="rtl">
        {/* انتخاب روز */}
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(parseInt(e.target.value))}
          className="rounded-lg border bg-white p-2 outline-none focus:border-cyan-500"
        >
          {daysList.map((d) => (
            <option key={d} value={d}>
              {toFarsi(d)}
            </option>
          ))}
        </select>

        {/* انتخاب ماه */}
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          className="rounded-lg border bg-white p-2 outline-none focus:border-cyan-500"
        >
          {months.map((m, index) => {
            // فقط ماه‌های باقی‌مانده از سال رو نشون بده (اختیاری)
            // اگر بخوای کاربر نتونه ماه قبل رو انتخاب کنه:
            const monthIndex = index + 1;
            if (monthIndex < jNow.jm) return null; // ماه‌های گذشته رو نشون نده

            return (
              <option key={index} value={monthIndex}>
                {m}
              </option>
            );
          })}
        </select>

        <span className="self-center text-gray-400">|</span>

        {/* انتخاب ساعت */}
        <div className="ltr flex items-center gap-1">
          {/* دقیقه */}
          <select
            value={selectedMinute}
            onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
            className="rounded-lg border bg-white p-2 outline-none focus:border-cyan-500"
          >
            {minutesList.map((m) => (
              <option key={m} value={m}>
                {toFarsi(m < 10 ? "0" + m : m)}
              </option>
            ))}
          </select>

          <span className="font-bold">:</span>

          {/* ساعت */}
          <select
            value={selectedHour}
            onChange={(e) => setSelectedHour(parseInt(e.target.value))}
            className="rounded-lg border bg-white p-2 outline-none focus:border-cyan-500"
          >
            {hoursList.map((h) => (
              <option key={h} value={h}>
                {toFarsi(h < 10 ? "0" + h : h)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
