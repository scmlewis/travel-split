const COLORS = [
  "#e07a3a",
  "#d4622a",
  "#c96a2e",
  "#b85d3a",
  "#a6683e",
  "#8b6e4a",
  "#6b7a5a",
  "#4a8a6a",
  "#3a7a8a",
  "#4a6a9a",
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

export default function Avatar({ name, size = "md" }: AvatarProps) {
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
}
