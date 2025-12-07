import { useEffect, useState } from "react";
import Picker from "react-mobile-picker";
import jalaali from "jalaali-js";

// --- Helper Functions & Constants ---

function toPersianNumber(n) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return n
    .toString()
    .split("")
    .map((d) => persianDigits[d])
    .join("");
}

const generateRange = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, i) =>
    toPersianNumber((i + start).toString().padStart(2, "0")),
  );
};

// Static data (defined once)
const selections = {
  month: [
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
  ],
  day: generateRange(1, 31),
  hour: generateRange(0, 23),
  minute: generateRange(0, 59),
};

// Extracted render function to avoid re-creation on every render
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
  // --- State Initialization ---

  // 1. Initialize Date (Lazy initialization to get CURRENT time on mount)
  const [dateValue, setDateValue] = useState(() => {
    const { jm, jd } = jalaali.toJalaali(new Date());
    return {
      month: selections.month[jm - 1],
      day: toPersianNumber(jd.toString().padStart(2, "0")),
    };
  });

  // 2. Initialize Time
  const [timeValue, setTimeValue] = useState(() => {
    const now = new Date();
    return {
      hour: toPersianNumber(now.getHours().toString().padStart(2, "0")),
      minute: toPersianNumber(now.getMinutes().toString().padStart(2, "0")),
    };
  });

  const itemHeight = 40;
  const totalHeight = itemHeight * 3;

  // --- Effects ---

  useEffect(() => {
    if (onChange) {
      // Find month index dynamically
      const curMonthIndex = selections.month.indexOf(dateValue.month) + 1;

      onChange({
        date: { ...dateValue, monthIndex: curMonthIndex },
        time: timeValue,
      });
    }
  }, [dateValue, timeValue]); // Only runs when user changes the picker

  // --- Render ---
  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="mt-2 text-lg font-semibold">روز شروع آزمون</label>

        {/* Date Section (RTL) */}
        <div className="mt-2 flex flex-col gap-6" dir="rtl">
          <div className="rounded-xl border-1 border-gray-300 px-4 py-2">
            <Picker
              value={dateValue}
              onChange={setDateValue}
              wheelMode="natural"
              height={totalHeight}
              itemHeight={itemHeight}
            >
              {/* Order: Day (Right), Month (Left) because of RTL */}
              {["day", "month"].map((name) => (
                <Picker.Column key={name} name={name}>
                  {selections[name].map((option) => (
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
            className="rounded-xl border-1 border-gray-300 px-4 py-2"
            dir="ltr"
          >
            <Picker
              value={timeValue}
              onChange={setTimeValue}
              wheelMode="natural"
              height={totalHeight}
              itemHeight={itemHeight}
            >
              {/* Order: Hour (Left), Minute (Right) because of LTR */}
              {["hour", "minute"].map((name) => (
                <Picker.Column key={name} name={name}>
                  {selections[name].map((option) => (
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
