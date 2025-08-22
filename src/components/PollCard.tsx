// src/components/PollCard.tsx
import React from "react";

interface PollCardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

export default function PollCard({ title, description, onClick }: PollCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 text-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-700 transition"
    >
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-gray-300 mt-2">{description}</p>
    </div>
  );
}
