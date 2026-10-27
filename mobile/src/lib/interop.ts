import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

// NativeWind only wires up core RN components; register Reanimated's too
cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.ScrollView, { className: "style", contentContainerClassName: "contentContainerStyle" });
