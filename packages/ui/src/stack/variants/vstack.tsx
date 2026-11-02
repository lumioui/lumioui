import * as React from "react";
import { Image } from "react-native";
import { Accent } from "@lumioui/core";
import { HStack, VStack } from "../stack";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

/** StackVStack — a centred VStack as a creator profile header: avatar,
 *  name, bio, stats, then actions in an HStack. Follow is live and the
 *  follower count answers. Coral for social. */
export function StackVStack() {
  const [following, setFollowing] = React.useState(false);
  const followers = 18240 + (following ? 1 : 0);
  return (
    <Accent color="coral" className="w-full">
      <VStack align="center" gap={16} className="w-full rounded-3xl bg-card px-5 py-6">
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=47" }}
          className="h-24 w-24 rounded-full bg-muted"
          accessibilityIgnoresInvertColors
        />
        <VStack align="center" gap={4}>
          <Text className="text-2xl font-bold tracking-tight">Noor Haddad</Text>
          <Text variant="muted">@noorbakes · Amman</Text>
        </VStack>
        <Text className="text-center text-[15px] leading-snug">
          Sourdough, cardamom buns and slow Sunday bakes. New recipe every Friday.
        </Text>
        <HStack justify="center" gap={32}>
          {[
            [followers.toLocaleString("en-US"), "Followers"],
            ["312", "Following"],
            ["96", "Recipes"],
          ].map(([v, l]) => (
            <VStack key={l} align="center">
              <Text className="text-lg font-semibold tabular-nums">{v}</Text>
              <Text className="text-xs text-muted-foreground">{l}</Text>
            </VStack>
          ))}
        </HStack>
        <HStack gap={8} className="w-full">
          <Button
            className="flex-1"
            variant={following ? "secondary" : "default"}
            onPress={() => setFollowing((f) => !f)}
          >
            {following ? "Following" : "Follow"}
          </Button>
          <Button className="flex-1" variant="secondary">
            Message
          </Button>
          <Button
            size="icon"
            variant="secondary"
            accessibilityLabel="More options"
            icon={<Icon name="more-horizontal" size="sm" color="foreground" />}
          />
        </HStack>
      </VStack>
    </Accent>
  );
}
