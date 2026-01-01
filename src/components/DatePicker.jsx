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
import { useEffect, useState, useMemo } from "react";
import Picker from "react-mobile-picker";
import jalaali from "jalaali-js";

// --- توابع کمکی ---

function toPersianNumber(n) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return n
    .toString()
    .split("")
    .map((d) => persianDigits[d])
    .join("");
}

// تولید آرایه اعداد (با تبدیل به فارسی و پدینگ)
const generateRange = (start, end) => {
  if (start > end) return [];
  return Array.from({ length: end - start + 1 }, (_, i) =>
    toPersianNumber((i + start).toString().padStart(2, "0")),
  );
};

// لیست ثابت ماه‌ها
const allMonths = [
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

// تابع رندر آیتم‌ها (استایل)
const renderItem = (option, selected, itemHeight) => (
  <div
    className={`flex items-center justify-center ${
      selected
        ? "rounded-lg bg-gray-100 px-6 font-bold text-cyan-700"
        : "font-light text-gray-400"
    }`}
    style={{ height: `${itemHeight}px` }}
  >
    {option}
  </div>
);

export default function DateTimePicker({ onChange }) {
  // --- دریافت زمان حال ---
  // استفاده از state برای اینکه زمان حال ثابت بمونه و با هر رندر عوض نشه
  const [nowDate] = useState(new Date());
  const [jNow] = useState(jalaali.toJalaali(nowDate)); // { jy, jm, jd }

  // --- State Initialization ---
  // مقدار اولیه: همین الان
  const [dateValue, setDateValue] = useState({
    month: allMonths[jNow.jm - 1],
    day: toPersianNumber(jNow.jd.toString().padStart(2, "0")),
  });

  const [timeValue, setTimeValue] = useState({
    hour: toPersianNumber(nowDate.getHours().toString().padStart(2, "0")),
    minute: toPersianNumber(nowDate.getMinutes().toString().padStart(2, "0")),
  });

  const itemHeight = 40;
  const totalHeight = itemHeight * 3;

  // --- محاسبات دینامیک (هوشمند) ---

  // 1. لیست ماه‌های مجاز (از ماه جاری تا آخر سال)
  const availableMonths = useMemo(() => {
    return allMonths.slice(jNow.jm - 1);
  }, [jNow.jm]);

  // 2. لیست روزهای مجاز
  const currentMonthIndex = allMonths.indexOf(dateValue.month) + 1;
  const isCurrentMonth = currentMonthIndex === jNow.jm;

  const daysInMonth =
    currentMonthIndex <= 6
      ? 31
      : currentMonthIndex === 12 && !jalaali.isLeapJalaaliYear(jNow.jy)
        ? 29
        : 30;

  const startDay = isCurrentMonth ? jNow.jd : 1;
  const availableDays = useMemo(
    () => generateRange(startDay, daysInMonth),
    [startDay, daysInMonth],
  );

  // 3. لیست ساعت‌های مجاز
  const selectedDayNum = parseInt(toEng(dateValue.day));
  const isToday = isCurrentMonth && selectedDayNum === jNow.jd;

  const startHour = isToday ? nowDate.getHours() : 0;
  const availableHours = useMemo(
    () => generateRange(startHour, 23),
    [startHour],
  );

  // 4. لیست دقیقه‌های مجاز
  const selectedHourNum = parseInt(toEng(timeValue.hour));
  const isNowHour = isToday && selectedHourNum === nowDate.getHours();

  const startMinute = isNowHour ? nowDate.getMinutes() : 0;
  const availableMinutes = useMemo(
    () => generateRange(startMinute, 59),
    [startMinute],
  );

  // --- Effects: تصحیح خودکار انتخاب‌ها ---

  // اگر کاربر ماه را عوض کرد و روزِ انتخاب شده در لیست جدید نبود، روز را اصلاح کن
  useEffect(() => {
    // چک میکنیم آیا روزی که الان انتخاب شده، توی لیست روزهای مجاز هست یا نه
    const isDayValid = availableDays.includes(dateValue.day);
    if (!isDayValid) {
      // اگر معتبر نیست، اولین روز مجاز (مثلا امروز یا اول ماه) رو ست کن
      setDateValue((prev) => ({ ...prev, day: availableDays[0] }));
    }
  }, [dateValue.month, availableDays, dateValue.day]);

  // تصحیح ساعت (اگر روز عوض شد و ساعت شد گذشته)
  useEffect(() => {
    const isHourValid = availableHours.includes(timeValue.hour);
    if (!isHourValid) {
      setTimeValue((prev) => ({ ...prev, hour: availableHours[0] }));
    }
  }, [dateValue, availableHours, timeValue.hour]);

  // تصحیح دقیقه (اگر ساعت عوض شد و دقیقه شد گذشته)
  useEffect(() => {
    const isMinuteValid = availableMinutes.includes(timeValue.minute);
    if (!isMinuteValid) {
      setTimeValue((prev) => ({ ...prev, minute: availableMinutes[0] }));
    }
  }, [timeValue.hour, availableMinutes, timeValue.minute]);

  // --- ارسال تغییرات به والد ---
  useEffect(() => {
    if (onChange) {
      const curMonthIndex = allMonths.indexOf(dateValue.month) + 1;
      onChange({
        date: { ...dateValue, monthIndex: curMonthIndex },
        time: timeValue,
      });
    }
  }, [dateValue, timeValue]);

  // --- آبجکتSelections برای پیکر ---
  // این آبجکت رو میسازیم که بتونیم راحت مپ بزنیم روش
  const selectionsDate = {
    day: availableDays,
    month: availableMonths,
  };

  const selectionsTime = {
    hour: availableHours,
    minute: availableMinutes,
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="mt-2 text-lg font-semibold">روز شروع آزمون</label>

        {/* Date Section (RTL) */}
        <div className="mt-2 flex flex-col gap-6" dir="rtl">
          <div className="rounded-xl border-1 border-gray-300 bg-gray-50 px-4 py-2">
            <Picker
              value={dateValue}
              onChange={setDateValue}
              wheelMode="natural"
              height={totalHeight}
              itemHeight={itemHeight}
            >
              {/* ستون‌ها بر اساس لیست‌های دینامیک رندر می‌شوند */}
              {["day", "month"].map((name) => (
                <Picker.Column key={name} name={name}>
                  {selectionsDate[name].map((option) => (
                    <Picker.Item key={option} value={option}>
                      {({ selected }) =>
                        renderItem(option, selected, itemHeight)
                      }
                    </Picker.Item>
                  ))}
                </Picker.Column>
              ))}
            </Picker>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <label className="mt-2 text-lg font-semibold">ساعت شروع آزمون</label>

        {/* Time Section (LTR) */}
        <div className="mt-2 flex flex-col gap-6">
          <div
            className="rounded-xl border-1 border-gray-300 bg-gray-50 px-4 py-2"
            dir="ltr"
          >
            <Picker
              value={timeValue}
              onChange={setTimeValue}
              wheelMode="natural"
              height={totalHeight}
              itemHeight={itemHeight}
            >
              {["hour", "minute"].map((name) => (
                <Picker.Column key={name} name={name}>
                  {selectionsTime[name].map((option) => (
                    <Picker.Item key={option} value={option}>
                      {({ selected }) =>
                        renderItem(option, selected, itemHeight)
                      }
                    </Picker.Item>
                  ))}
                </Picker.Column>
              ))}
            </Picker>
          </div>
        </div>
      </div>
    </>
  );
}

// تابع کمکی تبدیل به انگلیسی برای محاسبات داخلی
const toEng = (str = "") =>
  str.toString().replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
