import * as React from "react";
import { View } from "react-native";
import { cn } from "@lumioui/core";
import { DataTable, type DataTableColumn } from "./data-table";
import { Text } from "../text/text";
import { ActionSwapText } from "../action-swap/action-swap";

type Status = "Paid" | "Due" | "Overdue";

const INVOICES: { id: string; client: string; status: Status; cents: number; due: string }[] = [
  { id: "1048", client: "Kestrel Studio", status: "Overdue", cents: 240000, due: "Sep 30" },
  { id: "1047", client: "Halvorsen & Co", status: "Due", cents: 86500, due: "Oct 14" },
  { id: "1046", client: "Blue Fern Dental", status: "Paid", cents: 132000, due: "Oct 2" },
  { id: "1045", client: "Okafor Architects", status: "Due", cents: 412050, due: "Oct 21" },
  { id: "1044", client: "Pine & Pixel", status: "Paid", cents: 39900, due: "Sep 26" },
];

const DOT: Record<Status, string> = {
  Paid: "bg-success",
  Due: "bg-warning",
  Overdue: "bg-destructive",
};

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatusCell({ status }: { status: Status }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={cn("h-2 w-2 rounded-full", DOT[status])} />
      <Text className="text-[15px] text-muted-foreground">{status}</Text>
    </View>
  );
}

const COLUMNS: DataTableColumn[] = [
  {
    key: "client",
    title: "Client",
    flex: 1.6,
    sortable: true,
    sortValue: (r) => String(r.clientName),
    a11yValue: (r) => String(r.clientName),
  },
  {
    key: "status",
    title: "Status",
    flex: 1,
    sortable: true,
    // Overdue first, then due, then paid.
    sortValue: (r) => ({ Overdue: 0, Due: 1, Paid: 2 })[r.statusKey as Status] ?? 3,
    a11yValue: (r) => String(r.statusKey),
  },
  {
    key: "amount",
    title: "Amount",
    align: "right",
    flex: 1.2,
    sortable: true,
    sortValue: (r) => Number(r.cents),
    a11yValue: (r) => money(Number(r.cents)),
  },
];

/** Playground preview — a freelancer's invoices list in neutral ink
 *  (a green accent would make the overdue figure read as good news).
 *  The rows switch on under one sheen; tap a header to sort (tap again to
 *  flip) and the sorted column leads while the rows reflow. Tap a row and it
 *  takes the lit band while the summary swaps to its due date in place. The
 *  overdue amount is the one bold highlight. */
export function DataTableDemo() {
  const [selected, setSelected] = React.useState<number | null>(0);
  const outstanding = INVOICES.filter((i) => i.status !== "Paid").reduce((s, i) => s + i.cents, 0);
  const pick = selected != null ? INVOICES[selected] : undefined;

  const rows = INVOICES.map((inv) => ({
    id: inv.id,
    cents: inv.cents,
    statusKey: inv.status,
    clientName: inv.client,
    client: (
      <View>
        <Text numberOfLines={1} className="text-[15px] font-medium">
          {inv.client}
        </Text>
        <Text className="text-xs text-muted-foreground tabular-nums">#{inv.id}</Text>
      </View>
    ),
    status: <StatusCell status={inv.status} />,
    amount: (
      <Text
        numberOfLines={1}
        className={cn(
          "text-[15px] font-medium tabular-nums",
          inv.status === "Overdue" ? "font-semibold text-primary-text" : "text-foreground"
        )}
      >
        {money(inv.cents)}
      </Text>
    ),
  }));

  const summary = pick
    ? `${pick.client} · ${pick.status === "Paid" ? `paid ${pick.due}` : `due ${pick.due}`} · ${money(pick.cents)}`
    : "Tap an invoice";

  return (
    <View className="w-full">
      <View className="w-full gap-4">
        <View className="gap-1 px-1">
          <Text variant="muted">Outstanding</Text>
          <Text className="text-4xl font-semibold tracking-tight tabular-nums">{money(outstanding)}</Text>
        </View>

        <DataTable
          columns={COLUMNS}
          rows={rows}
          defaultSort={{ key: "status", direction: "asc" }}
          rowLabel="invoice"
          selectedIndex={selected}
          onRowPress={(_, i) => setSelected(i)}
          className="border-0"
        />

        <ActionSwapText value={summary} className="px-1 text-sm text-muted-foreground">
          {summary}
        </ActionSwapText>
      </View>
    </View>
  );
}
