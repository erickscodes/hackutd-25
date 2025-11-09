import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={
        "w-full border border-rose-300 bg-white text-slate-900 rounded-xl h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E20074]/60 " +
        className
      }
      {...props}
    />
  );
}
