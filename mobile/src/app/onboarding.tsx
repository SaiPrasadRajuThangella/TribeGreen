import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { View } from "react-native";
import { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductImage } from "@/components/ProductImage";
import { Button, Text } from "@/components/ui";
import { BANNER_IMAGES } from "@/data/catalog";
import { AnimatedView } from "@/lib/interop";
import { usePrefs } from "@/store";

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const finish = usePrefs((s) => s.finishOnboarding);

  const start = () => {
    finish();
    router.replace("/home");
  };

  // Signing up at the start; browsing first is fine too, sign-in is asked for when sending
  const signUp = () => {
    finish();
    router.replace({ pathname: "/login", params: { next: "/home" } });
  };

  return (
    <View className="flex-1 bg-canvas">
      <AnimatedView
        entering={FadeInUp.duration(600)}
        className="flex-1 overflow-hidden rounded-b-[40px] bg-lime"
      >
        <ProductImage source={BANNER_IMAGES.hero} className="h-full w-full" />
        <View
          className="absolute left-5 rounded-full bg-card/90 px-3.5 py-2"
          style={{ top: insets.top + 12 }}
        >
          <Text weight="bold" className="text-[13px]">
            🌿 Tribe Green
          </Text>
        </View>
      </AnimatedView>

      <AnimatedView
        entering={FadeInDown.delay(150).duration(600)}
        className="px-6 pt-8"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
      >
        <View className="mb-5 flex-row gap-1.5">
          <View className="h-1.5 w-8 rounded-full bg-ink" />
          <View className="h-1.5 w-1.5 rounded-full bg-faint" />
          <View className="h-1.5 w-1.5 rounded-full bg-faint" />
        </View>
        <Text weight="extrabold" className="mb-3 text-[30px] leading-[38px]">
          Corporate gifting,{"\n"}beautifully simple.
        </Text>
        <Text tone="muted" className="mb-8 text-[15px] leading-6">
          Welcome kits, festive hampers and branded merchandise — customised with your logo and delivered
          across India.
        </Text>
        <Button
          label="Sign in or create an account"
          variant="dark"
          icon={ArrowRight}
          iconPosition="right"
          onPress={signUp}
        />
        <Button label="Browse first" variant="ghost" size="md" className="mt-3" onPress={start} />
      </AnimatedView>
    </View>
  );
}
