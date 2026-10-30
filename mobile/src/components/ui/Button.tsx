import type { LucideIcon } from "lucide-react-native";
import { memo } from "react";
import { ActivityIndicator, View } from "react-native";

import { PressableScale, type PressableScaleProps } from "./PressableScale";
import { Text } from "./Text";

const VARIANTS = {
  primary: { box: "bg-lime", tone: "ink", icon: "#121212" },
  dark: { box: "bg-ink", tone: "white", icon: "#FFFFFF" },
  outline: { box: "bg-card border border-line", tone: "ink", icon: "#121212" },
  ghost: { box: "bg-soft", tone: "ink", icon: "#121212" },
  danger: { box: "bg-danger", tone: "white", icon: "#FFFFFF" },
} as const;

type Props = Omit<PressableScaleProps, "children"> & {
  label: string;
  variant?: keyof typeof VARIANTS;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  size?: "md" | "lg";
};

export const Button = memo(function Button({
  label,
  variant = "primary",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  size = "lg",
  className = "",
  disabled,
  ...rest
}: Props) {
  const v = VARIANTS[variant];
  const height = size === "lg" ? "h-14" : "h-11";

  return (
    <PressableScale
      haptic
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`${height} flex-row items-center justify-center rounded-full px-6 ${v.box} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.icon} />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon && iconPosition === "left" ? <Icon size={18} color={v.icon} strokeWidth={2.2} /> : null}
          <Text weight="semibold" tone={v.tone} className={size === "lg" ? "text-[15px]" : "text-sm"}>
            {label}
          </Text>
          {Icon && iconPosition === "right" ? <Icon size={18} color={v.icon} strokeWidth={2.2} /> : null}
        </View>
      )}
    </PressableScale>
  );
});
