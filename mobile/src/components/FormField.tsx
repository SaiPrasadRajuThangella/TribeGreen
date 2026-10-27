import { forwardRef, memo, useState } from "react";
import { TextInput, type TextInputInstance, type TextInputProps, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Text } from "./ui";

type Props = TextInputProps & {
  label: string;
  error?: string;
  optional?: boolean;
};

export const FormField = memo(
  forwardRef<TextInputInstance, Props>(function FormField(
    { label, error, optional, multiline, onFocus, onBlur, ...props },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const border = error ? "border-danger" : focused ? "border-ink" : "border-line";

    return (
      <View className="mb-4">
        <View className="mb-1.5 flex-row justify-between">
          <Text weight="semibold" className="text-[13px]">
            {label}
          </Text>
          {optional ? (
            <Text tone="faint" className="text-[12px]">
              Optional
            </Text>
          ) : null}
        </View>
        <TextInput
          {...props}
          ref={ref}
          placeholderTextColor="#A3A69D"
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={`rounded-2xl border bg-canvas px-4 font-sans text-[15px] text-ink ${border} ${
            multiline ? "min-h-[104px] py-3.5" : "h-[52px]"
          }`}
        />
        {error ? (
          <Animated.View entering={FadeIn.duration(150)}>
            <Text tone="danger" className="mt-1.5 text-[12px]">
              {error}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    );
  }),
);
