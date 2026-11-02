import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Autocomplete, type AutocompleteOption } from "../autocomplete";
import { Avatar } from "../../avatar/avatar";
import { Button } from "../../button/button";
import { Text } from "../../text/text";

const person = (id: string, name: string, handle: string, img: number, keywords?: string): AutocompleteOption => ({
  id,
  title: name,
  subtitle: handle,
  keywords,
  leading: <Avatar size="md" source={{ uri: `https://i.pravatar.cc/150?img=${img}` }} fallback={name.slice(0, 1)} />,
});

const PEOPLE: AutocompleteOption[] = [
  person("mk", "Mateo Kovač", "@mateok · Climbing club", 12, "mateo"),
  person("ml", "Maya Lindqvist", "@mayal · 07700 900461", 32),
  person("mr", "Marcus Reid", "@marcusreid", 15),
  person("ms", "Mira Santos", "@mira.s · Flatmate", 45, "rent"),
  person("jt", "Jonah Tran", "@jonaht", 53),
  person("ea", "Elif Arslan", "@elif", 24),
  person("ao", "Ada Obi", "@adaobi", 9),
];

const RECENT = [PEOPLE[3], PEOPLE[4], PEOPLE[0]].filter((p): p is AutocompleteOption => !!p);

/** AutocompleteRecipients — "Send to" in a money app. Recent payees with
 *  avatars while empty; typing matches names and handles. Picking someone
 *  fills the field and arms the send button. Green. */
export function AutocompleteRecipients() {
  const [to, setTo] = React.useState<AutocompleteOption | null>(null);
  const [query, setQuery] = React.useState("");
  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-5">
        <View className="items-center gap-1">
          <Text variant="muted">Sending</Text>
          <Text className="text-5xl font-semibold tracking-tight tabular-nums">£64.50</Text>
          <Text variant="muted">Groceries and energy, October</Text>
        </View>

        <Autocomplete
          value={query}
          onValueChange={(q) => {
            setQuery(q);
            setTo(null);
          }}
          options={PEOPLE}
          recent={RECENT}
          recentTitle="Recent payees"
          onSelect={setTo}
          placeholder="Name, @handle or phone"
          emptyText={(q) => `Nobody called "${q}" yet. Invite them by phone number.`}
        />

        <Button size="lg" className="w-full" disabled={!to}>
          {to ? `Send £64.50 to ${to.title.split(" ")[0]}` : "Choose who to pay"}
        </Button>
      </View>
    </Accent>
  );
}
