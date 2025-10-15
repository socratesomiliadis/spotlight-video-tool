"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CustomButton({
  text,
  href,
  inverted,
  className,
  onClick,
  type,
  disabled,
  isLoading,
  external,
}: {
  text: string;
  href?: string;
  inverted?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "submit" | "button";
  disabled?: boolean;
  isLoading?: boolean;
  external?: boolean;
}) {
  const classes = cn(
    "bg-black group/btn px-6 py-2 rounded-lg lg:rounded-xl text-white tracking-tight text-sm lg:text-lg relative overflow-hidden flex items-center justify-center font-[550]",
    inverted &&
      "bg-white py-[0.4rem] border-2 box-border border-black text-black",
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        target={external ? "_blank" : "_self"}
        className={classes}
      >
        <span
          className={cn(
            "normal-chars group-hover/btn:translate-y-[-120%] transition-all duration-400 ease-spring",
            isLoading && "translate-y-[-120%]"
          )}
        >
          {text}
        </span>
        <span className="absolute hover-chars translate-y-[120%] group-hover/btn:translate-y-0 transition-all duration-400 ease-spring">
          {text}
        </span>

        <span
          className={cn(
            "absolute loading-chars translate-y-[120%] transition-all duration-400 ease-spring",
            isLoading && "translate-y-0"
          )}
        >
          Loading...
        </span>
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      <span
        className={cn(
          "normal-chars group-hover/btn:translate-y-[-120%] transition-all duration-400 ease-spring",
          isLoading && "translate-y-[-120%]"
        )}
      >
        {text}
      </span>
      <span className="absolute hover-chars translate-y-[120%] group-hover/btn:translate-y-0 transition-all duration-400 ease-spring">
        {text}
      </span>
      <span
        className={cn(
          "absolute loading-chars translate-y-[120%] transition-all duration-400 ease-spring",
          isLoading && "translate-y-0"
        )}
      >
        Loading...
      </span>
    </button>
  );
}
