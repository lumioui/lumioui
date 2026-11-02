import * as React from "react";
import { View } from "react-native";
import { Avatar } from "../avatar";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

const CONTACTS: { fallback?: string; name: string; meta: string }[] = [
  { fallback: "RO", name: "Rosa Okonkwo", meta: "(510) 555-0148" },
  { fallback: "TB", name: "Tobias Brandt", meta: "tobias@brandt.studio" },
  { fallback: "WL", name: "Wen Li", meta: "(415) 555-0193" },
  { name: "(628) 555-0117", meta: "No name saved" },
];

/** AvatarFallback — contacts imported without photos: initials hold the
 *  circle, and an unsaved number falls back to the person glyph. Invite
 *  someone and the row confirms. */
export function AvatarFallback() {
  const [invited, setInvited] = React.useState<Set<string>>(() => new Set());
  return (
    <View className="w-full gap-2">
      <Text className="px-4 text-[13px] text-muted-foreground">From your contacts</Text>
      <View className="w-full overflow-hidden rounded-2xl bg-card">
        {CONTACTS.map((c, i) => {
          const done = invited.has(c.name);
          return (
            <View key={c.name} className="flex-row items-center gap-3 pl-4">
              <Avatar size="md" fallback={c.fallback} alt={c.name} />
              <View
                className={`flex-1 flex-row items-center gap-3 py-3 pr-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <View className="flex-1">
                  <Text className="text-base font-medium" numberOfLines={1}>{c.name}</Text>
                  <Text variant="muted" numberOfLines={1}>{c.meta}</Text>
                </View>
                <Button
                  size="sm"
                  variant={done ? "ghost" : "secondary"}
                  disabled={done}
                  onPress={() => setInvited((s) => new Set(s).add(c.name))}
                  accessibilityLabel={done ? `${c.name} invited` : `Invite ${c.name}`}
                >
                  {done ? "Invited" : "Invite"}
                </Button>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
