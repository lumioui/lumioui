import * as React from "react";
import { View } from "react-native";
import { SwitchOn } from "@lumioui/core";
import { Autocomplete, type AutocompleteOption } from "../autocomplete";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const mins = (m: number) => <Text className="text-sm tabular-nums text-muted-foreground">{`${m} min`}</Text>;

const STATIONS: AutocompleteOption[] = [
  { id: "alx", title: "Alder Cross", subtitle: "Coast line · platforms 1–4", icon: "tram-front", trailing: mins(14), keywords: "aldx" },
  { id: "alj", title: "Alderbrook Junction", subtitle: "Change for the Valley line", icon: "tram-front", trailing: mins(26) },
  { id: "ash", title: "Ashby Parkway", subtitle: "Park and ride · 1,200 spaces", icon: "car", trailing: mins(33) },
  { id: "pal", title: "Palmer Street", subtitle: "City loop", icon: "tram-front", trailing: mins(6), keywords: "loop" },
  { id: "kbay", title: "Kestrel Bay", subtitle: "Ferry connection", icon: "map-pin", trailing: mins(41), keywords: "ferry harbour" },
  { id: "kmr", title: "Kingsmere", subtitle: "Coast line", icon: "tram-front", trailing: mins(52) },
  { id: "lq", title: "Lumen Quay", subtitle: "Waterfront · step-free", icon: "tram-front", trailing: mins(9), keywords: "waterfront" },
  { id: "air", title: "Northgate Airport", subtitle: "Terminal shuttle every 10 min", icon: "plane", trailing: mins(38), keywords: "airport flights" },
  { id: "mill", title: "Old Mill Halt", subtitle: "Request stop", icon: "map-pin", trailing: mins(47) },
];

const RECENT: AutocompleteOption[] = [
  { id: "home", title: "Lumen Quay", subtitle: "Home station", icon: "home" },
  { id: "work", title: "Palmer Street", subtitle: "Work · weekday mornings", icon: "briefcase" },
  { id: "kbay-r", title: "Kestrel Bay", subtitle: "Last Saturday" },
];

/** AutocompletePlaces — the To field of a rail ticket. Typed letters light
 *  up in each station name while the rest sits dim (it opens on "al").
 *  Picking a station lifts it into the field, then the ticket line below
 *  switches on with the next departure. Ink. */
export function AutocompletePlaces() {
  const [query, setQuery] = React.useState("al");
  const [dest, setDest] = React.useState<AutocompleteOption | null>(null);
  return (
    <View className="w-full gap-4">
      <View className="gap-3">
        <Text className="px-1 text-2xl font-bold tracking-tight">Where to?</Text>
        <View className="flex-row items-center gap-3 px-1">
          <View className="h-2.5 w-2.5 rounded-full bg-foreground" />
          <Text className="flex-1 text-[15px] text-muted-foreground">From: Harbourside Central</Text>
        </View>
      </View>

      <Autocomplete
        value={query}
        onValueChange={(q) => {
          setQuery(q);
          setDest(null);
        }}
        options={STATIONS}
        recent={RECENT}
        onSelect={setDest}
        placeholder="Search stations"
        emptyText={(q) => `No station matches "${q}". Try a town or a stop name.`}
      />

      {dest ? (
        <SwitchOn className="flex-row items-center gap-3 rounded-2xl bg-card p-4">
          <Icon name="tram-front" size="md" color="foreground" />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold">{`Harbourside Central → ${dest.title}`}</Text>
            <Text variant="muted">Next train 08:42 · platform 3 · off-peak single</Text>
          </View>
        </SwitchOn>
      ) : null}
    </View>
  );
}
