import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  type EasingFunction,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

const LIME = "#C8E98A"; // same as the native splash background in app.json, so the hand-over is seamless
const INK = "#121212";
const LIME_INK = "#3A5512";

const TAGLINE = "Corporate gifting, beautifully simple.";
const FOOTER = "WELCOME KITS · HAMPERS · BRANDED MERCH";

// One timeline in milliseconds drives every piece, so the splash always lasts exactly TOTAL
const TOTAL = 3000;
const AT = {
  badge: 0,
  stem: 320,
  leftLeaf: 580,
  rightLeaf: 740,
  rings: 500,
  name: 820, // letters rise one after another
  divider: 1300,
  tagline: 1420,
  footer: 1550,
  progress: 200,
  exit: 2600, // fades into the app underneath
} as const;
const LETTER_GAP = 40;
const RING_PERIOD = 1700;

const OUT = Easing.out(Easing.cubic);
const POP = Easing.out(Easing.back(1.7));
const IN_OUT = Easing.inOut(Easing.cubic);

// 0 → 1 while the timeline passes from `start` to `start + duration`
function phase(t: number, start: number, duration: number, easing: EasingFunction) {
  "worklet";
  return easing(Math.min(Math.max((t - start) / duration, 0), 1));
}

/*
 * Brand intro shown over the app for 3 seconds on every cold start: a sprout grows inside the
 * dark badge, the name rises letter by letter, then the tagline, then it all fades into the app.
 * The app mounts underneath meanwhile, so the catalogue is already loading when it fades.
 * StyleSheet only: NativeWind classes and Reanimated styles don't mix on phones (see lib/interop).
 */
export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withTiming(TOTAL, { duration: TOTAL, easing: Easing.linear }, (finished) => {
        if (finished) scheduleOnRN(onDone);
      }),
    );
  }, [t, onDone]);

  const screen = useAnimatedStyle(() => ({
    opacity: 1 - phase(t.get(), AT.exit, TOTAL - AT.exit, IN_OUT),
  }));
  const content = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.05 * phase(t.get(), AT.exit, TOTAL - AT.exit, Easing.in(Easing.cubic)) }],
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: phase(t.get(), 80, 900, OUT),
    transform: [{ scale: 0.6 + 0.4 * phase(t.get(), 80, 1000, OUT) }],
  }));
  const badge = useAnimatedStyle(() => ({
    opacity: phase(t.get(), AT.badge, 280, OUT),
    transform: [{ scale: 0.45 + 0.55 * phase(t.get(), AT.badge, 720, POP) }],
  }));
  const stem = useAnimatedStyle(() => ({
    transform: [{ scaleY: phase(t.get(), AT.stem, 420, OUT) }],
  }));
  const leftLeaf = useAnimatedStyle(() => {
    const p = phase(t.get(), AT.leftLeaf, 560, POP);
    return { transform: [{ rotate: `${(1 - p) * 30}deg` }, { scale: p }] };
  });
  const rightLeaf = useAnimatedStyle(() => {
    const p = phase(t.get(), AT.rightLeaf, 560, POP);
    return { transform: [{ rotate: `${(p - 1) * 30}deg` }, { scale: p }] };
  });
  const divider = useAnimatedStyle(() => ({
    transform: [{ scaleX: phase(t.get(), AT.divider, 420, OUT) }],
  }));
  const tagline = useAnimatedStyle(() => {
    const p = phase(t.get(), AT.tagline, 520, OUT);
    return { opacity: p, transform: [{ translateY: (1 - p) * 12 }] };
  });
  const footer = useAnimatedStyle(() => ({ opacity: phase(t.get(), AT.footer, 500, OUT) }));
  const progress = useAnimatedStyle(() => ({
    transform: [{ scaleX: phase(t.get(), AT.progress, AT.exit - AT.progress, IN_OUT) }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.screen, screen]}>
      <Animated.View style={[styles.center, content]}>
        <View style={styles.markArea}>
          <Animated.View style={[styles.haloOuter, halo]} />
          <Animated.View style={[styles.haloInner, halo]} />
          <Ring t={t} delay={0} />
          <Ring t={t} delay={RING_PERIOD / 2} />
          <Animated.View style={[styles.badge, badge]}>
            <View style={styles.mark}>
              <Animated.View style={[styles.layer, styles.stemOrigin, stem]}>
                <Sprout d="M48 80 L48 45" stroke />
              </Animated.View>
              <Animated.View style={[styles.layer, styles.leftLeafOrigin, leftLeaf]}>
                <Sprout d="M47 61 C34 63 20 55 18 39 C33 38 45 46 47 61 Z" vein="M44 58 Q31 52 22 42" />
              </Animated.View>
              <Animated.View style={[styles.layer, styles.rightLeafOrigin, rightLeaf]}>
                <Sprout d="M49 47 C50 31 63 19 80 19 C80 36 68 48 49 47 Z" vein="M52 44 Q62 31 76 22" />
              </Animated.View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.nameRow}>
          {"Tribe".split("").map((char, i) => (
            <Letter key={`t${i}`} char={char} index={i} t={t} />
          ))}
          <Letter char={" "} index={5} t={t} />
          {"Green".split("").map((char, i) => (
            <Letter key={`g${i}`} char={char} index={6 + i} t={t} accent />
          ))}
        </View>
        <Animated.View style={[styles.divider, divider]} />
        <Animated.Text style={[styles.tagline, tagline]}>{TAGLINE}</Animated.Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { paddingBottom: insets.bottom + 32 }, footer]}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, progress]} />
        </View>
        <Text style={styles.caption}>{FOOTER}</Text>
      </Animated.View>
    </Animated.View>
  );
}

// One piece of the sprout, drawn on the shared 96 × 96 grid so the pieces line up
function Sprout({ d, vein, stroke }: { d: string; vein?: string; stroke?: boolean }) {
  return (
    <Svg width={MARK} height={MARK} viewBox="0 0 96 96">
      {stroke ? (
        <Path d={d} stroke={LIME} strokeWidth={6} strokeLinecap="round" />
      ) : (
        <Path d={d} fill={LIME} />
      )}
      {vein ? (
        <Path d={vein} stroke={INK} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.55} />
      ) : null}
    </Svg>
  );
}

function Letter({
  char,
  index,
  t,
  accent,
}: {
  char: string;
  index: number;
  t: SharedValue<number>;
  accent?: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const p = phase(t.get(), AT.name + index * LETTER_GAP, 460, OUT);
    return { opacity: p, transform: [{ translateY: (1 - p) * 22 }] };
  });
  return <Animated.Text style={[styles.name, accent && styles.nameAccent, style]}>{char}</Animated.Text>;
}

// A thin ring that leaves the badge and fades, over and over
function Ring({ t, delay }: { t: SharedValue<number>; delay: number }) {
  const style = useAnimatedStyle(() => {
    const elapsed = t.get() - AT.rings - delay;
    if (elapsed < 0) return { opacity: 0, transform: [{ scale: 1 }] };
    const p = (elapsed % RING_PERIOD) / RING_PERIOD;
    return { opacity: 0.4 * (1 - p), transform: [{ scale: 1 + 0.9 * OUT(p) }] };
  });
  return <Animated.View style={[styles.ring, style]} />;
}

const BADGE = 116;
const MARK = 76;

const styles = StyleSheet.create({
  screen: { backgroundColor: LIME, zIndex: 100 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },

  markArea: { width: 260, height: 260, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  haloOuter: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  haloInner: {
    position: "absolute",
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  ring: {
    position: "absolute",
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 1.5,
    borderColor: INK,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 16px 32px rgba(18, 18, 18, 0.28)",
  },
  mark: { width: MARK, height: MARK },
  layer: { position: "absolute", top: 0, left: 0, width: MARK, height: MARK },
  // Each piece grows from where it meets the stem (as % of the 96 grid)
  stemOrigin: { transformOrigin: "50% 83%" },
  leftLeafOrigin: { transformOrigin: "49% 64%" },
  rightLeafOrigin: { transformOrigin: "51% 49%" },

  nameRow: { flexDirection: "row", marginTop: 8 },
  name: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -0.6,
    color: INK,
  },
  nameAccent: { color: LIME_INK },
  divider: { width: 36, height: 3, borderRadius: 2, backgroundColor: INK, marginTop: 14, marginBottom: 14 },
  tagline: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    lineHeight: 22,
    color: LIME_INK,
    textAlign: "center",
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
  },
  track: {
    width: 132,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(18, 18, 18, 0.12)",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: INK,
    transformOrigin: "0% 50%",
  },
  caption: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.2,
    color: LIME_INK,
    opacity: 0.85,
    textAlign: "center",
  },
});
