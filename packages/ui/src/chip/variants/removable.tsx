import * as React from "react";
import { Image, View } from "react-native";
import { Accent } from "@lumioui/core";
import { Chip } from "../chip";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const PEOPLE = [
  { name: "Hana Sato", img: 32 },
  { name: "Mateo Alvarez", img: 12 },
  { name: "Grace Liu", img: 45 },
  { name: "Ola Bergström", img: 59 },
];

/** ChipRemovable — invitee chips in a "Share document" sheet. Each person is
 *  an input chip with their avatar; × removes them and the CTA count
 *  follows. Orange for a productivity tool. */
export function ChipRemovable() {
  const [people, setPeople] = React.useState(PEOPLE);
  const remove = (name: string) => setPeople((p) => p.filter((x) => x.name !== name));
  const n = people.length;
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-tint-orange">
            <Icon name="file-text" size="sm" color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-semibold" numberOfLines={1}>Q4 hiring plan</Text>
            <Text variant="muted">Invited people can comment</Text>
          </View>
        </View>

        <View className="min-h-[52px] flex-row flex-wrap items-center gap-2 rounded-xl border border-border p-2">
          {people.map((p) => (
            <Chip
              key={p.name}
              variant="input"
              className="pl-1"
              onDelete={() => remove(p.name)}
              accessibilityLabel={p.name}
              icon={
                <Image
                  source={{ uri: `https://i.pravatar.cc/150?img=${p.img}` }}
                  className="h-7 w-7 rounded-full bg-muted"
                  accessibilityIgnoresInvertColors
                />
              }
            >
              {p.name}
            </Chip>
          ))}
          <Text variant="muted" className="px-2">
            {n === 0 ? "Add people or groups" : "Add more"}
          </Text>
        </View>

        <Button size="lg" className="w-full" disabled={n === 0}>
          {n === 0 ? "Invite" : `Invite ${n} ${n === 1 ? "person" : "people"}`}
        </Button>
      </View>
    </Accent>
  );
}
