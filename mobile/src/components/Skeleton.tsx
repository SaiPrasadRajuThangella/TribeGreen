import { memo, useEffect, useState } from "react";
import { type DimensionValue, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  makeMutable,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/*
 * Every placeholder shares one clock, so the light sweeps across all of them together like a
 * single wave. The clock runs only while at least one placeholder is on screen. It counts to
 * 1.25: the sweep takes 0 → 1 and the rest is a short pause before the next one.
 */
const wave = makeMutable(0);
let onScreen = 0;

function useWaveClock() {
  useEffect(() => {
    if (onScreen++ === 0) {
      wave.set(withRepeat(withTiming(1.25, { duration: 1500, easing: Easing.linear }), -1, false));
    }
    return () => {
      if (--onScreen === 0) {
        cancelAnimation(wave);
        wave.set(0);
      }
    };
  }, []);
}

function Sweep({ width }: { width: number }) {
  useWaveClock();
  const band = Math.min(Math.max(width * 0.55, 64), 260);
  const style = useAnimatedStyle(() => {
    const p = Math.min(wave.get(), 1);
    const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
    return {
      transform: [{ translateX: -band * 1.5 + eased * (width + band * 2) }, { skewX: "-20deg" }],
    };
  });

  return (
    <Animated.View style={[styles.band, { width: band }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="skeleton-wave" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.65} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#skeleton-wave)" />
      </Svg>
    </Animated.View>
  );
}

// The moving light on its own, for anything grey that is still loading (product photos use it).
// The parent clips it: give the parent overflow-hidden and its corner radius.
export const Shimmer = memo(function Shimmer() {
  const [width, setWidth] = useState(0);
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && <Sweep width={width} />}
    </View>
  );
});

// Grey placeholder with a light sweeping across it while content loads
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
  return (
    <View
      className={`overflow-hidden bg-soft ${className}`}
      style={{ width, height, borderRadius: radius }}
    >
      <Shimmer />
    </View>
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

const styles = StyleSheet.create({
  band: { position: "absolute", top: 0, bottom: 0, left: 0 },
});
