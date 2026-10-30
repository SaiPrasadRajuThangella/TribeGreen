import { AlertTriangle } from "lucide-react-native";
import { memo } from "react";
import { Modal, Pressable, View } from "react-native";
import { ZoomIn } from "react-native-reanimated";

import { AnimatedView } from "@/lib/interop";
import { Button, Text } from "./ui";

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Centred "Are you sure?" dialog
export const ConfirmDialog = memo(function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  loading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <Pressable className="absolute inset-0" onPress={onCancel} accessibilityLabel={cancelLabel} />
        <AnimatedView
          entering={ZoomIn.springify().damping(20).stiffness(260)}
          className="w-full max-w-[360px] items-center rounded-[28px] bg-card p-6"
        >
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
            <AlertTriangle size={24} color="#E5484D" strokeWidth={2} />
          </View>
          <Text weight="bold" className="text-center text-[18px]">
            {title}
          </Text>
          {body ? (
            <Text tone="muted" className="mt-1.5 text-center text-[14px] leading-5">
              {body}
            </Text>
          ) : null}
          <View className="mt-6 w-full flex-row gap-2.5">
            <Button label={cancelLabel} variant="outline" size="md" className="flex-1" onPress={onCancel} />
            <Button
              label={confirmLabel}
              variant="danger"
              size="md"
              loading={loading}
              className="flex-1"
              onPress={onConfirm}
            />
          </View>
        </AnimatedView>
      </View>
    </Modal>
  );
});
