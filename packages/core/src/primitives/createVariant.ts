import { cn } from "../utils/cn";

/**
 * CVA-style variant resolution for NativeWind classes.
 *
 *   const button = createVariant({
 *     base: "items-center justify-center rounded-md",
 *     variants: {
 *       variant: { default: "bg-primary", destructive: "bg-destructive" },
 *       size: { sm: "h-8 px-3", md: "h-10 px-4" },
 *     },
 *     defaultVariants: { variant: "default", size: "md" },
 *   });
 *   button({ variant: "destructive" }) // resolved class string
 */

type VariantRecord = Record<string, Record<string, string>>;

export interface VariantConfig<V extends VariantRecord> {
  base?: string;
  variants: V;
  defaultVariants?: { [K in keyof V]?: keyof V[K] };
  compoundVariants?: Array<
    { [K in keyof V]?: keyof V[K] } & { class: string }
  >;
}

export type VariantProps<V extends VariantRecord> = {
  [K in keyof V]?: keyof V[K];
};

export function createVariant<V extends VariantRecord>(config: VariantConfig<V>) {
  return (props: VariantProps<V> & { className?: string } = {}): string => {
    const { className, ...variantProps } = props;
    const classes: string[] = [config.base ?? ""];

    const selectedVariants = variantProps as Record<string, string | undefined>;

    for (const key of Object.keys(config.variants) as Array<keyof V>) {
      const selected = selectedVariants[key as string] ?? (config.defaultVariants?.[key] as string | undefined);
      if (selected != null) {
        const cls = config.variants[key]?.[selected];
        if (cls) classes.push(cls);
      }
    }

    for (const compound of config.compoundVariants ?? []) {
      const { class: cls, ...conditions } = compound;
      const matches = (Object.keys(conditions) as Array<keyof V>).every(
        (k) =>
          (selectedVariants[k as string] ?? (config.defaultVariants?.[k] as string | undefined)) ===
          (conditions as Record<string, unknown>)[k as string]
      );
      if (matches) classes.push(cls);
    }

    return cn(...classes, className);
  };
}
