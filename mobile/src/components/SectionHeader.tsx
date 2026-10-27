import { memo } from "react";
import { View } from "react-native";

import { PressableScale, Text } from "./ui";

type Props = { title: string; actionLabel?: string; onAction?: () => void };

export const SectionHeader = memo(function SectionHeader({
  title,
  actionLabel = "See all",
  onAction,
}: Props) {
  return (
    <View className="mb-3 flex-row items-center justify-between px-5">
      <Text weight="bold" className="text-[17px]">
        {title}
      </Text>
      {onAction ? (
        <PressableScale onPress={onAction} hitSlop={8}>
          <Text weight="medium" tone="muted" className="text-[13px]">
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
});
