import * as React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Accent, useHaptic, useTheme } from "@lumioui/core";
import { Tape } from "./tape";
import { HANDWRITING, PAPER, paperShadow } from "../sticker/sticker";

/** Ruled lines on the note — pale ink, since the paper stays light in both schemes. */
const RULE = "rgba(43,41,38,0.12)";

const ITEMS = [
  { label: "Train to Porto, 9:40 from Santa Apolónia", done: true },
  { label: "Pick up film for the Polaroid", done: true },
  { label: "Book the Livraria Lello slot", done: false },
  { label: "Postcards for Gran + stamps", done: false },
  { label: "One more pastel de nata", done: false },
];

/** Playground preview — a packing note taped to the page with paper tape,
 *  a kraft day label and an orange washi strip. Tap a line to tick it off;
 *  press any strip of tape to lift it. Not installed with the component. */
export function TapeDemo() {
  const { scheme } = useTheme();
  const haptic = useHaptic();
  const [done, setDone] = React.useState(ITEMS.map((i) => i.done));
  const paper = PAPER.stock[scheme];
  const left = done.filter((d) => !d).length;

  return (
    <Accent color="orange" className="w-full">
      <View className="w-full items-center py-6">
        <View className="w-[92%] rounded-sm px-6 pb-6 pt-14" style={[{ backgroundColor: paper, transform: [{ rotate: "-1.5deg" }] }, paperShadow(false)]}>
          <View className="flex-row items-baseline justify-between">
            <Text style={{ fontFamily: HANDWRITING, fontSize: 26, color: PAPER.ink }}>pack for Porto</Text>
            <Text className="text-[13px] font-semibold" style={{ color: PAPER.ink, opacity: 0.6 }}>
              {left === 0 ? "all set" : `${left} left`}
            </Text>
          </View>

          <View className="mt-2">
            {ITEMS.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  haptic.selection();
                  setDone((d) => d.map((v, j) => (j === i ? !v : v)));
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: done[i] }}
                accessibilityLabel={item.label}
                className="h-11 flex-row items-center gap-3 border-b"
                style={{ borderColor: RULE }}
              >
                {/* A pen box with a pen tick — slightly off-square, like it was drawn. */}
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Path d="M3.5 4.2 L16.2 3.6 L16.6 16.4 L3.8 16.8 Z" stroke={PAPER.ink} strokeWidth={1.6} strokeLinejoin="round" fill="none" />
                  {done[i] ? (
                    <Path d="M5.5 10.5 L9 14 L18.5 1.5" stroke={PAPER.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  ) : null}
                </Svg>
                <Text
                  numberOfLines={1}
                  className="flex-1"
                  style={{
                    fontFamily: HANDWRITING,
                    fontSize: 16,
                    color: PAPER.ink,
                    opacity: done[i] ? 0.45 : 1,
                    textDecorationLine: done[i] ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Tape className="absolute left-[1%] top-[30px]" width={92} tilt={-34} accessibilityLabel="Tape, top left" />
        <Tape className="absolute right-[1%] top-[38px]" width={92} tilt={32} accessibilityLabel="Tape, top right" />
        <Tape tone="kraft" width={84} height={30} tilt={4} className="absolute left-[38%] top-3">
          Fri 17
        </Tape>
        <Tape
          tone="primary"
          pattern="stripes"
          width={132}
          height={26}
          tilt={-8}
          className="absolute bottom-3 right-[10%]"
          accessibilityLabel="Orange washi tape"
        />
      </View>
    </Accent>
  );
}
