// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";

// // --- ایمپورت‌های کانتکست و امنیت ---
// import { AuthProvider } from "./context/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";

// // --- ایمپورت صفحات ---
// import Login from "./pages/Login"; // 👈 این رو حتما بساز و ایمپورت کن
// import Home from "./pages/Home";
// import CreateTest from "./pages/CreateTest";
// import Dashboard from "./pages/Dashboard";
// import Test from "./pages/Test";
// import Result from "./pages/Result";
// import Landing from "./pages/Landing";

// export default function App() {
//   return (
//     // ۱. کل برنامه باید داخل پرووایدر باشه تا یوزر رو بشناسه
//     <AuthProvider>
//       <Routes>
//         {/* --- مسیرهای عمومی (Public) --- */}
//         {/* صفحه خانه و لاگین نیاز به نگهبان ندارن */}
//         <Route path="/" element={<Home />} />
//         <Route
//           path="/landing"
//           element={
//             <ProtectedRoute>
//               <Landing />
//             </ProtectedRoute>
//           }
//         />

//         <Route path="/login" element={<Login />} />

//         {/* --- مسیرهای محافظت‌شده (Private) --- */}
//         {/* این صفحات فقط با کارت دانشجویی (لاگین) باز میشن */}

//         <Route
//           path="/create"
//           element={
//             <ProtectedRoute>
//               <CreateTest />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           }
//         />

//         {/* ⚠️ نکته: مسیر ریزالت رو اصلاح کردم (/:id اضافه شد) */}
//         <Route
//           path="/result/:id"
//           element={
//             <ProtectedRoute>
//               <Result />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/test/:id"
//           element={
//             <ProtectedRoute>
//               <Test />
//             </ProtectedRoute>
//           }
//         />

//         {/* اگر آدرس اشتباه زد، بفرستش صفحه اصلی یا داشبورد */}
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </AuthProvider>
//   );
// }
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Landing from "./pages/Landing";
import CreateTest from "./pages/CreateTest";
import Dashboard from "./pages/Dashboard";
import Test from "./pages/Test";
import Result from "./pages/Result";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* صفحه اصلی: هم خوش‌آمدگویی است هم لاگین */}
        <Route path="/" element={<Home />} />

        {/* صفحه لندینگ: فقط با عبور از محافظ */}
        <Route
          path="/landing"
          element={
            <ProtectedRoute>
              <Landing />
            </ProtectedRoute>
          }
        />

        {/* سایر صفحات محافظت شده */}
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result/:id"
          element={
            <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/:id"
          element={
            <ProtectedRoute>
              <Test />
            </ProtectedRoute>
          }
        />

        {/* هدایت آدرس‌های اشتباه به خانه */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}
