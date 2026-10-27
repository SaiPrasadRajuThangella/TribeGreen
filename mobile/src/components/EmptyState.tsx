import type { LucideIcon } from "lucide-react-native";
import { memo } from "react";
import { View } from "react-native";

import { Button, Text } from "./ui";

type Props = {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View className="flex-1 items-center justify-center px-10 py-16">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-lime-soft">
        <Icon size={32} color="#3A5512" strokeWidth={1.8} />
      </View>
      <Text weight="bold" className="mb-1.5 text-center text-lg">
        {title}
      </Text>
      <Text tone="muted" className="mb-6 text-center text-sm leading-5">
        {body}
      </Text>
      {actionLabel ? <Button label={actionLabel} variant="dark" size="md" onPress={onAction} /> : null}
    </View>
  );
});
