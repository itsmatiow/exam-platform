import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // ۱. صبر برای لود شدن
  if (loading) {
    return <div className="p-10 text-center">درحال بررسی هویت...</div>;
  }

  // ۲. شرط ورود ساده شد:
  // فقط اگر "یوزر نیست" یا "شماره موبایل نداره" بفرستش بیرون.
  // (شرط student_id و isNew رو حذف کردم چون دیگه فرم ثبت نام نداریم)
  if (!user || !user.phone_number) {
    return <Navigate to="/login" replace />;
  }

  // ۳. بفرما تو
  return children;
}
