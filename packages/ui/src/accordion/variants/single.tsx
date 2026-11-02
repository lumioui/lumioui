import * as React from "react";
import { View } from "react-native";
import { Accent } from "@lumioui/core";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../accordion";
import { Text } from "../../text/text";

const FAQ = [
  {
    id: "vet",
    q: "Can I see any vet?",
    a: "Yes. Any licensed vet in the US or Canada, including emergency clinics. Pay at the visit and send us the invoice.",
  },
  {
    id: "wait",
    q: "Is there a waiting period before cover starts?",
    a: "14 days for illness and 2 days for accidents. Routine care like vaccines is covered from day one on the Plus plan.",
  },
  {
    id: "claims",
    q: "How fast are claims paid?",
    a: "Most claims are reviewed within 2 business days and paid straight to your bank. You'll get a push notification when it lands.",
  },
  {
    id: "age",
    q: "Does the price go up as my pet gets older?",
    a: "Your rate is set at sign-up and only changes with your plan or local vet costs, never because of a birthday.",
  },
];

/** AccordionSingle — a help screen for a pet-insurance app: one answer
 *  open at a time (opening a question closes the last), long questions
 *  wrap to two lines instead of truncating. Lit: the open answer carries a
 *  faint teal wash and full ink while the closed questions sit dimmer. */
export function AccordionSingle() {
  return (
    <Accent color="teal" className="w-full">
      <View className="w-full overflow-hidden rounded-3xl bg-background px-5 pb-4 pt-6">
        <Text className="text-3xl font-bold tracking-tight">Help</Text>
        <Text className="pb-4 pt-1 text-[15px] text-muted-foreground">Questions about Juniper's cover</Text>
        <View className="rounded-2xl bg-card px-4">
          <Accordion type="single" lit defaultValue={["wait"]} collapsible={false}>
            {FAQ.map((f, i) => (
              <AccordionItem
                key={f.id}
                value={f.id}
                className={i < FAQ.length - 1 ? "border-b border-border" : undefined}
              >
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </View>
      </View>
    </Accent>
  );
}
