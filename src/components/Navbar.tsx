// src/components/Navbar.tsx
import React from "react";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">PollApp</h1>
      <div className="space-x-4">
        <a href="/" className="hover:text-indigo-400">Home</a>
        <a href="/create" className="hover:text-indigo-400">Create Poll</a>
      </div>
    </nav>
  );
}
