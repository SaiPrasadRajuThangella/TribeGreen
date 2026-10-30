import { router, useLocalSearchParams } from "expo-router";
import { Check, MessageCircle, PackageSearch, X } from "lucide-react-native";
import { ActivityIndicator, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { Badge, CallbackNumber, ItemList } from "@/components/orders";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button, Text } from "@/components/ui";
import { CUSTOMISATION_META, formatINR } from "@/data/catalog";
import { useNow } from "@/hooks/useNow";
import { useOrdersFeed } from "@/hooks/useOrdersFeed";
import { enquiryEstimate } from "@/lib/items";
import { customerStatus } from "@/lib/orderStatus";
import { daysUntil, formatDate, formatDay, formatTime, relativeDays, replyWindow } from "@/lib/time";
import { formatPhone } from "@/lib/validation";
import { openWhatsApp } from "@/lib/whatsapp";
import { isSignedIn, useCustomer } from "@/store";
import { type Enquiry, ORDER_STAGES, type OrderStage } from "@/types";

type StepState = "done" | "current" | "upcoming" | "cancelled";
type Step = { key: string; title: string; at?: string; state: StepState; lines: React.ReactNode[] };

const STAGE_COPY: Record<OrderStage, { done: string; upcoming: string }> = {
  Confirmed: {
    done: "Your order is confirmed.",
    upcoming: "Confirm the quote with our team to place the order.",
  },
  "In production": {
    done: "Your gifts are being customised and packed.",
    upcoming: "Customisation and packing start once the order is confirmed.",
  },
  Dispatched: { done: "On its way to you.", upcoming: "We'll share the courier details here." },
  Delivered: { done: "Delivered. We hope everyone loved them!", upcoming: "" },
};

// Every phase of an enquiry, from "sent" to "delivered" (or "cancelled"), same as the website
function buildSteps(e: Enquiry, now: number): Step[] {
  const order = e.order;
  const called = !!(e.contactedAt || order || e.status === "Contacted" || e.status === "Converted");
  const reply = replyWindow(e.respondBy, now);

  const steps: Step[] = [
    {
      key: "sent",
      title: "Enquiry sent",
      at: e.createdAt,
      state: "done",
      lines: [
        `${e.products.length} ${e.products.length === 1 ? "gift" : "gifts"}, ${e.units.toLocaleString("en-IN")} units in total`,
        `Needed by ${formatDay(e.deliveryDate)}`,
      ],
    },
    {
      key: "call",
      title: "Quote call",
      at: e.contactedAt,
      state: called ? "done" : "upcoming",
      lines: called
        ? ["We called you with a tailored quote."]
        : [
            reply.overdue
              ? "Taking a little longer than promised. Our team will call you very soon."
              : `Expect a call by ${formatTime(e.respondBy)}, in about ${reply.label}.`,
            <CallbackNumber key="phone" enquiry={e} />,
          ],
    },
  ];

  const reached = order ? ORDER_STAGES.indexOf(order.stage) : -1;
  ORDER_STAGES.forEach((stage, i) => {
    const done = i <= reached;
    const copy = STAGE_COPY[stage];
    const lines: React.ReactNode[] = [done ? copy.done : copy.upcoming];
    if (order && done && stage === "Confirmed") {
      lines.push(`Order total ${formatINR(order.total)}`, `Tracking number ${order.trackingNumber}`);
    }
    if (order && done && stage === "Dispatched") lines.push(`Tracking number ${order.trackingNumber}`);
    if (order && !done && stage === "Delivered") lines[0] = `Expected ${formatDay(order.expectedDelivery)}.`;
    // The team's latest note sits on the stage the order is at now
    if (order?.note && stage === order.stage) {
      lines.push(
        <Text key="note" tone="soft" className="mt-1 rounded-xl bg-lime-soft px-3 py-2 text-[13px]">
          “{order.note}”
        </Text>,
      );
    }
    steps.push({
      key: stage,
      title: stage === "Confirmed" ? "Order confirmed" : stage,
      at: done
        ? (order?.stageTimes?.[stage] ?? (stage === "Confirmed" ? order?.confirmedAt : undefined))
        : undefined,
      state: done ? "done" : "upcoming",
      lines: lines.filter(Boolean),
    });
  });

  if (e.status === "Lost") {
    const kept = steps.filter((s) => s.state === "done");
    kept.push({
      key: "cancelled",
      title: "Cancelled",
      at: e.closedAt,
      state: "cancelled",
      lines: [
        e.closedReason ?? "This enquiry was closed.",
        "Chat with us if you'd like to pick it up again.",
      ],
    });
    return kept;
  }
  const next = steps.find((s) => s.state === "upcoming");
  if (next) next.state = "current";
  return steps;
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const signedIn = useCustomer(isSignedIn);
  const { enquiries, loading } = useOrdersFeed(signedIn);
  const now = useNow();
  const e = enquiries.find((x) => x.id === id);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color="#121212" />
      </SafeAreaView>
    );
  }

  if (!e) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <ScreenHeader back title={id ?? "Order"} />
        <EmptyState
          icon={PackageSearch}
          title="We can't find this order"
          body="Orders show up for the mobile number they were made with. Check you're signed in with that number."
          actionLabel="Go to My orders"
          onAction={() => router.replace("/orders")}
        />
      </SafeAreaView>
    );
  }

  const order = e.order;
  const status = customerStatus(e);
  const steps = buildSteps(e, now);
  const days = order ? daysUntil(order.expectedDelivery, now) : 0;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        back
        title={`${order ? "Order" : "Enquiry"} ${e.id}`}
        subtitle={`${e.company} · sent ${formatDate(e.createdAt)}`}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}>
        <View className="flex-row items-center justify-between">
          <Text weight="extrabold" className="flex-1 text-[24px]">
            {headline(e)}
          </Text>
          <Badge tone={status.tone} label={status.label} />
        </View>

        {order && e.status !== "Lost" ? (
          <View className="rounded-[24px] bg-ink p-5">
            <Text tone="white" className="text-[11px] opacity-60">
              {order.stage === "Delivered" ? "Delivered" : "Expected delivery"}
            </Text>
            <Text weight="extrabold" tone="white" className="mt-0.5 text-[26px]">
              {formatDay(
                order.stage === "Delivered"
                  ? (order.stageTimes?.Delivered ?? order.expectedDelivery)
                  : order.expectedDelivery,
              )}
            </Text>
            {order.stage !== "Delivered" ? (
              <View className="mt-2 self-start rounded-full bg-lime px-2.5 py-1">
                <Text weight="bold" className="text-[11px]">
                  {days < 0 ? "Running late, we'll update you" : relativeDays(days)}
                </Text>
              </View>
            ) : null}
            <View className="mt-4 rounded-2xl bg-white/10 px-4 py-3">
              <Text tone="white" className="text-[11px] opacity-60">
                Tracking number
              </Text>
              <Text selectable weight="bold" tone="white" className="text-[15px] tracking-wider">
                {order.trackingNumber}
              </Text>
            </View>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(300)} className="rounded-[24px] bg-card p-5">
          <Text weight="bold" className="mb-5 text-[16px]">
            Every step
          </Text>
          {steps.map((s, i) => (
            <View
              key={s.key}
              className="flex-row gap-3.5"
              style={{ paddingBottom: i === steps.length - 1 ? 0 : 22 }}
            >
              {i < steps.length - 1 ? (
                <View
                  className={`absolute bottom-0 left-[15px] top-9 w-0.5 rounded-full ${s.state === "done" ? "bg-lime-deep" : "bg-line"}`}
                />
              ) : null}
              <Dot state={s.state} />
              <View className="flex-1 pt-1">
                <View className="flex-row flex-wrap items-baseline justify-between gap-x-3">
                  <Text
                    weight="semibold"
                    tone={s.state === "upcoming" ? "faint" : "ink"}
                    className="text-[14px]"
                  >
                    {s.title}
                  </Text>
                  {s.at ? (
                    <Text tone="muted" className="text-[11px]">
                      {formatDate(s.at)}, {formatTime(s.at)}
                    </Text>
                  ) : s.state === "current" ? (
                    <Text weight="semibold" tone="limeInk" className="text-[11px]">
                      Up next
                    </Text>
                  ) : null}
                </View>
                <View className="mt-1 gap-1">
                  {s.lines.map((line, j) =>
                    typeof line === "string" ? (
                      <Text
                        key={j}
                        tone={s.state === "upcoming" ? "faint" : "muted"}
                        className="text-[13px] leading-5"
                      >
                        {line}
                      </Text>
                    ) : (
                      <View key={j}>{line}</View>
                    ),
                  )}
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

        <View className="rounded-[24px] bg-card px-5 pt-4">
          <Text weight="bold" className="text-[16px]">
            Gifts
          </Text>
          <ItemList items={order?.items ?? e.products} />
          <View className="-mx-5 flex-row items-center justify-between border-t border-line px-5 py-3">
            <Text tone="muted" className="text-[13px]">
              {order ? "Order total" : "Estimated total"}
            </Text>
            <Text weight="extrabold" className="text-[16px]">
              {formatINR(order ? order.total : enquiryEstimate(e.products))}
            </Text>
          </View>
        </View>

        <View className="rounded-[24px] bg-card px-5 py-2">
          <Row label="Occasion" value={e.occasion} />
          <Row label="Needed by" value={formatDay(e.deliveryDate)} />
          <Row label="Units" value={e.units.toLocaleString("en-IN")} />
          <Row
            label="Customisation"
            value={
              e.customisations.length
                ? e.customisations.map((c) => CUSTOMISATION_META[c].short).join(", ")
                : "None"
            }
          />
          <Row label="Contact" value={e.name} />
          <Row label="Phone" value={formatPhone(e.phone)} />
          <Row label="Email" value={e.email} />
          {e.message ? <Row label="Message" value={e.message} /> : null}
        </View>

        <Button
          label={`Ask about this ${order ? "order" : "enquiry"}`}
          icon={MessageCircle}
          variant="outline"
          onPress={() => openWhatsApp(`Hi Tribe Green! I have a question about ${e.id}.`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function headline(e: Enquiry) {
  const order = e.order;
  if (e.status === "Lost") return "Cancelled";
  if (order?.stage === "Delivered")
    return `Delivered ${formatDay(order.stageTimes?.Delivered ?? order.expectedDelivery)}`;
  if (order?.stage === "Dispatched") return `Arriving by ${formatDay(order.expectedDelivery)}`;
  if (order) return `Expected ${formatDay(order.expectedDelivery)}`;
  if (e.status === "Contacted") return "Quote shared";
  return `Call by ${formatTime(e.respondBy)}`;
}

function Dot({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-full bg-lime">
        <Check size={15} color="#121212" strokeWidth={3} />
      </View>
    );
  }
  if (state === "cancelled") {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-full bg-danger-soft">
        <X size={15} color="#E5484D" strokeWidth={3} />
      </View>
    );
  }
  if (state === "current") {
    return (
      <View className="h-8 w-8 items-center justify-center rounded-full bg-ink">
        <View className="h-2.5 w-2.5 rounded-full bg-lime" />
      </View>
    );
  }
  return <View className="h-8 w-8 rounded-full border-2 border-line bg-card" />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-6 border-b border-line py-3 last:border-b-0">
      <Text tone="muted" className="text-[13px]">
        {label}
      </Text>
      <Text weight="medium" className="flex-1 text-right text-[13px]">
        {value}
      </Text>
    </View>
  );
}
