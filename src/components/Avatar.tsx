import { memo } from "react";

const COLORS = [
  "#0D7C6B",
  "#1D9682",
  "#4A6579",
  "#4D5580",
  "#34B19C",
  "#627F94",
  "#656E9A",
  "#5C6065",
  "#595F66",
  "#727880",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return Math.abs(h);
}

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export default memo(function Avatar({ name, size = "md" }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const color = COLORS[hashName(name) % COLORS.length];
  const sizes = {
    sm: "w-5 h-5 text-[9px]",
    md: "w-7 h-7 text-[11px]",
    lg: "w-9 h-9 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 ${sizes[size]}`}
      style={{ background: color }}
      title={name}
    >
      {initial}
    </span>
  );
});
