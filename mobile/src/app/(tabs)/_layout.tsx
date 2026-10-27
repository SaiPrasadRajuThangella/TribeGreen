import { Tabs } from "expo-router/js-tabs";

import { TabBar } from "@/components/TabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#F1F2EE" } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="catalogue" />
      <Tabs.Screen name="list" />
      <Tabs.Screen name="enquiries" />
    </Tabs>
  );
}
