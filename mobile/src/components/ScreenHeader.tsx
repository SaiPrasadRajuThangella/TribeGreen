import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { memo, type ReactNode } from "react";
import { View } from "react-native";

import { IconButton, Text } from "./ui";

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
};

export const ScreenHeader = memo(function ScreenHeader({ title, subtitle, back = false, right }: Props) {
  return (
    <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
      {back ? <IconButton icon={ChevronLeft} label="Go back" onPress={() => router.back()} /> : null}
      <View className="flex-1">
        <Text weight="bold" className="text-[22px] leading-7">
          {title}
        </Text>
        {subtitle ? (
          <Text tone="muted" className="text-[13px]">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
});
