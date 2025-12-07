import React from "react";
// import { useNavigate } from "react-router-dom";

export default function Button({
  children,
  handleClick,
  className = "",
  ...props
}) {
  return (
    <button
      onClick={handleClick}
      className={`flex justify-center rounded-xl bg-cyan-700 px-4 py-3 font-semibold text-white transition hover:bg-cyan-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
