import { Check, type LucideIcon } from "lucide-react-native";
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

// Selected chips fill green with a tick, so the choice reads at a glance
export const Chip = memo(function Chip({
  label,
  selected = false,
  icon: Icon,
  onPress,
  className = "",
}: Props) {
  const Mark = selected && !Icon ? Check : Icon;
  return (
    <PressableScale
      haptic
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`h-10 flex-row items-center gap-1.5 rounded-full border px-4 ${
        selected ? "border-lime-deep bg-lime" : "border-line bg-card"
      } ${className}`}
    >
      {Mark ? (
        <Mark size={15} color={selected ? "#3A5512" : "#2B2B2B"} strokeWidth={selected ? 2.6 : 2} />
      ) : null}
      <Text weight="semibold" tone={selected ? "limeInk" : "soft"} className="text-[13px]">
        {label}
      </Text>
    </PressableScale>
  );
});
