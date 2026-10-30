import { Tabs } from "expo-router/js-tabs";

import { TabBar } from "@/components/TabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // Every tab is mounted up front, so switching tabs never waits on a first render
      screenOptions={{
        headerShown: false,
        lazy: false,
        animation: "none",
        sceneStyle: { backgroundColor: "#F1F2EE" },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="catalogue" />
      <Tabs.Screen name="list" />
      <Tabs.Screen name="orders" />
    </Tabs>
  );
}
