import Image from "next/image";

/** Intrinsic pixel dimensions of the source PNGs in public/logo/, for next/image sizing. */
const LOGO_FILES = {
  dark: { src: "/logo/S_white.png", width: 659, height: 237 },
  light: { src: "/logo/S.png", width: 690, height: 237 },
};

export function Logo({
  size = "md",
  variant = "dark",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";
  className?: string;
}) {
  const heightPx = size === "xl" ? 64 : size === "lg" ? 44 : size === "sm" ? 28 : 36;
  const { src, width, height } = LOGO_FILES[variant];
  const widthPx = Math.round((width / height) * heightPx);

  return (
    <Image
      src={src}
      alt="Padel Social"
      width={widthPx}
      height={heightPx}
      priority
      className={className}
      style={{ width: widthPx, height: heightPx }}
    />
  );
}
