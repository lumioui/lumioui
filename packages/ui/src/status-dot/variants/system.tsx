import * as React from "react";
import { View } from "react-native";
import { StatusDot, type PresenceStatus } from "../status-dot";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

type Health = "operational" | "degraded" | "outage" | "maintenance";

/** Service health mapped onto presence shapes: filled green, hollow amber,
 *  filled red, hollow grey — readable without colour. */
const DOT: Record<Health, PresenceStatus> = {
  operational: "online",
  degraded: "away",
  outage: "busy",
  maintenance: "offline",
};
const LABEL: Record<Health, string> = {
  operational: "Operational",
  degraded: "Degraded",
  outage: "Outage",
  maintenance: "Maintenance",
};

const BEFORE: { name: string; health: Health; note?: string }[] = [
  { name: "Payments API", health: "operational" },
  { name: "Webhooks", health: "degraded", note: "Deliveries delayed ~4 min" },
  { name: "Payouts", health: "outage", note: "SEPA transfers failing" },
  { name: "Dashboard", health: "operational" },
  { name: "Search index", health: "maintenance", note: "Reindex until 02:00 UTC" },
];
const AFTER: typeof BEFORE = BEFORE.map((s) =>
  s.name === "Webhooks" || s.name === "Payouts" ? { name: s.name, health: "operational" } : s
);

/** StatusDotSystem — an infrastructure status page. Incidents use the same
 *  shape vocabulary as presence; tap Refresh and resolved services swap back
 *  in place to a filled green dot while the header recounts. */
export function StatusDotSystem() {
  const [resolved, setResolved] = React.useState(false);
  const services = resolved ? AFTER : BEFORE;
  const issues = services.filter((s) => s.health === "degraded" || s.health === "outage").length;
  const refresh = async () => {
    await new Promise((r) => setTimeout(r, 900));
    setResolved((v) => !v);
  };
  return (
    <View className="w-full gap-6">
      <View className="gap-2 px-1">
        <View className="flex-row items-center gap-2">
          <StatusDot status={issues ? "away" : "online"} size="lg" />
          <Text className="text-2xl font-bold tracking-tight">
            {issues ? `${issues} services affected` : "All systems normal"}
          </Text>
        </View>
        <Text variant="muted">Ledgerline status · updated {resolved ? "just now" : "6 min ago"}</Text>
      </View>

      <View className="overflow-hidden rounded-2xl bg-card">
        {services.map((s, i) => (
          <View
            key={s.name}
            className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
            accessible
            accessibilityLabel={`${s.name}, ${LABEL[s.health]}${s.note ? `, ${s.note}` : ""}`}
          >
            <View className="flex-1">
              <Text className="text-base font-medium">{s.name}</Text>
              {s.note ? <Text variant="muted" numberOfLines={1}>{s.note}</Text> : null}
            </View>
            <StatusDot status={DOT[s.health]} variant="pill" label={LABEL[s.health]} />
          </View>
        ))}
      </View>

      <Button size="lg" variant="secondary" className="w-full" onPress={refresh}>
        Refresh
      </Button>
    </View>
  );
}
