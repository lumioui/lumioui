import * as React from "react";
import { Pressable, View } from "react-native";
import { Loader, type LoaderVariant } from "../loader";
import { Text } from "../../text/text";

const STEPS: { variant: LoaderVariant; title: string; meta: string; done: string }[] = [
  { variant: "spinner", title: "Restoring messages", meta: "From your Lumio backup, 2 Oct", done: "38,204 messages" },
  { variant: "bars", title: "Downloading apps", meta: "14 of 52", done: "52 apps" },
  { variant: "ring", title: "Syncing photos", meta: "1,204 left", done: "9,871 photos" },
  { variant: "dots", title: "Waiting for your watch", meta: "Keep it close to your phone", done: "Paired" },
  { variant: "pulse", title: "Locating your keys", meta: "Last seen at home", done: "Found nearby" },
  { variant: "lumen", title: "Merging contacts", meta: "Finding duplicates", done: "12 merged" },
];

/** LoaderVariants — six loaders in one device-setup checklist, each matched
 *  to the kind of wait it signals. Tap a row to finish that step: its own
 *  loader resolves in place (the ring closes, ignites and keeps its check). */
export function LoaderVariants() {
  const [done, setDone] = React.useState<Record<string, boolean>>({});
  const remaining = STEPS.filter((s) => !done[s.title]).length;

  return (
    <View className="w-full gap-2">
      <View className="gap-1 px-1 pb-2">
        <Text className="text-2xl font-bold tracking-tight">Setting up your phone</Text>
        <Text variant="muted">{remaining === 0 ? "All done. You're ready to go." : `${remaining} steps still running`}</Text>
      </View>
      <View className="overflow-hidden rounded-2xl bg-card">
        {STEPS.map((s, i) => {
          const finished = !!done[s.title];
          return (
            <Pressable
              key={s.title}
              onPress={() => setDone((d) => ({ ...d, [s.title]: !d[s.title] }))}
              accessibilityRole="button"
              accessibilityLabel={`${s.title}, ${finished ? "done" : "in progress"}`}
              className="flex-row items-center gap-3 pl-4"
            >
              <View className="h-10 w-10 items-center justify-center">
                <Loader
                  variant={s.variant}
                  size={24}
                  label={s.title}
                  doneLabel={`${s.title} done`}
                  done={finished}
                />
              </View>
              <View className={`flex-1 py-3 pr-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <Text className="text-[15px] font-medium">{s.title}</Text>
                <Text variant="muted">{finished ? s.done : s.meta}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
