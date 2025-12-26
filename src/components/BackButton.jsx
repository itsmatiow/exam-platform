import { useNavigate } from "react-router-dom";

export default function BackButton({ label = "بازگشت", to, className = "" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      type="button"
      className={`inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-base font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 active:scale-95 ${className} `}
    >
      {label}
      <span className="mr-1 scale-150">←</span>
    </button>
  );
}
