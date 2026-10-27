import type { LucideIcon } from "lucide-react-native";
import { memo } from "react";

import { PressableScale, type PressableScaleProps } from "./PressableScale";

type Props = Omit<PressableScaleProps, "children"> & {
  icon: LucideIcon;
  label: string;
  variant?: "card" | "soft" | "dark" | "lime";
  size?: number;
  iconColor?: string;
};

const BG = { card: "bg-card", soft: "bg-soft", dark: "bg-ink", lime: "bg-lime" } as const;

export const IconButton = memo(function IconButton({
  icon: Icon,
  label,
  variant = "card",
  size = 44,
  iconColor,
  className = "",
  ...rest
}: Props) {
  const color = iconColor ?? (variant === "dark" ? "#FFFFFF" : "#121212");
  return (
    <PressableScale
      haptic
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={{ width: size, height: size }}
      className={`items-center justify-center rounded-full ${BG[variant]} ${className}`}
      {...rest}
    >
      <Icon size={Math.round(size * 0.43)} color={color} strokeWidth={2} />
    </PressableScale>
  );
});
