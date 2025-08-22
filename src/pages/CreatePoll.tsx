// src/components/Button.tsx
import React from "react";

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset"; // <-- add this
}

export default function Button({ onClick, children, className, type = "button" }: ButtonProps) {
  return (
    <button
      type={type} // <-- now type works
      onClick={onClick}
      className={`px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition ${className}`}
    >
      {children}
    </button>
  );
}
