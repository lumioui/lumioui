import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import { ProgressRing } from "../../progress-ring/progress-ring";
import { Switch } from "../../switch/switch";
import { Stepper } from "../../stepper/stepper";
import { Text } from "../../text/text";

const GOAL = 2400;

const ACTIVITY: { when: string; what: string; amount: number }[] = [
  { when: "Fri 17 Oct", what: "Friday transfer", amount: 50 },
  { when: "Thu 16 Oct", what: "Round-ups this week", amount: 8.4 },
  { when: "Mon 13 Oct", what: "Moved to Everyday", amount: -120 },
  { when: "Fri 10 Oct", what: "Friday transfer", amount: 50 },
  { when: "Sun 5 Oct", what: "Birthday gift from Leila", amount: 200 },
];

const money = (n: number, sign = false) =>
  `${sign ? (n < 0 ? "−" : "+") : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** TabsSpend — one savings pot, three views with different structure:
 *  Overview (goal ring and the next deposit), Activity (a dated list) and
 *  Rules (switches and a stepper). The pill glides and each panel switches
 *  on as it lands. Panels stay mounted, so a rule you change on Rules is
 *  still changed when you come back: the thing Tabs does that a segmented
 *  control can't. Green for money; everything else is ink. */
export function TabsSpend() {
  const [roundUps, setRoundUps] = React.useState(true);
  const [weekly, setWeekly] = React.useState(true);
  const [amount, setAmount] = React.useState(50);
  const saved = 1620;
  const weeksLeft = weekly && amount > 0 ? Math.ceil((GOAL - saved) / amount) : null;

  return (
    <Accent color="green" className="w-full">
      <View className="w-full gap-4">
        <View className="gap-1 px-1">
          <Text className="text-[22px] font-semibold tracking-tight">New bike</Text>
          <Text variant="muted" className="text-[15px]">A gravel bike for the spring, {money(GOAL)} goal</Text>
        </View>

        <Tabs defaultValue="overview" className="w-full gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <View className="w-full items-center gap-5 rounded-[20px] bg-card px-5 py-6">
              <ProgressRing value={(saved / GOAL) * 100} size={168} strokeWidth={14} color="primary">
                <View className="items-center">
                  <Text className="text-4xl font-semibold tracking-tight tabular-nums">{money(saved)}</Text>
                  <Text variant="muted" className="text-sm tabular-nums">of {money(GOAL)}</Text>
                </View>
              </ProgressRing>
              <View className="w-full flex-row items-center justify-between border-t border-border pt-4">
                <View className="gap-1">
                  <Text className="text-base font-medium">Next deposit</Text>
                  <Text variant="muted" className="text-sm">
                    {weekly ? `Friday, ${money(amount)} from Everyday` : "Weekly transfer is off"}
                  </Text>
                </View>
                <Text variant="muted" className="text-sm tabular-nums">
                  {weeksLeft ? `${weeksLeft} weeks to go` : "Paused"}
                </Text>
              </View>
            </View>
          </TabsContent>

          <TabsContent value="activity">
            <View className="w-full overflow-hidden rounded-[20px] bg-card">
              {ACTIVITY.map((a, i) => (
                <View key={i} className="flex-row items-center justify-between px-4 py-3">
                  <View className="gap-1">
                    <Text className="text-base">{a.what}</Text>
                    <Text variant="muted" className="text-sm">{a.when}</Text>
                  </View>
                  <Text className={`text-base font-medium tabular-nums ${a.amount > 0 ? "text-primary-text" : ""}`}>
                    {money(a.amount, true)}
                  </Text>
                  {i < ACTIVITY.length - 1 ? <View className="absolute bottom-0 left-4 right-0 h-px bg-border" /> : null}
                </View>
              ))}
            </View>
          </TabsContent>

          <TabsContent value="rules">
            <View className="w-full overflow-hidden rounded-[20px] bg-card">
              <View className="min-h-[64px] flex-row items-center gap-3 px-4 py-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-medium">Round up purchases</Text>
                  <Text variant="muted" className="text-sm">Spare change from every card payment</Text>
                </View>
                <Switch checked={roundUps} onCheckedChange={setRoundUps} accessibilityLabel="Round up purchases" />
              </View>
              <View className="ml-4 h-px bg-border" />
              <View className="min-h-[64px] flex-row items-center gap-3 px-4 py-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-medium">Move every Friday</Text>
                  <Text variant="muted" className="text-sm">From Everyday, before 9 AM</Text>
                </View>
                <Switch checked={weekly} onCheckedChange={setWeekly} accessibilityLabel="Move money every Friday" />
              </View>
              <View className="ml-4 h-px bg-border" />
              <View className="min-h-[64px] flex-row items-center gap-3 px-4 py-3">
                <View className="flex-1 gap-1">
                  <Text className="text-base font-medium">Weekly amount</Text>
                  <Text variant="muted" className="text-sm tabular-nums">{money(amount)} each Friday</Text>
                </View>
                <Stepper value={amount} onValueChange={setAmount} min={10} max={200} step={10} disabled={!weekly} />
              </View>
            </View>
          </TabsContent>
        </Tabs>
      </View>
    </Accent>
  );
}
