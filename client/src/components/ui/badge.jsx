import React from "react";

export function Badge({ className = "", children }) {
  return (
    <span
      className={
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium " +
        className
      }
    >
      {children}
    </span>
  );
}
