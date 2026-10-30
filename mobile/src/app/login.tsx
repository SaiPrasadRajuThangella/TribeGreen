import { Redirect, router, useLocalSearchParams } from "expo-router";
import { ArrowRight, ChevronLeft, MessageSquareText, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  TextInput,
  type TextInputInstance,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/FormField";
import { Button, IconButton, PressableScale, Text } from "@/components/ui";
import { requestCode, updateProfile, verifyCode } from "@/lib/api";
import { success } from "@/lib/haptics";
import { formatPhone, isValidPhone, normalisePhone } from "@/lib/validation";
import { isSignedIn, useCustomer, useEnquiryDraft } from "@/store";

type Step = "phone" | "code" | "profile";

const RESEND_AFTER_S = 30;

// Only screens inside the app, so ?next= can't send people elsewhere
const safeNext = (next?: string) => (next?.startsWith("/") && !next.startsWith("//") ? next : "/home");

/*
 * Mobile number → 6-digit code → (new numbers only) name, company, email.
 * Same accounts as the website: orders show up in both.
 */
export default function Login() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const signedIn = useCustomer(isSignedIn);
  const needsProfile = useCustomer((s) => !!s.token && !!s.user && !s.user.profileComplete);
  const setSession = useCustomer((s) => s.setSession);
  const setUser = useCustomer((s) => s.setUser);
  const draft = useEnquiryDraft((s) => s.draft);

  const [step, setStep] = useState<Step>(needsProfile ? "profile" : "phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [profile, setProfile] = useState({
    name: draft.name ?? "",
    company: draft.company ?? "",
    email: draft.email ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!resendIn) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Signed in with a complete profile: carry on to where they were going
  if (signedIn) return <Redirect href={safeNext(next) as never} />;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () => {
    if (!isValidPhone(phone)) return setError("Enter a valid 10-digit mobile number");
    return run(async () => {
      const res = await requestCode(normalisePhone(phone));
      setDemoCode(res.demoCode ?? null);
      setCode("");
      setResendIn(RESEND_AFTER_S);
      setStep("code");
    });
  };

  const verify = (value: string) =>
    run(async () => {
      try {
        const { token, user } = await verifyCode(normalisePhone(phone), value);
        success();
        setSession(token, user);
        // A new number has an account now; it only needs a name, company and email
        if (!user.profileComplete) {
          setProfile((p) => ({
            name: user.name || p.name,
            company: user.company || p.company,
            email: user.email || p.email,
          }));
          setStep("profile");
        }
      } catch (err) {
        setCode("");
        throw err;
      }
    });

  const saveProfile = () => {
    if (profile.name.trim().length < 2) return setError("Enter your full name");
    if (profile.company.trim().length < 2) return setError("Enter your company name");
    if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) return setError("Enter a valid email address");
    return run(async () => setUser(await updateProfile(profile)));
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <IconButton
            icon={ChevronLeft}
            label="Go back"
            onPress={() => {
              if (step === "code") setStep("phone");
              else if (router.canGoBack()) router.back();
              else router.replace("/home");
            }}
          />
          <StepDots step={step} />
          <View className="w-11" />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, paddingTop: 32 }}
        >
          <Animated.View key={step} entering={FadeIn.duration(220)}>
            {step === "phone" ? (
              <>
                <Text weight="extrabold" className="text-[28px] leading-[34px]">
                  Sign in or create an account
                </Text>
                <Text tone="muted" className="mt-2 text-[15px] leading-6">
                  {
                    "Enter your mobile number and we'll send you a 6-digit code. It's the same account as the Tribe Green website."
                  }
                </Text>
                <Text weight="semibold" className="mb-2 mt-8 text-[13px]">
                  Mobile number
                </Text>
                <View
                  className={`h-14 flex-row items-center gap-3 rounded-2xl border bg-card px-4 ${error ? "border-danger" : "border-line"}`}
                >
                  <Text weight="semibold" tone="muted" className="text-[16px]">
                    +91
                  </Text>
                  <View className="h-6 w-px bg-line" />
                  <TextInput
                    autoFocus
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    maxLength={14}
                    placeholder="98765 43210"
                    placeholderTextColor="#A3A69D"
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t);
                      setError(null);
                    }}
                    onSubmitEditing={sendCode}
                    style={{ paddingVertical: 0 }}
                    className="flex-1 font-sans-semibold text-[18px] tracking-wide text-ink"
                  />
                </View>
                <ErrorText error={error} />
                <Button
                  label="Send code"
                  icon={ArrowRight}
                  iconPosition="right"
                  variant="dark"
                  loading={busy}
                  className="mt-6"
                  onPress={sendCode}
                />
                <View className="mt-4 flex-row items-center justify-center gap-1.5">
                  <ShieldCheck size={14} color="#A3A69D" />
                  <Text tone="faint" className="text-[12px]">
                    We use your number only for your enquiries and orders.
                  </Text>
                </View>
              </>
            ) : step === "code" ? (
              <>
                <Text weight="extrabold" className="text-[28px] leading-[34px]">
                  Enter the code
                </Text>
                <Text tone="muted" className="mt-2 text-[15px]">
                  Sent to <Text weight="semibold">{formatPhone(phone)}</Text>
                </Text>
                <View className="mt-8">
                  <CodeInput
                    value={code}
                    invalid={!!error}
                    disabled={busy}
                    onChange={(value) => {
                      setCode(value);
                      setError(null);
                      if (value.length === 6) verify(value);
                    }}
                  />
                </View>
                {demoCode ? (
                  <View className="mt-4 flex-row items-start gap-2 rounded-2xl bg-lime-soft px-4 py-3">
                    <MessageSquareText size={17} color="#3A5512" />
                    <Text tone="limeInk" className="flex-1 text-[13px] leading-5">
                      Demo mode, no SMS is sent yet. Your code is{" "}
                      <Text weight="bold" tone="limeInk">
                        {demoCode}
                      </Text>
                      .
                    </Text>
                  </View>
                ) : null}
                <ErrorText error={error} />
                <Button
                  label="Verify and continue"
                  variant="dark"
                  loading={busy}
                  disabled={code.length < 6}
                  className="mt-6"
                  onPress={() => verify(code)}
                />
                <View className="mt-4 items-center">
                  {resendIn ? (
                    <Text tone="muted" className="text-[13px]">
                      Resend code in 0:{String(resendIn).padStart(2, "0")}
                    </Text>
                  ) : (
                    <PressableScale haptic onPress={sendCode} disabled={busy}>
                      <Text weight="semibold" className="text-[13px] underline">
                        Resend code
                      </Text>
                    </PressableScale>
                  )}
                </View>
              </>
            ) : (
              <>
                <Text weight="extrabold" className="text-[28px] leading-[34px]">
                  Welcome! Tell us about you
                </Text>
                <Text tone="muted" className="mb-8 mt-2 text-[15px] leading-6">
                  So every quote reaches the right person. You only do this once.
                </Text>
                <FormField
                  label="Full name"
                  placeholder="Ananya Sharma"
                  autoComplete="name"
                  value={profile.name}
                  onChangeText={(name) => setProfile({ ...profile, name })}
                />
                <FormField
                  label="Company"
                  placeholder="Acme Technologies"
                  value={profile.company}
                  onChangeText={(company) => setProfile({ ...profile, company })}
                />
                <FormField
                  label="Work email"
                  placeholder="ananya@acme.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={profile.email}
                  onChangeText={(email) => setProfile({ ...profile, email })}
                />
                <ErrorText error={error} />
                <Button
                  label="Continue"
                  icon={ArrowRight}
                  iconPosition="right"
                  variant="dark"
                  loading={busy}
                  className="mt-4"
                  onPress={saveProfile}
                />
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepDots({ step }: { step: Step }) {
  const index = { phone: 0, code: 1, profile: 2 }[step];
  return (
    <View className="flex-row gap-1.5">
      {[0, 1, 2].map((i) => (
        <View key={i} className={`h-1.5 rounded-full ${i <= index ? "w-8 bg-ink" : "w-4 bg-soft"}`} />
      ))}
    </View>
  );
}

// Six boxes over one hidden input, so paste and SMS autofill work
function CodeInput({
  value,
  onChange,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const ref = useRef<TextInputInstance>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="6-digit code">
      <View className="flex-row justify-between gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const active = i === Math.min(value.length, 5);
          return (
            <View
              key={i}
              className={`h-14 flex-1 items-center justify-center rounded-2xl border ${
                invalid
                  ? "border-danger bg-danger-soft"
                  : active
                    ? "border-ink bg-card"
                    : "border-line bg-card"
              }`}
            >
              <Text weight="bold" className="text-[20px]">
                {value[i] ?? ""}
              </Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        autoFocus
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
        accessibilityLabel="6-digit code"
        className="absolute inset-0 opacity-0"
      />
    </Pressable>
  );
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <Text tone="danger" weight="medium" className="mt-3 text-[13px]">
      {error}
    </Text>
  ) : null;
}
