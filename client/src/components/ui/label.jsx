import React from "react";

export function Label({ className = "", children }) {
  return (
    <label className={`text-sm font-medium text-slate-700 ${className}`}>
      {children}
    </label>
  );
}
