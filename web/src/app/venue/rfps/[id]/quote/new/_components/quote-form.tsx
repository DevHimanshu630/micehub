"use client";

import { formatINR } from "@/lib/format";
import Link from "next/link";
import { useActionState, useState } from "react";
import { submitQuote, type CreateQuoteState } from "../../actions";

type LineItem = {
  key: string;
  label: string;
  unitLabel: string;
  unitPrice: string;
  quantity: string;
};

function newRow(): LineItem {
  return {
    key: crypto.randomUUID(),
    label: "",
    unitLabel: "",
    unitPrice: "",
    quantity: "1",
  };
}

const PRESETS = [
  { label: "Space rental", unitLabel: "per day" },
  { label: "F&B per person", unitLabel: "per person" },
  { label: "A/V package", unitLabel: "flat" },
];

export function QuoteForm({
  rfpRecipientId,
  backHref,
}: {
  rfpRecipientId: string;
  backHref: string;
}) {
  const boundAction = submitQuote.bind(null, rfpRecipientId);
  const [state, formAction, isPending] = useActionState<
    CreateQuoteState,
    FormData
  >(boundAction, null);

  const [items, setItems] = useState<LineItem[]>([newRow()]);

  function updateRow(key: string, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(key: string) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.key !== key),
    );
  }

  function addRow(preset?: { label: string; unitLabel: string }) {
    setItems((prev) => [
      ...prev,
      preset
        ? { ...newRow(), label: preset.label, unitLabel: preset.unitLabel }
        : newRow(),
    ]);
  }

  // Serialize for submission; coerce strings → numbers.
  const serialized = items.map((row) => ({
    label: row.label,
    unitLabel: row.unitLabel || null,
    unitPrice: Number(row.unitPrice) || 0,
    quantity: Number(row.quantity) || 0,
  }));

  const grandTotal = serialized.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="lineItems"
        value={JSON.stringify(serialized)}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Line items
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => addRow(p)}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <Th className="w-2/5">Label</Th>
                <Th className="w-1/6">Unit (optional)</Th>
                <Th className="w-1/6" align="right">
                  Unit price (₹)
                </Th>
                <Th className="w-20" align="right">
                  Qty
                </Th>
                <Th className="w-1/6" align="right">
                  Line total
                </Th>
                <Th className="w-10" align="right">
                  {""}
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((row, idx) => {
                const lineTotal =
                  (Number(row.unitPrice) || 0) * (Number(row.quantity) || 0);
                return (
                  <tr key={row.key}>
                    <Td>
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) =>
                          updateRow(row.key, { label: e.target.value })
                        }
                        placeholder="Main Hall rental"
                        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </Td>
                    <Td>
                      <input
                        type="text"
                        value={row.unitLabel}
                        onChange={(e) =>
                          updateRow(row.key, { unitLabel: e.target.value })
                        }
                        placeholder="per day"
                        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </Td>
                    <Td align="right">
                      <input
                        type="number"
                        min={0}
                        value={row.unitPrice}
                        onChange={(e) =>
                          updateRow(row.key, { unitPrice: e.target.value })
                        }
                        placeholder="0"
                        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </Td>
                    <Td align="right">
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(row.key, { quantity: e.target.value })
                        }
                        className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </Td>
                    <Td align="right">
                      <span className="text-sm font-medium text-slate-900 tabular-nums dark:text-slate-100">
                        {formatINR(lineTotal)}
                      </span>
                    </Td>
                    <Td align="right">
                      {items.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          aria-label={`Remove row ${idx + 1}`}
                          className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950"
                        >
                          ×
                        </button>
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-950">
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-3 text-right text-sm font-semibold"
                >
                  Grand total
                </td>
                <td className="px-4 py-3 text-right text-base font-bold tabular-nums">
                  {formatINR(grandTotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => addRow()}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            + Add line item
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Notes for the planner (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Quote valid for 30 days. Includes setup + breakdown. 18% GST extra."
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {state?.formError ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {state.formError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <Link
          href={backHref}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || grandTotal === 0}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : `Send quote · ${formatINR(grandTotal)}`}
        </button>
      </div>
    </form>
  );
}

function Th({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-2 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400 ${align === "right" ? "text-right" : "text-left"} ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-4 py-2 ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </td>
  );
}
