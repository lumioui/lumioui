import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ToastProvider } from "@lumioui/ui/toast";
import { DEMOS } from "../generated/demos";
import { title } from "../lib/title";

/** One component: its main demo, then a chip for each variant. */
export default function Preview() {
  const { name, variant } = useLocalSearchParams<{ name: string; variant?: string }>();
  const router = useRouter();
  const variants = React.useMemo(
    () => Object.keys(DEMOS).filter((k) => k.startsWith(`${name}--`)).map((k) => k.slice(name.length + 2)),
    [name],
  );
  const key = variant ? `${name}--${variant}` : DEMOS[name] ? name : variants[0] ? `${name}--${variants[0]}` : name;
  const Demo = useDemo(key);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: title(name) }} />
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={12} onPress={() => router.back()}>
          <Text className="text-base text-primary-text">‹ All</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-foreground">{title(name)}</Text>
      </View>
      {variants.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 pb-3" className="grow-0">
          {variants.map((v) => {
            const active = key === `${name}--${v}`;
            return (
              <Pressable
                key={v}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => router.setParams({ variant: v })}
                className={`min-h-[36px] justify-center rounded-full px-3 ${active ? "bg-primary" : "bg-muted"}`}
              >
                <Text className={active ? "text-primary-foreground" : "text-foreground"}>{title(v)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <ToastProvider>
        <ScrollView className="flex-1" contentContainerClassName="grow justify-center p-4">
          {Demo ? <Demo /> : <Text className="text-center text-muted-foreground">Loading…</Text>}
        </ScrollView>
      </ToastProvider>
    </SafeAreaView>
  );
}

function useDemo(key: string) {
  const [Demo, setDemo] = React.useState<React.ComponentType | null>(null);
  React.useEffect(() => {
    let live = true;
    setDemo(null);
    DEMOS[key]?.().then((C) => live && setDemo(() => C));
    return () => {
      live = false;
    };
  }, [key]);
  return Demo;
}
