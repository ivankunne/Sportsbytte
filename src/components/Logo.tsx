type Props = {
  variant?: "light" | "dark" | "amber";
  className?: string;
};

export function Logo({ variant = "light", className = "" }: Props) {
  const sColor =
    variant === "amber" ? "text-forest" : "text-amber";
  const restColor =
    variant === "dark" ? "text-white" : "text-forest";

  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      <span className={`${sColor}`} style={{ fontSize: "1.25em" }}>S</span>
      <span className={restColor}>portsbyttet</span>
    </span>
  );
}
