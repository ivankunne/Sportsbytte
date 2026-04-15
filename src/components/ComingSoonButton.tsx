"use client";

import { showComingSoon } from "./Toaster";

type Props = {
  children: React.ReactNode;
  feature?: string;
  className?: string;
};

export function ComingSoonButton({ children, feature, className }: Props) {
  return (
    <button
      type="button"
      onClick={() => showComingSoon(feature)}
      className={className}
    >
      {children}
    </button>
  );
}
