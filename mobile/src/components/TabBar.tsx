import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Home, LayoutGrid, type LucideIcon, Package, ShoppingBag } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { tap } from "@/lib/haptics";
import { useEnquiryList } from "@/store";

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  home: { label: "Home", icon: Home },
  catalogue: { label: "Catalogue", icon: LayoutGrid },
  list: { label: "List", icon: ShoppingBag },
  orders: { label: "Orders", icon: Package },
};

// Floating dark pill bar; the active tab is a lime capsule with its label.
// Styled with StyleSheet only (no Tailwind classes) and no layout animation, so the highlight
// always shows on phones and switches on the same frame as the tap.
export const TabBar = memo(function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const listCount = useEnquiryList((s) => s.items.length);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = index === state.index;
          const Icon = tab.icon;

          const onPress = () => {
            const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            tap();
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              hitSlop={4}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              // A plain array: NativeWind wipes Pressable's ({ pressed }) => style function on phones
              style={[styles.tab, focused ? styles.tabActive : styles.tabIdle]}
            >
              <View>
                <Icon size={20} color={focused ? "#121212" : "#A3A69D"} strokeWidth={2} />
                {route.name === "list" && listCount > 0 && !focused ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{listCount}</Text>
                  </View>
                ) : null}
              </View>
              {focused ? (
                <Text numberOfLines={1} style={styles.label}>
                  {tab.label}
                  {route.name === "list" && listCount > 0 ? ` · ${listCount}` : ""}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

export const TAB_BAR_SPACE = 110;

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  bar: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 999,
    backgroundColor: "#121212",
    paddingHorizontal: 10,
  },
  tab: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  tabIdle: { width: 48 },
  tabActive: { backgroundColor: "#C8E98A", paddingHorizontal: 18 },
  label: { marginLeft: 8, fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: "#121212" },
  badge: {
    position: "absolute",
    right: -8,
    top: -6,
    height: 16,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#C8E98A",
    paddingHorizontal: 4,
  },
  badgeText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 9, color: "#121212" },
});
