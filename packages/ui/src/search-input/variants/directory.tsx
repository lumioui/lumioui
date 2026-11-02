import * as React from "react";
import { View } from "react-native";
import { SwitchOn, rowDelay } from "@lumioui/core";
import { SearchInput, SearchMatch } from "../search-input";
import { Avatar } from "../../avatar/avatar";
import { Text } from "../../text/text";

interface Person {
  id: string;
  name: string;
  detail: string;
  img: number;
}

const PEOPLE: Person[] = [
  { id: "1", name: "Aiko Tanabe", detail: "Design · Tokyo", img: 5 },
  { id: "2", name: "Bram de Vries", detail: "Engineering · Amsterdam", img: 12 },
  { id: "3", name: "Camila Reyes", detail: "Sales · Bogotá", img: 32 },
  { id: "4", name: "Dev Malhotra", detail: "Engineering · Pune", img: 14 },
  { id: "5", name: "Elif Kaya", detail: "Support · Istanbul", img: 44 },
  { id: "6", name: "Felix Brandt", detail: "Finance · Hamburg", img: 59 },
  { id: "7", name: "Grace Okafor", detail: "Engineering · Lagos", img: 47 },
];

/** Debounce before the directory looks — busy dots hold the glyph meanwhile. */
const DEBOUNCE = 260;
/** The directory lookup itself. */
const LOOKUP = 380;

/** SearchDirectory — the people directory in a team workspace. Type and the
 *  search glyph swaps for busy dots while the lookup runs; when results
 *  land it swaps back, the rows switch on top to bottom 40ms apart, the
 *  count swaps in place and every row lights the part your query matched. */
export function SearchDirectory() {
  const [text, setText] = React.useState("eng");
  const [query, setQuery] = React.useState("eng");
  const [searching, setSearching] = React.useState(false);
  const [round, setRound] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const run = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      setSearching(false);
      setQuery("");
      setRound((n) => n + 1);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => {
      setSearching(false);
      setQuery(q);
      setRound((n) => n + 1);
    }, LOOKUP);
  };

  const q = query.trim().toLowerCase();
  const results = q ? PEOPLE.filter((p) => `${p.name} ${p.detail}`.toLowerCase().includes(q)) : PEOPLE;
  const count = q ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : "Everyone";

  return (
    <View className="w-full gap-4">
      <Text className="px-1 text-3xl font-bold tracking-tight">People</Text>
      <SearchInput
        placeholder="Name, team or city"
        value={text}
        onChangeText={(t) => {
          setText(t);
          run(t);
        }}
        debounceMs={DEBOUNCE}
        searching={searching}
        accessibilityLabel="Search people"
      />
      {results.length > 0 ? (
        <View className="gap-2">
          {/* The count swaps in place when results land. */}
          <SwitchOn key={`count-${round}`} className="px-4">
            <Text className="text-[13px] text-muted-foreground" accessibilityLiveRegion="polite">
              {count}
            </Text>
          </SwitchOn>
          <View className="overflow-hidden rounded-2xl bg-card">
            {results.map((p, i) => (
              <SwitchOn key={`${round}-${p.id}`} delay={rowDelay(i)}>
                {i > 0 ? <View className="ml-[68px] h-px bg-border" /> : null}
                <View className="min-h-14 flex-row items-center gap-3 px-4 py-2">
                  <Avatar size="md" source={{ uri: `https://i.pravatar.cc/150?img=${p.img}` }} fallback={p.name[0]} />
                  <View className="min-w-0 flex-1">
                    <SearchMatch text={p.name} query={query} className="text-base font-medium" numberOfLines={1} />
                    <SearchMatch text={p.detail} query={query} className="text-sm" numberOfLines={1} />
                  </View>
                </View>
              </SwitchOn>
            ))}
          </View>
        </View>
      ) : (
        <SwitchOn key={`empty-${round}`} className="items-center gap-1 rounded-2xl bg-card px-6 py-10">
          <Text className="text-[17px] font-semibold">No one called “{query.trim()}”</Text>
          <Text variant="muted" className="text-center">Try a first name, a team like Design, or a city.</Text>
        </SwitchOn>
      )}
    </View>
  );
}
