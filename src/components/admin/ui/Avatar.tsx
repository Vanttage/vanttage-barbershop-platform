import { getInitials } from "@/src/types";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-[13px]",
  lg: "h-12 w-12 text-[15px]",
  xl: "h-16 w-16 text-[22px]",
};

export default function Avatar({ src, alt, size = "md", className = "" }: AvatarProps) {
  const initials = getInitials(alt);

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} flex-shrink-0 rounded-full object-cover ring-2 ring-gold/25 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex flex-shrink-0 select-none items-center justify-center rounded-full font-semibold text-zinc-950 ring-2 ring-gold/25 ${className}`}
      style={{
        background: "linear-gradient(135deg, #c9a84c 0%, #e2c47a 60%, #a07830 100%)",
      }}
    >
      {initials}
    </div>
  );
}
