import type { BottomTabBarProps } from "expo-router/js-tabs";
import { ClipboardList, Home, LayoutGrid, type LucideIcon, ShoppingBag } from "lucide-react-native";
import { memo } from "react";
import { View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

import { useEnquiryList } from "@/store";

import { PressableScale, Text } from "./ui";

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  home: { label: "Home", icon: Home },
  catalogue: { label: "Catalogue", icon: LayoutGrid },
  list: { label: "List", icon: ShoppingBag },
  enquiries: { label: "Enquiries", icon: ClipboardList },
};

const LAYOUT = LinearTransition.springify().damping(20).stiffness(220);

// Floating dark pill bar; the active tab grows into a lime capsule with its label
export const TabBar = memo(function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const listCount = useEnquiryList((s) => s.items.length);

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 px-5"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="h-[68px] flex-row items-center justify-between rounded-full bg-ink px-2.5">
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = index === state.index;
          const Icon = tab.icon;

          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          return (
            <Animated.View key={route.key} layout={LAYOUT}>
              <PressableScale
                haptic
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={tab.label}
                className={`h-12 flex-row items-center justify-center rounded-full ${focused ? "bg-lime px-5" : "w-12"}`}
              >
                <View>
                  <Icon size={20} color={focused ? "#121212" : "#A3A69D"} strokeWidth={2} />
                  {route.name === "list" && listCount > 0 && !focused ? (
                    <View className="absolute -right-2 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1">
                      <Text weight="bold" className="text-[9px]">
                        {listCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {focused ? (
                  <Animated.View entering={FadeIn.duration(180)}>
                    <Text weight="semibold" className="ml-2 text-[13px]">
                      {tab.label}
                      {route.name === "list" && listCount > 0 ? ` · ${listCount}` : ""}
                    </Text>
                  </Animated.View>
                ) : null}
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
});

export const TAB_BAR_SPACE = 110;
