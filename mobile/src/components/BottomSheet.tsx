import { type ReactNode, useEffect, useState } from "react";
import { BackHandler, Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Portal } from "./Portal";

type Props = {
  visible: boolean;
  onClose: () => void;
  closeLabel?: string;
  maxHeight?: `${number}%`;
  children: ReactNode; // mounted on each opening
};

const SLIDE_IN = SlideInDown.duration(260).easing(Easing.out(Easing.cubic));
const SLIDE_OUT = SlideOutDown.duration(200).easing(Easing.in(Easing.cubic));

/*
 * Bottom sheet drawn at the app root rather than in a <Modal>. A Modal is a separate Android
 * window that first lays out above the navigation bar and only later moves under it, so the
 * sheet stopped short and then dropped into place. Here it lands at the bottom on the first frame.
 */
export function BottomSheet({ visible, onClose, closeLabel = "Close", maxHeight = "85%", children }: Props) {
  return (
    <Portal>
      {visible ? (
        <Frame onClose={onClose} closeLabel={closeLabel} maxHeight={maxHeight}>
          {children}
        </Frame>
      ) : null}
    </Portal>
  );
}

function Frame({ onClose, closeLabel, maxHeight, children }: Omit<Props, "visible">) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();

  // Android back closes the sheet instead of leaving the screen
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(180)}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={closeLabel} />
      </Animated.View>
      <Animated.View
        entering={SLIDE_IN}
        exiting={SLIDE_OUT}
        style={[
          styles.panel,
          { maxHeight, paddingBottom: keyboard ? keyboard + 12 : Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>
        {children}
      </Animated.View>
    </>
  );
}

// Lifts the sheet's content above the on-screen keyboard
function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (e) =>
      setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.4)" },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#F1F2EE",
  },
  handleRow: { alignItems: "center", paddingTop: 12 },
  handle: { height: 6, width: 40, borderRadius: 999, backgroundColor: "#E1E3DC" },
});
