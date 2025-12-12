// components/Button.tsx - Reusable premium button with animated border

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success";
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles = "w-full font-bold px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm border-2 btn-glow";

  const variantStyles = {
    primary: "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 shadow-lg shadow-orange-500/50 border-orange-400/50",
    secondary: "bg-neutral-800/60 hover:bg-neutral-700/80 border-neutral-700 hover:border-neutral-600 text-neutral-300 hover:text-white py-4 hover:shadow-lg hover:shadow-neutral-500/30",
    success: "bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 shadow-lg shadow-emerald-500/50 border-emerald-400/50",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
