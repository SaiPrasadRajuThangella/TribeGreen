import { memo } from "react";
import { View } from "react-native";

import { Text } from "./ui";

// "Asha Rao" → "AR". There is no photo upload: the account is shown by its initials
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

export const Avatar = memo(function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View className="items-center justify-center rounded-full bg-ink" style={{ width: size, height: size }}>
      <Text weight="extrabold" tone="lime" style={{ fontSize: Math.round(size * 0.34) }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
});
