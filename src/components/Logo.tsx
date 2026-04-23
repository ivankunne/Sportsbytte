import Image from "next/image";

type Props = {
  variant?: "light" | "dark" | "amber";
  className?: string;
};

export function Logo({ variant = "light", className = "" }: Props) {
  return (
    <Image
      src="/Sportbytte_logo.png"
      alt="Sportsbytte"
      width={140}
      height={38}
      className={`h-8 w-auto ${className}`}
      priority
    />
  );
}
