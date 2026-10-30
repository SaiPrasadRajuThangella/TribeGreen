import { memo, useEffect } from "react";
import { type DimensionValue, View } from "react-native";
import { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { AnimatedView } from "@/lib/interop";

// Grey placeholder that gently pulses while content loads
export const Skeleton = memo(function Skeleton({
  width,
  height,
  radius = 12,
  className = "",
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  className?: string;
}) {
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));

  return (
    <AnimatedView
      animatedStyle={style}
      className={`bg-soft ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
});

// Same shape as ProductCard, for the catalogue grid and the home rows
export const ProductCardSkeleton = memo(function ProductCardSkeleton({ width }: { width?: number }) {
  return (
    <View
      style={width ? { width } : undefined}
      className={`rounded-[26px] bg-card p-2 ${width ? "" : "flex-1"}`}
    >
      <Skeleton width="100%" radius={20} className="aspect-square" />
      <View className="gap-2 px-1.5 pb-1.5 pt-3">
        <Skeleton width="40%" height={10} radius={5} />
        <Skeleton width="85%" height={14} radius={7} />
        <Skeleton width="35%" height={14} radius={7} />
      </View>
    </View>
  );
});
