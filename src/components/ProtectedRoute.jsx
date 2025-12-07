import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // ۱. اگر هنوز داریم چک میکنیم، صبر کن
  if (loading) {
    return <div className="p-10 text-center">درحال بررسی هویت...</div>;
  }

  // ۲. اگر کاربر کلا وجود نداشت (مشکل عجیب) یا "کاربر جدید" بود
  // باید بره صفحه لاگین (ثبت نام)
  if (!user || user.isNew || !user.student_id) {
    return <Navigate to="/login" replace />;
  }

  // ۳. اگه همه چی اوکی بود، بفرما تو
  return children;
}
