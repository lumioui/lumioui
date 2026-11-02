import * as React from "react";
import { View } from "react-native";
import { SwitchOn, rowDelay } from "@lumioui/core";
import { Pagination } from "../pagination";
import { Text } from "../../text/text";

const PER_PAGE = 5;
const TOTAL_TICKETS = 58;
const PAGES = Math.ceil(TOTAL_TICKETS / PER_PAGE);

const SUBJECTS = [
  "Can't export invoices to CSV",
  "Two-factor code never arrives",
  "Seat count wrong after downgrade",
  "Webhook retries flooding endpoint",
  "Calendar sync skipped recurring events",
  "SSO login loops back to sign-in",
  "Refund for duplicate annual charge",
  "Dark mode unreadable in reports",
  "Bulk import stalls at 80%",
  "API rate limit lower than plan",
  "Shared views missing for guests",
  "Mobile app crashes on attachments",
];
const PEOPLE = ["Noor Haddad", "Ellis Grant", "Mei Watanabe", "Kofi Asante", "Sanna Lindqvist", "Rafael Ortiz", "Ivy Calloway"];
const STATES = [
  { label: "Open", dot: "bg-tint-teal" },
  { label: "Waiting", dot: "bg-tint-amber" },
  { label: "Solved", dot: "bg-neutral-400" },
] as const;

/** Deterministic fake ticket for a global row index — every page looks real. */
function ticket(n: number) {
  const subject = SUBJECTS[(n * 7) % SUBJECTS.length]!;
  const who = PEOPLE[(n * 3) % PEOPLE.length]!;
  const state = STATES[n % 5 === 0 ? 2 : n % 3 === 0 ? 1 : 0]!;
  const id = 4810 - n;
  const age = n < 4 ? `${(n + 1) * 12}m` : n < 20 ? `${Math.floor(n / 2)}h` : `${Math.floor(n / 6)}d`;
  return { id, subject, who, state, age };
}

/** PaginationNumbers — a helpdesk inbox paged five tickets at a time. The
 *  current page switches on where it is while the last one dims; the new
 *  page of tickets switches on from dim, 40ms a row. The ellipses shift so
 *  the row never changes width. Ink, like the tool's own chrome. */
export function PaginationNumbers() {
  const [page, setPage] = React.useState(1);
  const start = (page - 1) * PER_PAGE;
  const rows = Array.from({ length: Math.min(PER_PAGE, TOTAL_TICKETS - start) }, (_, i) => ticket(start + i));

  return (
    <View className="w-full">
      <View className="w-full gap-4">
        <View className="flex-row items-end justify-between px-1">
          <View className="gap-1">
            <Text className="text-2xl font-bold tracking-tight">Tickets</Text>
            <Text variant="muted">Billing &amp; accounts queue</Text>
          </View>
          <Text className="text-sm text-muted-foreground tabular-nums">
            {start + 1}–{start + rows.length} of {TOTAL_TICKETS}
          </Text>
        </View>

        <View key={page} className="overflow-hidden rounded-2xl bg-card">
          {rows.map((t, i) => (
            <SwitchOn key={t.id} delay={rowDelay(i)}>
              {i > 0 ? <View className="ml-4 h-px bg-border" /> : null}
              <View className="min-h-[68px] justify-center gap-1 px-4 py-3">
                <View className="flex-row items-center gap-2">
                  <View className={`h-2 w-2 rounded-full ${t.state.dot}`} />
                  <Text numberOfLines={1} className="flex-1 text-[15px] font-medium">
                    {t.subject}
                  </Text>
                  <Text className="text-xs text-muted-foreground tabular-nums">{t.age}</Text>
                </View>
                <Text numberOfLines={1} className="pl-4 text-sm text-muted-foreground">
                  #{t.id} · {t.who} · {t.state.label}
                </Text>
              </View>
            </SwitchOn>
          ))}
        </View>

        <Pagination total={PAGES} page={page} onPageChange={setPage} />
      </View>
    </View>
  );
}
