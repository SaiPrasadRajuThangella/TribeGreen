import { Check, Pencil, X } from "lucide-react-native";
import { memo, useState } from "react";
import { TextInput, View } from "react-native";

import { customisationMeta, formatINR } from "@/data/catalog";
import { useProducts } from "@/hooks/useProducts";
import { changeCallbackNumber } from "@/lib/api";
import { describeVariants } from "@/lib/items";
import type { BadgeTone } from "@/lib/orderStatus";
import { formatPhone, isValidPhone, normalisePhone } from "@/lib/validation";
import { useMyOrders } from "@/store";
import type { Enquiry, EnquiryItem } from "@/types";

import { ProductImage } from "./ProductImage";
import { Button, PressableScale, Text } from "./ui";

/* Shared pieces of the Orders tab and the order details screen */

const BADGE: Record<BadgeTone, { box: string; tone: "ink" | "white" | "blue" | "soft" | "danger" }> = {
  lime: { box: "bg-lime", tone: "ink" },
  ink: { box: "bg-ink", tone: "white" },
  blue: { box: "bg-[#E2EBF4]", tone: "blue" },
  soft: { box: "bg-soft", tone: "soft" },
  danger: { box: "bg-danger-soft", tone: "danger" },
};

export const Badge = memo(function Badge({ tone, label }: { tone: BadgeTone; label: string }) {
  const style = BADGE[tone];
  return (
    <View className={`rounded-full px-2.5 py-1 ${style.box}`}>
      <Text weight="semibold" tone={style.tone} className="text-[11px]">
        {label}
      </Text>
    </View>
  );
});

// Thin segmented progress bar with a label under each step
export const Progress = memo(function Progress({
  steps,
  current,
  dark,
}: {
  steps: readonly string[];
  current: number;
  dark?: boolean;
}) {
  return (
    <View className="flex-row gap-1.5">
      {steps.map((step, i) => {
        const done = i <= current;
        return (
          <View key={step} className="flex-1">
            <View className={`h-1.5 rounded-full ${done ? "bg-lime" : dark ? "bg-white/15" : "bg-soft"}`} />
            <Text
              weight="medium"
              tone={done ? (dark ? "white" : "ink") : "faint"}
              className="mt-1.5 text-[10px] leading-3"
            >
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

export const CustomisationTags = memo(function CustomisationTags({ item }: { item: EnquiryItem }) {
  if (!item.customisations?.length) return null;
  return (
    <View className="mt-1.5 flex-row flex-wrap gap-1">
      {item.customisations.map((c) => {
        const { icon: Icon, short } = customisationMeta(c);
        return (
          <View key={c} className="flex-row items-center gap-1 rounded-full bg-lime-soft px-2 py-0.5">
            <Icon size={10} color="#3A5512" strokeWidth={2.2} />
            <Text weight="semibold" tone="limeInk" className="text-[10px]">
              {short}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

// Each gift with its sizes / colours, customisation and price: agreed on orders, catalogue on enquiries
export const ItemList = memo(function ItemList({
  items,
}: {
  items: (EnquiryItem & { unitPrice?: number })[];
}) {
  const { byId } = useProducts();
  return (
    <View>
      {items.map((item, i) => {
        const price = item.unitPrice ?? item.listPrice;
        return (
          <View
            key={item.id}
            className={`flex-row items-start gap-3 py-3 ${i ? "border-t border-line" : ""}`}
          >
            <ProductImage source={byId.get(item.id)?.images[0]} className="h-12 w-12 rounded-xl" />
            <View className="flex-1">
              <Text weight="semibold" numberOfLines={1} className="text-[14px]">
                {item.name}
              </Text>
              <Text tone="muted" className="text-[12px]">
                {item.variants?.length ? describeVariants(item.variants) : byId.get(item.id)?.category}
              </Text>
              <CustomisationTags item={item} />
            </View>
            {price ? (
              <View className="items-end">
                <Text weight="semibold" className="text-[13px]">
                  {formatINR(item.units * price)}
                </Text>
                <Text tone="muted" className="text-[11px]">
                  {item.units} × {formatINR(price)}
                  {item.unitPrice ? "" : " est."}
                </Text>
              </View>
            ) : (
              <Text weight="semibold" className="text-[13px]">
                {item.units} units
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
});

// "We'll call +91 98765 43210 · Change number", with an inline editor
export function CallbackNumber({ enquiry }: { enquiry: Enquiry }) {
  const upsert = useMyOrders((s) => s.upsert);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!isValidPhone(value)) return setError("Enter a valid 10-digit mobile number");
    setSaving(true);
    setError(null);
    try {
      upsert(await changeCallbackNumber(enquiry.id, normalisePhone(value)));
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <View className="mt-1 flex-row flex-wrap items-center gap-x-1.5">
        <Text tone="soft" className="text-[13px]">
          {"We'll call "}
          <Text weight="semibold">{formatPhone(enquiry.phone)}</Text>
        </Text>
        <PressableScale
          haptic
          hitSlop={6}
          onPress={() => {
            setValue(formatPhone(enquiry.phone).replace("+91 ", ""));
            setEditing(true);
          }}
          className="flex-row items-center gap-1"
        >
          <Pencil size={12} color="#3A5512" strokeWidth={2.4} />
          <Text weight="semibold" tone="limeInk" className="text-[13px]">
            Change number
          </Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View className="mt-2">
      <View className="flex-row items-center gap-2">
        <View className="h-11 flex-1 flex-row items-center gap-2 rounded-full border border-line bg-card px-4">
          <Text tone="muted" className="text-[14px]">
            +91
          </Text>
          <TextInput
            autoFocus
            accessibilityLabel="New mobile number"
            keyboardType="phone-pad"
            value={value}
            onChangeText={(t) => {
              setValue(t);
              setError(null);
            }}
            style={{ paddingVertical: 0 }}
            className="flex-1 font-sans-semibold text-[14px] text-ink"
          />
        </View>
        <Button label="Save" icon={Check} variant="dark" size="md" loading={saving} onPress={save} />
        <PressableScale
          haptic
          onPress={() => setEditing(false)}
          accessibilityLabel="Cancel"
          className="h-11 w-11 items-center justify-center rounded-full bg-card"
        >
          <X size={17} color="#73776E" />
        </PressableScale>
      </View>
      {error ? (
        <Text tone="danger" className="mt-1.5 text-[12px]">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
