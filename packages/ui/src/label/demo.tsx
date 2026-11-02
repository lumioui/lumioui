import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Label } from "./label";
import { Avatar } from "../avatar/avatar";
import { Input } from "../input/input";
import { Textarea } from "../textarea/textarea";
import { Text } from "../text/text";

const TAKEN = new Set(["jules", "julesb", "jules.b"]);

/** Playground preview. Not installed with the component.
 *
 *  Edit-profile screen of a social app in pink (coral would read as the error tone). Each Label names its
 *  field through htmlFor → accessibilityLabelledBy. Type a taken handle and
 *  the username label flickers once with its field while its ink shifts to
 *  the error tone; fix it and the ink shifts back without a flicker. */
export function LabelDemo() {
  const [handle, setHandle] = React.useState("jules");
  const [name, setName] = React.useState("Jules Bertrand");
  const [bio, setBio] = React.useState("Ceramics, slow mornings and trains through the Alps.");
  const clean = handle.trim().toLowerCase().replace(/^@/, "");
  const taken = TAKEN.has(clean);
  const tooShort = clean.length > 0 && clean.length < 3;
  const handleError = taken ? `@${clean} is already taken` : tooShort ? "At least 3 characters" : undefined;

  return (
    <Accent color="pink" className="w-full">
      <View className="w-full gap-6">
        <View className="items-center gap-3">
          <Avatar size="xl" source={{ uri: "https://i.pravatar.cc/150?img=47" }} fallback="JB" />
          <Text className="text-[15px] font-semibold text-primary-text">Change photo</Text>
        </View>

        <View className="gap-5 rounded-3xl bg-card p-5">
          <View className="gap-2">
            <Label htmlFor="profile-name">Display name</Label>
            <Input accessibilityLabelledBy="profile-name" value={name} onChangeText={setName} />
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Label htmlFor="profile-handle" error={!!handleError} flicker>
                Username
              </Label>
              {!handleError && clean.length >= 3 ? (
                <Text className="text-[13px] text-muted-foreground">Available</Text>
              ) : null}
            </View>
            <Input
              accessibilityLabelledBy="profile-handle"
              value={handle}
              onChangeText={setHandle}
              autoCapitalize="none"
              autoCorrect={false}
              error={handleError}
              success={!handleError && clean.length >= 3}
              reserveHelperLine
            />
          </View>

          <View className="gap-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              accessibilityLabelledBy="profile-bio"
              value={bio}
              onChangeText={setBio}
              maxLength={80}
              showCount
              minHeight={88}
            />
          </View>
        </View>
      </View>
    </Accent>
  );
}
