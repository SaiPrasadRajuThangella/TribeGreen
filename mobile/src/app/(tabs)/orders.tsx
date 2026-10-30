import { router } from "expo-router";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  LogOut,
  PackageSearch,
  UserRound,
} from "lucide-react-native";
import { memo, useMemo } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { Badge, CallbackNumber, ItemList, Progress } from "@/components/orders";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/TabBar";
import { PressableScale, Text } from "@/components/ui";
import { formatINR, OCCASION_META } from "@/data/catalog";
import { useNow } from "@/hooks/useNow";
import { useOrdersFeed } from "@/hooks/useOrdersFeed";
import { REPLY_WITHIN_HOURS } from "@/lib/config";
import { enquiryEstimate } from "@/lib/items";
import { customerStatus } from "@/lib/orderStatus";
import { daysUntil, formatDate, formatDay, formatTime, relativeDays, replyWindow } from "@/lib/time";
import { isSignedIn, useCustomer } from "@/store";
import { type Enquiry, ORDER_STAGES } from "@/types";

const QUOTE_STEPS = ["Enquiry sent", "Quote call", "Order confirmed", "Delivered"];

const openOrder = (id: string) => router.push({ pathname: "/order/[id]", params: { id } });

export default function Orders() {
  const signedIn = useCustomer(isSignedIn);
  const user = useCustomer((s) => s.user);
  const signOut = useCustomer((s) => s.signOut);
  const { enquiries, loading, error, refreshing, refresh } = useOrdersFeed(signedIn);
  const now = useNow();

  const groups = useMemo(() => {
    const current: Enquiry[] = [];
    const quotes: Enquiry[] = [];
    const past: Enquiry[] = [];
    for (const e of enquiries) {
      if (e.status === "Lost" || e.order?.stage === "Delivered") past.push(e);
      else if (e.status === "Converted") current.push(e);
      else quotes.push(e);
    }
    const eta = (e: Enquiry) => e.order?.expectedDelivery ?? e.deliveryDate;
    current.sort((a, b) => eta(a).localeCompare(eta(b)));
    return { current, quotes, past };
  }, [enquiries]);

  if (!signedIn) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
        <ScreenHeader title="My orders" />
        <View className="flex-1" style={{ paddingBottom: TAB_BAR_SPACE }}>
          <EmptyState
            icon={UserRound}
            title="Sign in to see your orders"
            body="Use the mobile number you enquire with. Orders placed on the website show up here too."
            actionLabel="Sign in"
            onAction={() => router.push({ pathname: "/login", params: { next: "/orders" } })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
      <ScreenHeader
        title="My orders"
        subtitle={user ? `${user.name} · ${user.company}` : undefined}
        right={
          <PressableScale
            haptic
            hitSlop={8}
            onPress={signOut}
            accessibilityLabel="Sign out"
            className="flex-row items-center gap-1.5 rounded-full bg-card px-3 py-2"
          >
            <LogOut size={14} color="#2B2B2B" />
            <Text weight="semibold" className="text-[12px]">
              Sign out
            </Text>
          </PressableScale>
        }
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#121212" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#121212" />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE, gap: 24 }}
        >
          {error ? (
            <View className="rounded-2xl bg-danger-soft p-4">
              <Text tone="danger" className="text-[13px]">
                {error}
              </Text>
            </View>
          ) : null}

          {enquiries.length === 0 && !error ? (
            <EmptyState
              icon={PackageSearch}
              title="No orders yet"
              body={`Send an enquiry and it shows up here, with a call back within ${REPLY_WITHIN_HOURS} hours. Once you confirm the quote, you'll see your order and its delivery date.`}
              actionLabel="Browse gifts"
              onAction={() => router.navigate("/catalogue")}
            />
          ) : null}

          {groups.current.length ? (
            <Group title="Current orders" count={groups.current.length}>
              {groups.current.map((e) => (
                <OrderCard key={e.id} enquiry={e} now={now} />
              ))}
            </Group>
          ) : null}
          {groups.quotes.length ? (
            <Group title="Waiting for a quote" count={groups.quotes.length}>
              {groups.quotes.map((e) => (
                <QuoteCard key={e.id} enquiry={e} now={now} />
              ))}
            </Group>
          ) : null}
          {groups.past.length ? (
            <Group title="Past" count={groups.past.length}>
              {groups.past.map((e) => (
                <PastCard key={e.id} enquiry={e} />
              ))}
            </Group>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View>
      <View className="mb-3 flex-row items-center gap-2">
        <Text weight="bold" className="text-[17px]">
          {title}
        </Text>
        <View className="h-6 min-w-6 items-center justify-center rounded-full bg-card px-1.5">
          <Text weight="bold" className="text-[11px]">
            {count}
          </Text>
        </View>
      </View>
      <View className="gap-3">{children}</View>
    </View>
  );
}

// The header row opens the order's own screen
function CardHeader({ enquiry: e, label, meta }: { enquiry: Enquiry; label: string; meta: string }) {
  const status = customerStatus(e);
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => openOrder(e.id)}
      className="flex-row items-start justify-between gap-3 p-4"
    >
      <View className="flex-1">
        <Text weight="semibold" tone="muted" className="text-[11px] uppercase tracking-wider">
          {label} <Text weight="bold">{e.id}</Text>
        </Text>
        <Text tone="muted" className="mt-0.5 text-[12px]">
          {meta}
        </Text>
      </View>
      <Badge tone={status.tone} label={status.label} />
    </PressableScale>
  );
}

function SeeEverything({ id }: { id: string }) {
  return (
    <PressableScale
      haptic
      onPress={() => openOrder(id)}
      className="flex-row items-center justify-center gap-1.5 border-t border-line py-3"
    >
      <Text weight="semibold" tone="soft" className="text-[13px]">
        See every step
      </Text>
      <ArrowRight size={14} color="#2B2B2B" />
    </PressableScale>
  );
}

const OrderCard = memo(function OrderCard({ enquiry: e, now }: { enquiry: Enquiry; now: number }) {
  const order = e.order;
  if (!order) {
    return (
      <Animated.View entering={FadeInDown.duration(300)} className="overflow-hidden rounded-[26px] bg-card">
        <CardHeader
          enquiry={e}
          label="Order"
          meta={`${OCCASION_META[e.occasion].short} · ${e.units} units`}
        />
        <Text tone="limeInk" className="mx-4 mb-2 rounded-2xl bg-lime-soft p-3 text-[13px]">
          Your order is confirmed. The final invoice and delivery date will appear here shortly.
        </Text>
        <SeeEverything id={e.id} />
      </Animated.View>
    );
  }
  const days = daysUntil(order.expectedDelivery, now);
  return (
    <Animated.View entering={FadeInDown.duration(300)} className="overflow-hidden rounded-[26px] bg-card">
      <CardHeader
        enquiry={e}
        label="Order"
        meta={`Confirmed ${formatDate(order.confirmedAt)} · ${OCCASION_META[e.occasion].short}`}
      />
      <View className="mx-4 rounded-[20px] bg-ink p-4">
        <Text tone="white" className="text-[11px] opacity-60">
          {order.stage === "Dispatched" ? "Arriving by" : "Expected delivery"}
        </Text>
        <View className="mt-0.5 flex-row items-center justify-between">
          <Text weight="extrabold" tone="white" className="text-[22px]">
            {formatDay(order.expectedDelivery)}
          </Text>
          <View className="rounded-full bg-lime px-2.5 py-1">
            <Text weight="bold" className="text-[11px]">
              {days < 0 ? "Running late" : relativeDays(days)}
            </Text>
          </View>
        </View>
        <Text tone="white" className="mb-4 mt-0.5 text-[11px] opacity-60">
          Tracking no.{" "}
          <Text weight="semibold" tone="white">
            {order.trackingNumber}
          </Text>
        </Text>
        <Progress steps={ORDER_STAGES} current={ORDER_STAGES.indexOf(order.stage)} dark />
      </View>
      <View className="px-4">
        <ItemList items={order.items} />
      </View>
      <View className="flex-row items-center justify-between border-t border-line px-4 py-3">
        <Text tone="muted" className="text-[13px]">
          Order total
        </Text>
        <Text weight="extrabold" className="text-[16px]">
          {formatINR(order.total)}
        </Text>
      </View>
      {order.note ? (
        <View className="mx-4 mb-4 rounded-2xl bg-lime-soft p-3">
          <Text weight="semibold" tone="limeInk" className="text-[12px]">
            Update from Tribe Green
          </Text>
          <Text tone="soft" className="mt-0.5 text-[13px]">
            {order.note}
          </Text>
        </View>
      ) : null}
      <SeeEverything id={e.id} />
    </Animated.View>
  );
});

const QuoteCard = memo(function QuoteCard({ enquiry: e, now }: { enquiry: Enquiry; now: number }) {
  const contacted = e.status === "Contacted";
  const reply = replyWindow(e.respondBy, now);
  const estimate = enquiryEstimate(e.products);
  return (
    <Animated.View entering={FadeInDown.duration(300)} className="overflow-hidden rounded-[26px] bg-card">
      <CardHeader
        enquiry={e}
        label="Enquiry"
        meta={`Sent ${formatDate(e.createdAt)}, ${formatTime(e.createdAt)}`}
      />
      <View className="mx-4">
        {contacted ? (
          <View className="rounded-[20px] bg-[#E2EBF4] p-3.5">
            <Text weight="semibold" tone="blue" className="text-[13px]">
              {"We've been in touch with your quote"}
            </Text>
            <Text tone="blue" className="mt-0.5 text-[13px]">
              Once you confirm it, your order and delivery date show up here.
            </Text>
          </View>
        ) : (
          <View className="flex-row items-start gap-3 rounded-[20px] bg-lime-soft p-3.5">
            <Clock size={18} color="#3A5512" />
            <View className="flex-1">
              <Text weight="semibold" className="text-[13px]">
                {reply.overdue
                  ? "Our team will call you very soon"
                  : `Expect a call by ${formatTime(e.respondBy)}`}
              </Text>
              <Text tone="soft" className="mt-0.5 text-[13px]">
                {reply.overdue
                  ? `It's taking a little longer than ${REPLY_WITHIN_HOURS} hours. Sorry for the wait.`
                  : `In about ${reply.label}.`}
              </Text>
              <CallbackNumber enquiry={e} />
            </View>
          </View>
        )}
        <View className="mt-4">
          <Progress steps={QUOTE_STEPS} current={contacted ? 1 : 0} />
        </View>
        <View className="mt-2">
          <ItemList items={e.products} />
        </View>
      </View>
      <View className="flex-row flex-wrap gap-x-5 gap-y-1 border-t border-line px-4 py-3">
        <View className="flex-row items-center gap-1.5">
          <CalendarDays size={13} color="#73776E" />
          <Text tone="muted" className="text-[12px]">
            Needed by <Text weight="semibold">{formatDay(e.deliveryDate)}</Text>
          </Text>
        </View>
        {estimate ? (
          <Text tone="muted" className="text-[12px]">
            Estimated <Text weight="semibold">{formatINR(estimate)}</Text>
          </Text>
        ) : null}
      </View>
      <SeeEverything id={e.id} />
    </Animated.View>
  );
});

// Past orders and cancelled enquiries: the whole row opens the details
const PastCard = memo(function PastCard({ enquiry: e }: { enquiry: Enquiry }) {
  const status = customerStatus(e);
  const delivered = e.order?.stage === "Delivered";
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => openOrder(e.id)}
      className="flex-row items-center gap-3 rounded-[22px] bg-card px-4 py-3.5"
    >
      <View className="flex-1">
        <Text weight="bold" tone="muted" className="text-[11px] tracking-wider">
          {e.id}
        </Text>
        <Text weight="semibold" numberOfLines={1} className="mt-0.5 text-[14px]">
          {e.products.map((p) => p.name).join(", ")}
        </Text>
        <Text tone="muted" className="mt-0.5 text-[12px]">
          {delivered
            ? `Delivered ${formatDay(e.order!.stageTimes?.Delivered ?? e.order!.expectedDelivery)}`
            : (e.closedReason ?? "Closed")}
        </Text>
      </View>
      <Badge tone={status.tone} label={status.label} />
      <ChevronRight size={18} color="#73776E" />
    </PressableScale>
  );
});
