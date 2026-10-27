import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const enabled = Platform.OS !== "web";

export const tap = () => {
  if (enabled) Haptics.selectionAsync();
};

export const success = () => {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

export const impact = () => {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
