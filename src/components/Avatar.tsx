const COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-sky-500",
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
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 ${color} ${sizes[size]}`}
      title={name}
    >
      {initial}
    </span>
  );
}
