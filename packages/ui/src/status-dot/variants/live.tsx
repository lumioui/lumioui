import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { StatusDot } from "../status-dot";
import { Avatar } from "../../avatar/avatar";
import { Button } from "../../button/button";
import { Image } from "../../image/image";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const STREAMS = [
  {
    title: "Vinyl Sunday: deep house from Detroit",
    host: "Nadia Rahm",
    viewers: "2.4K",
    img: "https://images.unsplash.com/photo-1541296481353-b1eb3a4e0309?w=600&h=400&fit=crop&q=70&auto=format",
    avatar: 25,
  },
  {
    title: "Morning breathwork, 20 minutes",
    host: "Calder Studio",
    viewers: "812",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop&q=70&auto=format",
    avatar: 44,
  },
];

/** StatusDotLive — a creator app's live tab. Thumbnails wear the red Live
 *  pill whose dot breathes slowly (a real on-air state, so the loop is
 *  earned). Your own channel starts offline; Go live and the grey pill
 *  becomes the red one in place — it widens to "Live · 0:00", the fill
 *  switches on and one sheen crosses it. */
export function StatusDotLive() {
  const [onAir, setOnAir] = React.useState(false);
  const [secs, setSecs] = React.useState(0);
  React.useEffect(() => {
    if (!onAir) return;
    setSecs(0);
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [onAir]);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <Accent color="pink" className="w-full">
      <View className="w-full gap-6">
        <View className="flex-row items-center gap-3 rounded-2xl bg-card p-4">
          <View className="h-14 w-14">
            <Avatar size="lg" source={{ uri: "https://i.pravatar.cc/150?img=5" }} alt="Your channel" />
            <StatusDot
              status={onAir ? "live" : "offline"}
              size="lg"
              ring
              className="absolute -bottom-0.5 -right-0.5"
            />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-[17px] font-semibold">Studio Halvorsen</Text>
            <StatusDot
              status={onAir ? "live" : "offline"}
              variant="pill"
              label={onAir ? `Live · ${clock}` : "Offline"}
              textClassName="tabular-nums"
            />
          </View>
          <Button size="sm" variant={onAir ? "secondary" : "default"} onPress={() => setOnAir((v) => !v)}>
            {onAir ? "End" : "Go live"}
          </Button>
        </View>

        <View className="gap-3">
          <Text className="px-1 text-[17px] font-semibold">Live now</Text>
          {STREAMS.map((s) => (
            <View key={s.title} className="gap-3">
              <View className="overflow-hidden rounded-2xl">
                <Image source={{ uri: s.img }} aspectRatio={16 / 9} rounded="2xl" alt="" />
                <View className="absolute left-3 top-3 flex-row items-center gap-2">
                  <StatusDot status="live" variant="pill" />
                  <View className="h-6 flex-row items-center gap-1 rounded-full bg-black/55 px-2">
                    <Icon name="eye" size="sm" color="#FFFFFF" />
                    <Text className="text-xs font-semibold text-white tabular-nums">{s.viewers}</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row items-center gap-3 px-1">
                <Avatar size="sm" source={{ uri: `https://i.pravatar.cc/150?img=${s.avatar}` }} alt="" />
                <View className="flex-1">
                  <Text className="text-[15px] font-medium" numberOfLines={1}>{s.title}</Text>
                  <Text variant="muted">{s.host}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Accent>
  );
}
