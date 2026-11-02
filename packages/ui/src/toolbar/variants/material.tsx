import * as React from "react";
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Toolbar } from "../toolbar";
import { Text } from "../../text/text";

interface Note {
  title: string;
  body: string;
  when: string;
}

const SEED: Note[] = [
  { title: "Garden plan", body: "Move the tomatoes to the south bed. Order 2 bags of compost and netting for the peas.", when: "Today" },
  { title: "Book club · November", body: "The Understory, chapters 1–6. Bring questions about the roots section.", when: "Today" },
  { title: "Bike service", body: "Rear derailleur skipping in 4th. Ask about tubeless conversion and price.", when: "Yesterday" },
  { title: "Gift ideas", body: "Mum: pottery class voucher. Leo: the blue headlamp he mentioned. Sam: tea sampler.", when: "Oct 4" },
  { title: "Apartment move", body: "Utilities transfer on the 28th. Book the van for 9 AM, confirm parking permit.", when: "Oct 2" },
  { title: "Recipe tweaks", body: "Dal: one more garlic clove, temper the cumin longer. Freeze in 2-portion tubs.", when: "Sep 30" },
  { title: "Running log", body: "Long run 14 km at 5:40. Left calf tight after km 10, stretch before next session.", when: "Sep 27" },
];

/** ToolbarMaterial — a notes app's bottom app bar with a docked FAB. Scroll down
 *  and the bar slides away, scroll up and it springs back; the docked FAB
 *  adds a note, and the mic toggles a recording state. Neutral ink for a
 *  productivity tool. */
export function ToolbarMaterial() {
  const [notes, setNotes] = React.useState(SEED);
  const [hidden, setHidden] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const lastY = React.useRef(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;
    // Only flip on a deliberate move, and only when the value changes.
    if (dy > 6 && y > 40 && !hidden) setHidden(true);
    else if (dy < -6 && hidden) setHidden(false);
  };

  return (
    <View className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-background" style={{ height: 600 }}>
        <View className="px-5 pb-3 pt-6">
          <Text className="text-2xl font-bold tracking-tight">Notes</Text>
        </View>
        <ScrollView onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 112, gap: 8 }}>
          {recording ? (
            <View className="flex-row items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3" accessibilityLiveRegion="polite">
              <View className="h-2 w-2 rounded-full bg-destructive" />
              <Text className="flex-1 text-[15px] font-medium">Recording voice note · 0:07</Text>
            </View>
          ) : null}
          {notes.map((n, i) => (
            <View key={`${n.title}-${i}`} className="gap-1 rounded-2xl bg-card px-4 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold">{n.title}</Text>
                <Text className="text-xs text-muted-foreground">{n.when}</Text>
              </View>
              <Text numberOfLines={2} className="text-[15px] text-muted-foreground">
                {n.body}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0">
          <Toolbar variant="docked" hidden={hidden}>
            <Toolbar.Item icon="check-circle" label="New checklist" />
            <Toolbar.Item icon="edit" label="New drawing" />
            <Toolbar.Item icon="mic" label={recording ? "Stop recording" : "New voice note"} active={recording} onPress={() => setRecording((r) => !r)} />
            <Toolbar.Item icon="image" label="New image note" />
            <Toolbar.Fab
              icon="plus"
              label="New note"
              onPress={() => setNotes((ns) => [{ title: "Untitled", body: "Tap to start writing.", when: "Now" }, ...ns])}
            />
          </Toolbar>
        </View>
      </View>
    </View>
  );
}
