import * as React from "react";
import { View } from "react-native";
import { Checkbox } from "../checkbox";
import { Text } from "../../text/text";

type Topic = "digest" | "mentions" | "product" | "events";

const TOPICS: { key: Topic; label: string; subtitle: string }[] = [
  { key: "digest", label: "Weekly digest", subtitle: "Mondays, 8:00 AM" },
  { key: "mentions", label: "Mentions and replies", subtitle: "When someone tags you" },
  { key: "product", label: "Product updates", subtitle: "About once a month" },
  { key: "events", label: "Meetups near Rotterdam", subtitle: "Only for cities you follow" },
];

/** CheckboxStates — the real home of the indeterminate state: an email
 *  preferences parent that summarises its children. Tap children and watch
 *  the parent go empty → dash → check; tap the parent to set all. The
 *  required security row stays checked and disabled. Ink, no accent. */
export function CheckboxStates() {
  const [on, setOn] = React.useState<Record<Topic, boolean>>({
    digest: true,
    mentions: true,
    product: false,
    events: false,
  });
  const count = TOPICS.filter((t) => on[t.key]).length;
  const all = count === TOPICS.length;
  const some = count > 0 && !all;
  const setAll = (v: boolean) =>
    setOn({ digest: v, mentions: v, product: v, events: v });

  return (
    <View className="w-full gap-2">
      <Text className="px-4 text-[13px] text-muted-foreground">Email from Lumio</Text>
      <View className="overflow-hidden rounded-2xl bg-card">
        <Checkbox
          className="px-4 py-2"
          checked={all}
          indeterminate={some}
          onCheckedChange={() => setAll(!all)}
          label="All emails"
          subtitle={`${count} of ${TOPICS.length} selected`}
        />
        {TOPICS.map((t, i) => (
          <View key={t.key}>
            <View className={`${i === 0 ? "ml-[52px]" : "ml-[76px]"} h-px bg-border`} />
            <Checkbox
              className="py-2 pl-10 pr-4"
              checked={on[t.key]}
              onCheckedChange={(v) => setOn((s) => ({ ...s, [t.key]: v }))}
              label={t.label}
              subtitle={t.subtitle}
            />
          </View>
        ))}
      </View>

      <View className="mt-4 overflow-hidden rounded-2xl bg-card">
        <Checkbox
          className="px-4 py-2"
          checked
          disabled
          onCheckedChange={() => {}}
          label="Security alerts"
          subtitle="Sign-ins and password changes"
        />
      </View>
      <Text variant="muted" className="px-4">
        Security alerts can't be turned off while two-step sign-in is on.
      </Text>
    </View>
  );
}
