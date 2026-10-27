import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { forwardRef, memo } from "react";
import { TextInput, type TextInputInstance, View } from "react-native";

import { IconButton, PressableScale, Text } from "./ui";

type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void; // when set, the bar is a button that opens search
  onFilterPress?: () => void;
  filterCount?: number;
  placeholder?: string;
};

export const SearchBar = memo(
  forwardRef<TextInputInstance, Props>(function SearchBar(
    {
      value,
      onChangeText,
      onPress,
      onFilterPress,
      filterCount = 0,
      placeholder = "Search gifts, bottles, hoodies…",
    },
    ref,
  ) {
    const field = onPress ? (
      <PressableScale
        scaleTo={0.98}
        onPress={onPress}
        className="h-12 flex-1 flex-row items-center gap-2.5 rounded-2xl bg-card px-4"
      >
        <Search size={18} color="#73776E" />
        <Text tone="faint" className="text-sm">
          {placeholder}
        </Text>
      </PressableScale>
    ) : (
      <View className="h-12 flex-1 flex-row items-center gap-2.5 rounded-2xl bg-card px-4">
        <Search size={18} color="#73776E" />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A3A69D"
          returnKeyType="search"
          className="h-12 flex-1 font-sans text-sm text-ink"
        />
        {value ? (
          <IconButton
            icon={X}
            label="Clear search"
            size={28}
            variant="soft"
            onPress={() => onChangeText?.("")}
          />
        ) : null}
      </View>
    );

    return (
      <View className="flex-row items-center gap-2.5 px-5">
        {field}
        {onFilterPress ? (
          <View>
            <IconButton
              icon={SlidersHorizontal}
              label="Filters"
              size={48}
              variant="dark"
              onPress={onFilterPress}
              className="rounded-2xl"
            />
            {filterCount > 0 ? (
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1">
                <Text weight="bold" className="text-[11px]">
                  {filterCount}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }),
);
