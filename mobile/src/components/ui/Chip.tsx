import type { LucideIcon } from "lucide-react-native";
import { memo } from "react";

import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

type Props = {
  label: string;
  selected?: boolean;
  icon?: LucideIcon;
  onPress?: () => void;
  className?: string;
};

export const Chip = memo(function Chip({
  label,
  selected = false,
  icon: Icon,
  onPress,
  className = "",
}: Props) {
  return (
    <PressableScale
      haptic
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`h-10 flex-row items-center gap-1.5 rounded-full px-4 ${
        selected ? "bg-lime" : "border border-line bg-card"
      } ${className}`}
    >
      {Icon ? <Icon size={15} color={selected ? "#121212" : "#2B2B2B"} strokeWidth={2} /> : null}
      <Text
        weight={selected ? "semibold" : "medium"}
        tone={selected ? "ink" : "soft"}
        className="text-[13px]"
      >
        {label}
      </Text>
    </PressableScale>
  );
});
