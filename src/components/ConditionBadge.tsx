type Props = {
  condition: string;
  size?: "sm" | "md";
};

const conditionStyles: Record<string, string> = {
  "Som ny":     "bg-[#d1fae5] text-[#059669]",
  "Pent brukt": "bg-[#dbeafe] text-[#2563eb]",
  "Godt brukt": "bg-[#f3f4f6] text-[#44403c]",
  "Mye brukt":  "bg-[#fef3c7] text-[#d97706]",
};

export function ConditionBadge({ condition, size = "sm" }: Props) {
  const style = conditionStyles[condition] ?? "bg-[#f3f4f6] text-[#44403c]";
  const sizeClass = size === "md"
    ? "px-3 py-1 text-[13px]"
    : "px-3 py-1 text-xs";

  return (
    <span className={`inline-block rounded-[20px] font-medium ${style} ${sizeClass}`}>
      {condition}
    </span>
  );
}
