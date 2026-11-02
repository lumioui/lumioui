import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { CATALOG, DEMOS } from "../generated/demos";
import { title } from "../lib/title";

/** Every free component, grouped by category. Tap one to preview it and its variants. */
export default function Catalog() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-4 pb-16">
        <Text className="mt-6 text-3xl font-bold tracking-tight text-foreground">LumioUI</Text>
        <Text className="mt-1 text-base text-muted-foreground">
          {CATALOG.reduce((n, g) => n + g.names.length, 0)} components · {Object.keys(DEMOS).length} demos
        </Text>
        {CATALOG.map((group) => (
          <View key={group.category} className="mt-8">
            <Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.category}</Text>
            <View className="overflow-hidden rounded-2xl bg-card">
              {group.names.map((name, i) => (
                <Link key={name} href={{ pathname: "/[name]", params: { name } }} asChild>
                  <Pressable
                    accessibilityRole="link"
                    className={`min-h-[48px] justify-center px-4 py-3 active:bg-muted ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <Text className="text-base text-card-foreground">{title(name)}</Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
