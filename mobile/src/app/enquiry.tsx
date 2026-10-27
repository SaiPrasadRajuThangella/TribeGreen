import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, Plus, X } from "lucide-react-native";
import { memo, useCallback, useMemo, useRef, useState } from "react";
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
import { ProductImage } from "@/components/ProductImage";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button, Chip, PressableScale, Text } from "@/components/ui";
import { BUDGET_BANDS, OCCASION_META } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { createEnquiry } from "@/lib/api";
import { success, tap } from "@/lib/haptics";
import { type EnquiryFormErrors, type EnquiryFormValues, validateEnquiry } from "@/lib/validation";
import { useEnquiryList, useMyEnquiries } from "@/store";
import { CUSTOMISATIONS, type Customisation, OCCASIONS } from "@/types";

const toISODate = (d: Date) => d.toISOString().slice(0, 10);
const prettyDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function EnquiryForm() {
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { byId } = useProducts();
  const listItems = useEnquiryList((s) => s.items);
  const removeFromList = useEnquiryList((s) => s.remove);
  const saveEnquiry = useMyEnquiries((s) => s.save);
  const lastEnquiry = useMyEnquiries((s) => s.enquiries[0]);

  // Start from a single product (from its page) or everything in the enquiry list
  const initial = useMemo<EnquiryFormValues>(() => {
    const source = productId ? [{ productId, units: byId.get(productId)?.minOrder ?? 25 }] : listItems;
    const products = source
      .map((i) => byId.get(i.productId))
      .filter((p) => !!p)
      .map((p) => ({ id: p.id, name: p.name }));
    const units = source.reduce((sum, i) => sum + i.units, 0);
    return {
      name: lastEnquiry?.name ?? "",
      company: lastEnquiry?.company ?? "",
      phone: lastEnquiry?.phone ?? "",
      email: lastEnquiry?.email ?? "",
      occasion: undefined as unknown as EnquiryFormValues["occasion"],
      units: units ? String(units) : "",
      budget: undefined as unknown as EnquiryFormValues["budget"],
      deliveryDate: "",
      products,
      customisations: [],
      message: "",
    };
    // Only computed once when the screen opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [values, setValues] = useState<EnquiryFormValues>(initial);
  const [errors, setErrors] = useState<EnquiryFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const refs = {
    company: useRef<TextInputInstance>(null),
    phone: useRef<TextInputInstance>(null),
    email: useRef<TextInputInstance>(null),
    units: useRef<TextInputInstance>(null),
  };

  const set = useCallback(<K extends keyof EnquiryFormValues>(key: K, value: EnquiryFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }, []);

  const toggleCustomisation = useCallback(
    (c: Customisation) => {
      const current = values.customisations ?? [];
      set("customisations", current.includes(c) ? current.filter((x) => x !== c) : [...current, c]);
    },
    [values.customisations, set],
  );

  const pickDate = () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const suggested = new Date(Date.now() + 14 * 86400000);
    if (Platform.OS !== "android") {
      set("deliveryDate", toISODate(suggested));
      return;
    }
    DateTimePickerAndroid.open({
      value: values.deliveryDate ? new Date(values.deliveryDate) : suggested,
      minimumDate: tomorrow,
      mode: "date",
      onValueChange: (_event, date) => set("deliveryDate", toISODate(date)),
    });
  };

  const submit = async () => {
    const { data, errors: found } = validateEnquiry(values);
    if (!data) {
      setErrors(found);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setSubmitting(true);
    try {
      const enquiry = await createEnquiry(data);
      saveEnquiry(enquiry);
      data.products.forEach((p) => removeFromList(p.id));
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
      <ScreenHeader back title="Request a quote" subtitle="We reply within 48 hours" />
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

          {/* Selected products */}
          <Card title="Gifts in this enquiry" error={errors.products}>
            <View className="gap-2.5">
              {values.products.map((p) => (
                <SelectedProduct
                  key={p.id}
                  name={p.name}
                  image={byId.get(p.id)?.images[0]}
                  onRemove={() =>
                    set(
                      "products",
                      values.products.filter((x) => x.id !== p.id),
                    )
                  }
                />
              ))}
            </View>
            <PressableScale
              haptic
              onPress={() => router.navigate("/catalogue")}
              className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-faint"
            >
              <Plus size={16} color="#2B2B2B" strokeWidth={2.2} />
              <Text weight="semibold" tone="soft" className="text-[13px]">
                Add more gifts
              </Text>
            </PressableScale>
          </Card>

          <Card title="Your details">
            <FormField
              label="Full name"
              placeholder="Ananya Sharma"
              value={values.name}
              onChangeText={(t) => set("name", t)}
              error={errors.name}
              autoComplete="name"
              returnKeyType="next"
              onSubmitEditing={() => refs.company.current?.focus()}
            />
            <FormField
              ref={refs.company}
              label="Company"
              placeholder="Acme Technologies"
              value={values.company}
              onChangeText={(t) => set("company", t)}
              error={errors.company}
              returnKeyType="next"
              onSubmitEditing={() => refs.phone.current?.focus()}
            />
            <FormField
              ref={refs.phone}
              label="Mobile number"
              placeholder="98765 43210"
              value={values.phone}
              onChangeText={(t) => set("phone", t)}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={14}
              returnKeyType="next"
              onSubmitEditing={() => refs.email.current?.focus()}
            />
            <FormField
              ref={refs.email}
              label="Work email"
              placeholder="ananya@acme.com"
              value={values.email}
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
                  selected={values.occasion === o}
                  onPress={() => set("occasion", o)}
                />
              ))}
            </View>

            <FormField
              ref={refs.units}
              label="Number of units"
              placeholder="100"
              value={String(values.units ?? "")}
              onChangeText={(t) => set("units", t.replace(/[^0-9]/g, ""))}
              error={errors.units}
              keyboardType="number-pad"
              maxLength={6}
            />

            <Label text="Budget per unit" error={errors.budget} />
            <View className="mb-4 flex-row flex-wrap gap-2">
              {BUDGET_BANDS.map((b) => (
                <Chip
                  key={b.id}
                  label={b.label}
                  selected={values.budget === b.id}
                  onPress={() => set("budget", b.id)}
                />
              ))}
            </View>

            <Label text="Delivery date" error={errors.deliveryDate} />
            <PressableScale
              haptic
              onPress={pickDate}
              accessibilityRole="button"
              className={`h-[52px] flex-row items-center justify-between rounded-2xl border bg-canvas px-4 ${
                errors.deliveryDate ? "border-danger" : "border-line"
              }`}
            >
              <Text tone={values.deliveryDate ? "ink" : "faint"} className="text-[15px]">
                {values.deliveryDate ? prettyDate(values.deliveryDate) : "Pick a date"}
              </Text>
              <CalendarDays size={18} color="#73776E" />
            </PressableScale>
          </Card>

          <Card title="Customisation">
            <View className="flex-row flex-wrap gap-2">
              {CUSTOMISATIONS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={values.customisations?.includes(c)}
                  onPress={() => toggleCustomisation(c)}
                />
              ))}
            </View>
            <Text tone="faint" className="mt-2.5 text-[12px]">
              Pick all that apply, or none for plain gifts.
            </Text>
          </Card>

          <Card title="Anything else?">
            <FormField
              label="Message"
              optional
              multiline
              placeholder="Packaging preferences, delivery cities, branding notes…"
              value={values.message}
              onChangeText={(t) => set("message", t)}
              error={errors.message}
              maxLength={500}
            />
          </Card>
        </ScrollView>

        <View
          className="border-t border-line bg-canvas px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button
            label="Send enquiry"
            variant="dark"
            loading={submitting}
            onPress={() => {
              tap();
              submit();
            }}
          />
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

function Label({ text, error }: { text: string; error?: string }) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text weight="semibold" className="text-[13px]">
        {text}
      </Text>
      {error ? (
        <Text tone="danger" className="text-[12px]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const SelectedProduct = memo(function SelectedProduct({
  name,
  image,
  onRemove,
}: {
  name: string;
  image?: string;
  onRemove: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-canvas p-2">
      <ProductImage source={image} className="h-11 w-11 rounded-xl" />
      <Text weight="medium" numberOfLines={1} className="flex-1 text-[14px]">
        {name}
      </Text>
      <PressableScale
        haptic
        onPress={onRemove}
        hitSlop={8}
        accessibilityLabel={`Remove ${name}`}
        className="h-8 w-8 items-center justify-center rounded-full bg-card"
      >
        <X size={14} color="#2B2B2B" strokeWidth={2.4} />
      </PressableScale>
    </View>
  );
});
