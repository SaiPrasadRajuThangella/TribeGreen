import { Redirect } from "expo-router";

import { usePrefs } from "@/store";

export default function Index() {
  const onboarded = usePrefs((s) => s.onboarded);
  return <Redirect href={onboarded ? "/home" : "/onboarding"} />;
}
