import React from "react";
import Button from "../ui/Button";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col justify-between bg-gray-50">
      <div className="flex h-200 flex-col items-center justify-center">
        <h1 className="mb-12 text-center text-3xl font-bold">
          پلتفرم <span className="text-red-500">آ</span>زمون{" "}
          <span className="text-red-500">س</span>از{" "}
          <span className="text-red-500">آس</span>
        </h1>
        <div className="flex flex-col gap-3 p-2 text-2xl">
          <Button
            handleClick={() => {
              navigate("/create");
            }}
          >
            آزمون جدید
          </Button>
          <Button handleClick={() => navigate("/dashboard")}>پنل کاربری</Button>
        </div>
      </div>
      <h2 className="mx-auto mb-12 flex text-center select-none">
        طراحی شده توسط مَت با چای
        <img
          className="mx-1 h-6 w-6"
          alt="tea"
          src="https://emojigraph.org/media/apple/hot-beverage_2615.png"
        />
        و عشق
        <img
          className="mx-1 h-6 w-6"
          alt="heart"
          src="https://emojigraph.org/media/apple/pink-heart_1fa77.png"
        />
      </h2>
    </div>
  );
}
