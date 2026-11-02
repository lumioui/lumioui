import * as React from "react";
import { TextInput, View } from "react-native";
import { Accent, useTheme } from "@lumioui/core";
import { Autocomplete, type AutocompleteOption } from "../autocomplete";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

interface Address {
  line: string;
  city: string;
  postcode: string;
}

const ADDRESSES: (AutocompleteOption & { address: Address })[] = [
  { id: "1", title: "12 Chandler Street", subtitle: "Harbourside HS1 3HW", icon: "map-pin", address: { line: "12 Chandler Street", city: "Harbourside", postcode: "HS1 3HW" } },
  { id: "2", title: "12 Chandos Road", subtitle: "Ashby, Harbourside HS27 4AF", icon: "map-pin", address: { line: "12 Chandos Road", city: "Ashby", postcode: "HS27 4AF" } },
  { id: "3", title: "12 Chandler Place", subtitle: "Westbrook HS21 9AQ", icon: "map-pin", address: { line: "12 Chandler Place", city: "Harbourside", postcode: "HS21 9AQ" } },
  { id: "4", title: "12 Chapel Street", subtitle: "Mill Quarter HS4 1PW", icon: "map-pin", address: { line: "12 Chapel Street", city: "Harbourside", postcode: "HS4 1PW" } },
  { id: "5", title: "120 Oldfield Street", subtitle: "Canal Side HS4 1LJ", icon: "map-pin", address: { line: "120 Oldfield Street", city: "Harbourside", postcode: "HS4 1LJ" } },
];

function Field({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  const { colors } = useTheme();
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium">{label}</Text>
      <TextInput
        value={value}
        editable={false}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        className="h-12 rounded-xl border-[1.5px] border-input bg-background px-3.5 text-base text-foreground"
        accessibilityLabel={label}
      />
    </View>
  );
}

/** AutocompleteAddress — the delivery address step in a food app. The
 *  dropdown floats under the street field while it's focused; picking a
 *  suggestion fills city and postcode below and unlocks Save. Orange. */
export function AutocompleteAddress() {
  const [picked, setPicked] = React.useState<Address | null>(null);
  const [query, setQuery] = React.useState("12 cha");
  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-6">
        <View className="gap-1 px-1">
          <Text className="text-2xl font-bold tracking-tight">Delivery address</Text>
          <Text variant="muted">Drivers use this to find you</Text>
        </View>

        <View className="gap-4">
          <Autocomplete
            presentation="dropdown"
            label="Street address"
            value={query}
            onValueChange={(q) => {
              setQuery(q);
              setPicked(null);
            }}
            options={ADDRESSES}
            onSelect={(o) => {
              const hit = ADDRESSES.find((a) => a.id === o.id);
              if (hit) setPicked(hit.address);
            }}
            placeholder="Start typing your address"
            emptyText="No address found. Check the house number."
            inputProps={{ icon: <Icon name="map-pin" size="sm" color="mutedForeground" /> }}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="City" value={picked?.city ?? ""} placeholder="Filled from your address" />
            </View>
            <View className="w-32">
              {/* Short placeholder — the 128pt column can't hold the city's sentence. */}
              <Field label="Postcode" value={picked?.postcode ?? ""} placeholder="Auto-filled" />
            </View>
          </View>
        </View>

        <Button size="lg" className="w-full" disabled={!picked}>
          Save address
        </Button>
      </View>
    </Accent>
  );
}
