import { cssInterop } from "nativewind";
import { type ComponentType, createElement } from "react";
import { Pressable } from "react-native";
import Animated from "react-native-reanimated";

/*
 * Reanimated views that accept className. Use these instead of Animated.View with className.
 *
 * NativeWind folds className and every style entry into one object. When a useAnimatedStyle()
 * value is among those entries, Reanimated takes the whole object for its animated style and
 * keeps only the animated values, so every class is lost on Android and iOS (web is fine).
 * These components take the animated style in its own prop and add it after NativeWind's merge.
 *
 * Reanimated's own Animated.View is deliberately NOT registered with NativeWind: libraries
 * that Metro compiles from source (gesture-handler's swipeable, for one) render it with
 * [style, animatedStyle] arrays, and registering it broke them on phones.
 */
type WithAnimatedStyleProps = { className?: string; animatedStyle?: object };

function withAnimatedStyle<P extends { style?: unknown }>(Component: ComponentType<P>) {
  function WithAnimatedStyle({ animatedStyle, ...props }: P & WithAnimatedStyleProps) {
    // createElement, not JSX: JSX would hand Component straight back to NativeWind
    return createElement(Component, { ...props, style: [props.style, animatedStyle] } as unknown as P);
  }
  cssInterop(WithAnimatedStyle as ComponentType<{ style?: unknown; className?: string }>, {
    className: "style",
  });
  return WithAnimatedStyle;
}

export const AnimatedView = withAnimatedStyle(Animated.View);
export const AnimatedPressable = withAnimatedStyle(Animated.createAnimatedComponent(Pressable));
