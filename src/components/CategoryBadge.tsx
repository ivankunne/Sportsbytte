type Props = {
  category: string;
  active?: boolean;
};

export function CategoryBadge({ category, active = false }: Props) {
  const style = active
    ? "bg-forest text-white"
    : "bg-forest-light text-forest";

  return (
    <span className={`inline-block rounded-[20px] px-3 py-1 text-[13px] font-medium ${style}`}>
      {category}
    </span>
  );
}
