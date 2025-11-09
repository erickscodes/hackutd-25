import React from "react";

export function Button({ className = "", children, ...props }) {
  return (
    <button
      className={
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors " +
        "bg-[#E20074] text-white hover:bg-[#c60063] " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
