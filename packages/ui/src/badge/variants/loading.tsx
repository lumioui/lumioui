import * as React from "react";
import { View } from "react-native";
import { Badge } from "../badge";
import { Button } from "../../button/button";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

type State = "synced" | "syncing" | "signin";

const ACCOUNTS: { id: string; name: string; meta: string; icon: IconName; tile: string; initial: State }[] = [
  { id: "home", name: "Home calendar", meta: "4 calendars", icon: "calendar", tile: "bg-tint-teal", initial: "synced" },
  { id: "work", name: "Hollowtree · Work", meta: "maren@hollowtree.studio", icon: "briefcase", tile: "bg-tint-orange", initial: "synced" },
  { id: "family", name: "Family", meta: "Shared by Iris", icon: "users", tile: "bg-tint-pink", initial: "signin" },
];

const LABEL: Record<State, string> = { synced: "Synced", syncing: "Syncing", signin: "Sign in" };

/** BadgeLoading — calendar accounts in a scheduling app. Refresh and each
 *  badge shows busy dots in its glyph slot while it syncs, then its fill
 *  crossfades to the result one by one and the check ignites in place. */
export function BadgeLoading() {
  const [states, setStates] = React.useState<Record<string, State>>(() =>
    Object.fromEntries(ACCOUNTS.map((a) => [a.id, a.initial]))
  );
  const [busy, setBusy] = React.useState(false);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const refresh = () => {
    setBusy(true);
    setStates(Object.fromEntries(ACCOUNTS.map((a) => [a.id, "syncing" as State])));
    ACCOUNTS.forEach((a, i) => {
      timers.current.push(
        setTimeout(() => {
          setStates((s) => ({ ...s, [a.id]: a.id === "family" ? "signin" : "synced" }));
          if (i === ACCOUNTS.length - 1) setBusy(false);
        }, 900 + i * 650)
      );
    });
  };

  return (
    <View className="w-full gap-2">
      <Text className="px-4 text-[13px] text-muted-foreground">Accounts</Text>
      <View className="w-full overflow-hidden rounded-2xl bg-card">
        {ACCOUNTS.map((a, i) => {
          const st = states[a.id] ?? a.initial;
          return (
            <View key={a.id} className="flex-row items-center gap-3 pl-4">
              <View className={`h-8 w-8 items-center justify-center rounded-lg ${a.tile}`}>
                <Icon name={a.icon} size="sm" color="#FFFFFF" />
              </View>
              <View
                className={`flex-1 flex-row items-center gap-3 py-3 pr-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <View className="flex-1">
                  <Text className="text-base font-medium">{a.name}</Text>
                  <Text variant="muted" numberOfLines={1}>{a.meta}</Text>
                </View>
                <Badge
                  variant={st === "signin" ? "warning" : st === "synced" ? "success" : "secondary"}
                  loading={st === "syncing"}
                  icon={st === "synced" ? "check" : st === "signin" ? null : undefined}
                  contentKey={st}
                >
                  {LABEL[st]}
                </Badge>
              </View>
            </View>
          );
        })}
      </View>
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Text variant="muted">Last refreshed 9:41 AM</Text>
        <Button size="sm" variant="secondary" onPress={refresh} disabled={busy}>
          {busy ? "Refreshing" : "Refresh"}
        </Button>
      </View>
    </View>
  );
}
