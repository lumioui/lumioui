import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { CopyField } from "../copy-field";
import { AvatarGroup } from "../../avatar-group/avatar-group";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const JOINED = [12, 25, 49].map((n) => ({ id: n, source: { uri: `https://i.pravatar.cc/150?img=${n}` }, alt: "" }));

/** CopyFieldInvite — a running club's bring-a-friend screen. The personal
 *  link truncates in the middle so both the domain and the code stay
 *  visible; copy it or hand it to the share sheet. */
export function CopyFieldInvite() {
  return (
    <Accent color="red" className="w-full">
      <View className="w-full gap-6 rounded-3xl bg-card p-5">
        <View className="gap-2">
          <Text className="text-2xl font-bold tracking-tight">Run with a friend</Text>
          <Text className="text-[15px] text-muted-foreground">
            When they log their first 5 km, you both get a month of Stride Plus.
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <AvatarGroup items={JOINED} size="md" />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold">3 of 5 friends joined</Text>
            <Text className="text-sm text-muted-foreground">2 free months left to earn</Text>
          </View>
        </View>

        <CopyField label="Your invite link" value="https://pacer.example/join/maya-ren-7Q2KX9" />

        <Button size="lg" icon={<Icon name="share" size="sm" color="primaryForeground" />}>
          Share invite
        </Button>
      </View>
    </Accent>
  );
}
