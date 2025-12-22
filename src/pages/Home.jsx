import React from "react";
import Button from "../ui/Button";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <Button
        handleClick={() => {
          navigate("/landing");
        }}
      >
        لندینگ پیج
      </Button>
    </div>
  );
}
