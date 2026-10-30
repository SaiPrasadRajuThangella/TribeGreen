import Constants from "expo-constants";
import { router } from "expo-router";
import { Check, LogOut, type LucideIcon, Mail, Pencil, Phone, UserRound } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button, PressableScale, Text } from "@/components/ui";
import { updateProfile } from "@/lib/api";
import { success } from "@/lib/haptics";
import { formatPhone } from "@/lib/validation";
import { isSignedIn, useCustomer } from "@/store";
import type { Customer } from "@/types";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

// Name (editable), email and mobile number (fixed to the account), sign out and the app version
export default function Profile() {
  const user = useCustomer((s) => s.user);
  const signedIn = useCustomer(isSignedIn);
  const signOut = useCustomer((s) => s.signOut);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const leave = () => {
    setConfirmSignOut(false);
    signOut();
    if (router.canGoBack()) router.back();
    else router.replace("/home");
  };

  if (!signedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-canvas">
        <ScreenHeader title="Profile" back />
        <EmptyState
          icon={UserRound}
          title="Sign in to see your profile"
          body="Use the mobile number you enquire with."
          actionLabel="Sign in"
          onAction={() => router.replace({ pathname: "/login", params: { next: "/profile" } })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScreenHeader title="Profile" back />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <View className="items-center pb-6 pt-2">
          <Avatar name={user.name} size={96} />
          <Text weight="bold" className="mt-4 text-center text-[20px]">
            {user.name}
          </Text>
        </View>

        <View className="rounded-[28px] bg-card px-4">
          <NameRow user={user} />
          <View className="h-px bg-line" />
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <View className="h-px bg-line" />
          <InfoRow icon={Phone} label="Mobile number" value={formatPhone(user.phone)} />
        </View>

        <Button
          label="Sign out"
          icon={LogOut}
          variant="outline"
          className="mt-6"
          onPress={() => setConfirmSignOut(true)}
        />

        <Text tone="faint" className="mt-6 text-center text-[12px]">
          Tribe Green · Version {APP_VERSION}
        </Text>
      </ScrollView>

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sign out?"
        body="You'll need your mobile number and a code to sign in again. Your enquiry list stays on this phone."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        onConfirm={leave}
        onCancel={() => setConfirmSignOut(false)}
      />
    </SafeAreaView>
  );
}

function RowIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <View className="h-10 w-10 items-center justify-center rounded-full bg-soft">
      <Icon size={17} color="#2B2B2B" strokeWidth={2} />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 py-4">
      <RowIcon icon={icon} />
      <View className="flex-1">
        <Text tone="muted" className="text-[12px]">
          {label}
        </Text>
        <Text weight="semibold" numberOfLines={1} className="text-[15px]">
          {value}
        </Text>
      </View>
    </View>
  );
}

// The one thing customers can change here. Company and email are sent back unchanged
function NameRow({ user }: { user: Customer }) {
  const setUser = useCustomer((s) => s.setUser);
  const [draft, setDraft] = useState<string | null>(null); // null while not editing
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(user.name);
    setError(null);
  };

  const save = async () => {
    const name = (draft ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2) return setError("Enter your full name");
    if (name === user.name) return setDraft(null);
    setSaving(true);
    setError(null);
    try {
      setUser(await updateProfile({ name, company: user.company, email: user.email }));
      success();
      setDraft(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (draft === null) {
    return (
      <View className="flex-row items-center gap-3 py-4">
        <RowIcon icon={UserRound} />
        <View className="flex-1">
          <Text tone="muted" className="text-[12px]">
            Name
          </Text>
          <Text weight="semibold" numberOfLines={1} className="text-[15px]">
            {user.name}
          </Text>
        </View>
        <PressableScale
          haptic
          hitSlop={8}
          onPress={startEditing}
          accessibilityRole="button"
          accessibilityLabel="Edit name"
          className="flex-row items-center gap-1 rounded-full bg-lime-soft px-3 py-1.5"
        >
          <Pencil size={12} color="#3A5512" strokeWidth={2.4} />
          <Text weight="semibold" tone="limeInk" className="text-[12px]">
            Edit
          </Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View className="py-4">
      <Text weight="semibold" className="mb-1.5 text-[13px]">
        Name
      </Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        autoFocus
        autoCapitalize="words"
        autoComplete="name"
        maxLength={80}
        returnKeyType="done"
        onSubmitEditing={save}
        editable={!saving}
        placeholder="Your full name"
        placeholderTextColor="#A3A69D"
        className={`h-[52px] rounded-2xl border bg-canvas px-4 font-sans text-[15px] text-ink ${
          error ? "border-danger" : "border-ink"
        }`}
      />
      {error ? (
        <Text tone="danger" className="mt-1.5 text-[12px]">
          {error}
        </Text>
      ) : null}
      <View className="mt-3 flex-row gap-2.5">
        <Button
          label="Cancel"
          variant="outline"
          size="md"
          className="flex-1"
          disabled={saving}
          onPress={() => setDraft(null)}
        />
        <Button
          label="Save"
          icon={Check}
          variant="dark"
          size="md"
          className="flex-1"
          loading={saving}
          onPress={save}
        />
      </View>
    </View>
  );
}
