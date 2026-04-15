type Props = {
  condition: string;
  size?: "sm" | "md";
};

const conditionStyles: Record<string, string> = {
  "Som ny": "bg-[#e6f5ee] text-[#1a6b3e]",
  "Pent brukt": "bg-[#e8f1fb] text-[#1a4a8a]",
  "Godt brukt": "bg-[#fdf0e6] text-[#954a00]",
  "Mye brukt": "bg-[#f2f2f2] text-[#555555]",
};

export function ConditionBadge({ condition, size = "sm" }: Props) {
  const style = conditionStyles[condition] ?? "bg-[#f2f2f2] text-[#555555]";
  const sizeClass = size === "md"
    ? "px-3 py-1 text-[13px]"
    : "px-3 py-1 text-xs";

  return (
    <span className={`inline-block rounded-[20px] font-medium ${style} ${sizeClass}`}>
      {condition}
    </span>
  );
}
