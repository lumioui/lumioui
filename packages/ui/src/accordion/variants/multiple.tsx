import * as React from "react";
import { View } from "react-native";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../accordion";
import { Image } from "../../image/image";
import { Text } from "../../text/text";

const SHOE =
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80&auto=format&fit=crop";

/** AccordionMultiple — the product-page habitat: Details, Materials and
 *  Shipping sections under a sneaker, several open at once, hairlines
 *  between them. Neutral ink; the product photo carries the colour. Lit:
 *  open sections hold a faint ink wash, closed ones sit at 70% ink. */
export function AccordionMultiple() {
  const [open, setOpen] = React.useState<string[]>(["details"]);
  return (
    <View className="w-full overflow-hidden rounded-3xl bg-card">
      <Image source={{ uri: SHOE }} className="h-56 w-full" alt="Arlo Trail Runner in ember red" />
      <View className="gap-1 px-5 pb-2 pt-5">
        <Text className="text-2xl font-bold tracking-tight">Arlo Trail Runner</Text>
        <Text className="text-[15px] text-muted-foreground">Ember red · Men's 10</Text>
        <Text className="pt-1 text-xl font-semibold tabular-nums">$148.00</Text>
      </View>
      <Accordion type="multiple" lit value={open} onValueChange={setOpen} className="px-5 pb-2">
        <AccordionItem value="details" className="border-b border-border">
          <AccordionTrigger>Details</AccordionTrigger>
          <AccordionContent>
            A 6 mm drop with a rock plate under the forefoot. Lugs are 4 mm deep, so it grips on wet roots without feeling clumsy on pavement.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="materials" className="border-b border-border">
          <AccordionTrigger>Materials and care</AccordionTrigger>
          <AccordionContent>
            Recycled ripstop upper, sugarcane foam midsole. Rinse mud off with cold water and let them air dry away from heaters.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping">
          <AccordionTrigger>Shipping and returns</AccordionTrigger>
          <AccordionContent>
            Free 2-day shipping over $100. Run in them for 30 days; if they don't work out, send them back muddy and we'll refund you.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </View>
  );
}
