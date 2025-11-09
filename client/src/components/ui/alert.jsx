import React from "react";

export function Alert({ variant = "default", className = "", children }) {
  return (
    <div
      className={
        "flex items-start gap-2 rounded-md border p-3 text-sm " +
        (variant === "destructive"
          ? "border-red-400 bg-red-50 text-red-700"
          : "border-rose-200 bg-rose-50 text-rose-800") +
        " " +
        className
      }
    >
      {children}
    </div>
  );
}

export function AlertTitle({ children }) {
  return <div className="font-semibold">{children}</div>;
}

export function AlertDescription({ children }) {
  return <div className="text-xs">{children}</div>;
}
