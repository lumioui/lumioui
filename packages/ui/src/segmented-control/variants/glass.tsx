import * as React from "react";
import { View } from "react-native";
import { SegmentedControl } from "../segmented-control";
import { Image } from "../../image/image";
import { Text } from "../../text/text";

const U = (id: string, s = 400) => `https://images.unsplash.com/${id}?w=${s}&h=${s}&fit=crop&q=70&auto=format`;
const LIB = [
  "photo-1506905925346-21bda4d32df4",
  "photo-1519681393784-d120267933ba",
  "photo-1470071459604-3b5ec3a7fe05",
  "photo-1500530855697-b586d89ba3ee",
  "photo-1483412033650-1015ddeb83d1",
  "photo-1500382017468-9049fed747ef",
  "photo-1488646953014-85cb44e25828",
  "photo-1446776811953-b23d57bd21aa",
  "photo-1513735492246-483525079686",
  "photo-1489749798305-4fea3ae63d43",
  "photo-1493976040374-85c8e12f0c0e",
  "photo-1506126613408-eca07ce68773",
];

const COLS: Record<string, number> = { Years: 1, Months: 2, All: 3 };

/** SegmentedGlass — a photo-library switcher: a glass capsule floating
 *  over the library it controls. Years / Months / All changes the grid
 *  density beneath, so the glass always sits over moving content. */
export function SegmentedGlass() {
  const [value, setValue] = React.useState("All");
  const cols = COLS[value] ?? 3;
  const shots = value === "Years" ? LIB.slice(0, 2) : value === "Months" ? LIB.slice(0, 6) : LIB;
  const w = cols === 1 ? "100%" : cols === 2 ? "49.6%" : "32.9%";
  return (
    <View className="relative h-[520px] w-full overflow-hidden rounded-3xl bg-background">
      <View className="flex-row flex-wrap gap-0.5">
        {shots.map((id, i) => (
          <View key={`${value}-${id}`} style={{ width: w }} className={cols === 1 ? "h-64" : "aspect-square"}>
            <Image source={{ uri: U(id, cols === 1 ? 800 : 400) }} className="h-full w-full" alt={`Photo ${i + 1}`} />
            {cols === 1 ? (
              <Text className="absolute left-4 top-3 text-3xl font-bold text-white">{i === 0 ? "2025" : "2024"}</Text>
            ) : null}
          </View>
        ))}
      </View>
      <View className="absolute bottom-5 left-5 right-5">
        <SegmentedControl glass options={["Years", "Months", "All"]} value={value} onValueChange={setValue} />
      </View>
    </View>
  );
}
