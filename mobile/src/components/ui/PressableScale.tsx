import { memo, useCallback } from "react";
import { type GestureResponderEvent, type PressableProps } from "react-native";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { tap } from "@/lib/haptics";
import { AnimatedPressable } from "@/lib/interop";

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

export type PressableScaleProps = PressableProps & {
  className?: string;
  scaleTo?: number;
  haptic?: boolean;
};

// Pressable that springs down slightly on touch — used for every tappable surface
export const PressableScale = memo(function PressableScale({
  scaleTo = 0.96,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withSpring(scaleTo, SPRING);
      onPressIn?.(e);
    },
    [onPressIn, scale, scaleTo],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      scale.value = withSpring(1, SPRING);
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (haptic) tap();
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressable
      {...rest}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      animatedStyle={animatedStyle}
    >
      {children}
    </AnimatedPressable>
  );
});
