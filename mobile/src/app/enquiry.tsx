import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { CalendarDays, Plus, UserRound } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewInstance,
  type TextInputInstance,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { FormField } from "@/components/FormField";
import { GiftRow } from "@/components/GiftRow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button, Chip, PressableScale, Text } from "@/components/ui";
import { formatINR, OCCASION_META } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { createEnquiry } from "@/lib/api";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { success, tap } from "@/lib/haptics";
import { allCustomisations, lineTotal, quantityProblem, toEnquiryItem } from "@/lib/items";
import {
  type EnquiryFormErrors,
  type EnquiryFormValues,
  formatPhone,
  validateEnquiry,
} from "@/lib/validation";
import {
  type EnquiryDraft,
  isSignedIn,
  useCustomer,
  useEnquiryDraft,
  useEnquiryList,
  useMyOrders,
} from "@/store";
import { OCCASIONS } from "@/types";

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000);
const prettyDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function EnquiryForm() {
  const insets = useSafeAreaInsets();
  const { byId } = useProducts();
  const listItems = useEnquiryList((s) => s.items);
  const clearList = useEnquiryList((s) => s.clear);
  // Saved as the user types, so details survive a trip to the catalogue or to sign in
  const draft = useEnquiryDraft((s) => s.draft);
  const setField = useEnquiryDraft((s) => s.setField);
  const clearDraft = useEnquiryDraft((s) => s.clear);
  const customer = useCustomer((s) => s.user);
  const signedIn = useCustomer(isSignedIn);

  const [errors, setErrors] = useState<EnquiryFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const companyRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);

  // Gifts come straight from the enquiry list
  const gifts = useMemo(
    () =>
      listItems.flatMap((item) =>
        byId.get(item.productId) ? [{ item, product: byId.get(item.productId)! }] : [],
      ),
    [listItems, byId],
  );
  const totals = useMemo(
    () =>
      gifts.reduce(
        (acc, { item, product }) => ({
          units: acc.units + item.units,
          total: acc.total + lineTotal(product, item),
        }),
        { units: 0, total: 0 },
      ),
    [gifts],
  );

  const products = gifts.map(({ item, product }) => toEnquiryItem(product, item));
  // Signed-in customers start from their profile; anything typed here wins
  const form: EnquiryFormValues = {
    name: customer?.name ?? "",
    company: customer?.company ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    deliveryDate: "",
    message: "",
    ...draft,
    occasion: draft.occasion as EnquiryFormValues["occasion"],
    units: totals.units,
    products,
    customisations: allCustomisations(products),
  };

  const set = <K extends keyof EnquiryDraft>(key: K, value: EnquiryDraft[K]) => {
    setField(key, value);
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const pickDate = () => {
    const tomorrow = daysFromNow(1);
    const suggested = daysFromNow(14);
    if (Platform.OS !== "android") {
      set("deliveryDate", toISODate(suggested));
      return;
    }
    DateTimePickerAndroid.open({
      value: form.deliveryDate ? new Date(form.deliveryDate) : suggested,
      minimumDate: tomorrow,
      mode: "date",
      onValueChange: (_event, date) => set("deliveryDate", toISODate(date)),
    });
  };

  const submit = async () => {
    const { data, errors: found } = validateEnquiry(form);
    // Sizes are checked here too: the schema can't know which gifts come in sizes
    if (gifts.some(({ item, product }) => quantityProblem(product, item))) {
      found.products = "Finish the quantities for the marked gifts";
    }
    if (!data || found.products) {
      setErrors(found);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    // Enquiries belong to an account: sign in, then come back here (the form is saved)
    if (!signedIn) {
      router.push({ pathname: "/login", params: { next: "/enquiry" } });
      return;
    }
    setSubmitting(true);
    try {
      const enquiry = await createEnquiry(data);
      useMyOrders.getState().upsert(enquiry);
      clearList();
      clearDraft();
      success();
      router.replace({ pathname: "/thank-you", params: { id: enquiry.id } });
    } catch (e) {
      Alert.alert("Couldn't send your enquiry", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        back
        title="Request a quote"
        subtitle={`We call you back within ${REPLY_WITHIN_HOURS} hours`}
      />
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          {errorCount > 0 ? (
            <View className="mb-4 rounded-2xl bg-danger-soft px-4 py-3">
              <Text weight="semibold" tone="danger" className="text-[13px]">
                {errorCount === 1
                  ? "1 field needs your attention"
                  : `${errorCount} fields need your attention`}
              </Text>
            </View>
          ) : null}

          {signedIn && customer ? (
            <View className="mb-4 flex-row items-center gap-2 self-start rounded-full bg-card px-3.5 py-2">
              <UserRound size={14} color="#73776E" />
              <Text tone="muted" className="text-[13px]">
                Signed in as <Text weight="semibold">{customer.name}</Text> · {formatPhone(customer.phone)}
              </Text>
            </View>
          ) : null}

          {/* Gifts, each with its own sizes and customisation */}
          <Card title="Gifts in this enquiry" error={errors.products}>
            {gifts.length ? (
              <View className="gap-2.5">
                {gifts.map(({ item, product }) => (
                  <GiftRow key={product.id} item={item} product={product} surface="canvas" />
                ))}
              </View>
            ) : (
              <Text tone="muted" className="rounded-2xl bg-canvas p-4 text-[13px]">
                {"No gifts added yet. Pick a few from the catalogue; what you've typed here stays saved."}
              </Text>
            )}
            <PressableScale
              haptic
              onPress={() => router.navigate("/catalogue")}
              className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-faint"
            >
              <Plus size={16} color="#2B2B2B" strokeWidth={2.2} />
              <Text weight="semibold" tone="soft" className="text-[13px]">
                {gifts.length ? "Add more gifts" : "Browse gifts"}
              </Text>
            </PressableScale>
            {gifts.length ? (
              <View className="mt-4 border-t border-line pt-3">
                <SummaryRow label="Total units" value={totals.units.toLocaleString("en-IN")} />
                <SummaryRow label="Estimated total" value={formatINR(totals.total)} strong />
                <Text tone="faint" className="mt-1 text-[11px]">
                  At catalogue prices with your customisation. The quote confirms it.
                </Text>
              </View>
            ) : null}
          </Card>

          <Card title="Your details">
            <FormField
              label="Full name"
              placeholder="Ananya Sharma"
              value={form.name}
              onChangeText={(t) => set("name", t)}
              error={errors.name}
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => companyRef.current?.focus()}
            />
            <FormField
              ref={companyRef}
              label="Company"
              placeholder="Acme Technologies"
              value={form.company}
              onChangeText={(t) => set("company", t)}
              error={errors.company}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <FormField
              ref={phoneRef}
              label="Mobile number"
              placeholder="98765 43210"
              value={form.phone}
              onChangeText={(t) => set("phone", t)}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={14}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <FormField
              ref={emailRef}
              label="Work email"
              placeholder="ananya@acme.com"
              value={form.email}
              onChangeText={(t) => set("email", t)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </Card>

          <Card title="Order details">
            <Label text="Occasion" error={errors.occasion} />
            <View className="mb-4 flex-row flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <Chip
                  key={o}
                  label={OCCASION_META[o].short}
                  icon={OCCASION_META[o].icon}
                  selected={form.occasion === o}
                  onPress={() => set("occasion", o)}
                />
              ))}
            </View>

            <Label text="Number of units" error={errors.units} hint="Total of your gifts" />
            <View className="mb-4 h-[52px] justify-center rounded-2xl bg-soft/60 px-4">
              <Text weight="semibold" tone={totals.units ? "ink" : "faint"} className="text-[15px]">
                {totals.units ? totals.units.toLocaleString("en-IN") : "Add gifts to see the total"}
              </Text>
            </View>

            <Label text="Delivery date" error={errors.deliveryDate} />
            <PressableScale
              haptic
              onPress={pickDate}
              accessibilityRole="button"
              className={`mb-4 h-[52px] flex-row items-center justify-between rounded-2xl border bg-canvas px-4 ${
                errors.deliveryDate ? "border-danger" : "border-line"
              }`}
            >
              <Text tone={form.deliveryDate ? "ink" : "faint"} className="text-[15px]">
                {form.deliveryDate ? prettyDate(form.deliveryDate) : "Pick a date"}
              </Text>
              <CalendarDays size={18} color="#73776E" />
            </PressableScale>

            <FormField
              label="Message"
              optional
              multiline
              placeholder="Packaging preferences, delivery cities, branding notes…"
              value={form.message}
              onChangeText={(t) => set("message", t)}
              error={errors.message}
              maxLength={500}
            />
            <Text tone="faint" className="text-[12px]">
              Logo printing, engraving and names are picked on each gift above.
            </Text>
          </Card>
        </ScrollView>

        <View
          className="border-t border-line bg-canvas px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button
            label={signedIn ? "Send enquiry" : "Sign in to send"}
            icon={signedIn ? undefined : UserRound}
            variant="dark"
            loading={submitting}
            onPress={() => {
              tap();
              submit();
            }}
          />
          <Text tone="faint" className="mt-2 text-center text-[11px]">
            {signedIn
              ? `No payment needed. We'll call you with a quote within ${REPLY_WITHIN_HOURS} hours.`
              : "Sign in with your mobile number. Everything you've typed stays here."}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Card({ title, error, children }: { title: string; error?: string; children: React.ReactNode }) {
  return (
    <View className={`mb-4 rounded-[28px] bg-card p-5 ${error ? "border border-danger" : ""}`}>
      <Text weight="bold" className="mb-4 text-[16px]">
        {title}
      </Text>
      {children}
      {error ? (
        <Text tone="danger" className="mt-2 text-[12px]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function Label({ text, error, hint }: { text: string; error?: string; hint?: string }) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text weight="semibold" className="text-[13px]">
        {text}
      </Text>
      {error ? (
        <Text tone="danger" className="text-[12px]">
          {error}
        </Text>
      ) : hint ? (
        <Text tone="faint" className="text-[12px]">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text tone="muted" className="text-[13px]">
        {label}
      </Text>
      <Text weight={strong ? "extrabold" : "semibold"} className={strong ? "text-[16px]" : "text-[14px]"}>
        {value}
      </Text>
    </View>
  );
}
