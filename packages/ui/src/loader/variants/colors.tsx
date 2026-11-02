import * as React from "react";
import { Pressable, View } from "react-native";
import { Loader } from "../loader";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

interface Upload {
  id: string;
  name: string;
  icon: IconName;
  tile: string;
  state: "uploading" | "queued" | "failed";
}

const START: Upload[] = [
  { id: "a", name: "Brand guidelines v3.pdf", icon: "file-text", tile: "bg-tint-red", state: "uploading" },
  { id: "b", name: "Harbour St site photos", icon: "image", tile: "bg-tint-teal", state: "queued" },
  { id: "c", name: "Founder interview raw.mov", icon: "film", tile: "bg-tint-pink", state: "failed" },
];

const META: Record<Upload["state"], string> = {
  uploading: "18.4 of 26 MB",
  queued: "Waiting for Wi-Fi",
  failed: "Connection lost. Tap to retry",
};

/** LoaderColors — a cloud-drive upload queue. Each colour token marks one
 *  upload state: ink while sending, muted while queued, destructive on a
 *  failure. Tap the failed row to retry it; "Pause" stops every loop. */
export function LoaderColors() {
  const [items, setItems] = React.useState(START);
  const [paused, setPaused] = React.useState(false);

  const retry = (id: string) =>
    setItems((list) => list.map((u) => (u.id === id && u.state === "failed" ? { ...u, state: "uploading" } : u)));

  return (
    <View className="w-full">
      <View className="w-full gap-2">
        <View className="flex-row items-end justify-between px-1">
          <View>
            <Text className="text-[17px] font-semibold">Uploads</Text>
            <Text variant="muted">3 files · 212 MB to Studio Drive</Text>
          </View>
          <Pressable
            onPress={() => setPaused((p) => !p)}
            accessibilityRole="button"
            accessibilityLabel={paused ? "Resume uploads" : "Pause uploads"}
            hitSlop={10}
            className="h-11 justify-center"
          >
            <Text className="text-[15px] font-semibold text-primary-text">{paused ? "Resume" : "Pause"}</Text>
          </Pressable>
        </View>

        <View className="overflow-hidden rounded-2xl bg-card">
          {items.map((u, i) => {
            const color = u.state === "uploading" ? "primary" : u.state === "queued" ? "mutedForeground" : "destructive";
            return (
              <Pressable
                key={u.id}
                onPress={() => retry(u.id)}
                disabled={u.state !== "failed"}
                accessibilityRole="button"
                accessibilityLabel={`${u.name}, ${META[u.state]}`}
                className="flex-row items-center gap-3 pl-4"
              >
                <View className={`h-10 w-10 items-center justify-center rounded-xl ${u.tile}`}>
                  <Icon name={u.icon} size="sm" color="#FFFFFF" />
                </View>
                <View className={`flex-1 flex-row items-center gap-3 py-3 pr-4 ${i > 0 ? "border-t border-border" : ""}`}>
                  <View className="flex-1">
                    <Text className="text-[15px] font-medium" numberOfLines={1}>{u.name}</Text>
                    <Text variant="muted" className={u.state === "failed" ? "text-destructive" : undefined}>
                      {paused && u.state === "uploading" ? "Paused" : META[u.state]}
                    </Text>
                  </View>
                  {u.state === "failed" ? (
                    <Icon name="refresh" size="sm" color="destructive" />
                  ) : (
                    <Loader
                      size={22}
                      color={color}
                      active={!paused}
                      variant={u.state === "queued" ? "ring" : "spinner"}
                      speed={u.state === "queued" ? 2 : 1}
                      label={`${u.name} ${u.state}`}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
