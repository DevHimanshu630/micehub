import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { EventType } from "@/lib/schemas";
import { EVENT_TYPE_LABELS } from "@/lib/schemas";

const GST_RATE = 0.18;

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  brandBox: {
    width: 32,
    height: 32,
    backgroundColor: "#4f46e5",
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    paddingTop: 5,
  },
  brandRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 6,
  },
  h1: { fontSize: 18, fontWeight: "bold" },
  h2: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  small: { fontSize: 9, color: "#64748b" },
  twoCol: { flexDirection: "row", gap: 24, marginBottom: 20 },
  col: { flex: 1 },
  label: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  table: { marginBottom: 20 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cellLeft: { fontSize: 9 },
  cellRight: { fontSize: 9, textAlign: "right" },
  bold: { fontWeight: "bold" },
  totals: {
    marginTop: 12,
    marginLeft: "auto",
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#0f172a",
    fontSize: 12,
    fontWeight: "bold",
  },
  paidBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  footer: {
    marginTop: 32,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontSize: 8,
    color: "#64748b",
  },
});

type LineItem = {
  label: string;
  unitLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: Date;
  bookingId: string;
  planner: { email: string };
  venue: { name: string; city: string };
  event: {
    eventType: EventType;
    startDate: Date;
    endDate: Date;
    guestCount: number;
  };
  lineItems: LineItem[];
  /** Quote total in INR rupees, GST-inclusive. */
  totalAmountInclGst: number;
  /** Advance paid in INR rupees (e.g. 20% of total). 0 if unpaid. */
  advancePaid: number;
  /** Razorpay payment id for the advance. null if unpaid. */
  paymentReference: string | null;
};

/** Round half-up to nearest integer. */
function r(n: number) {
  return Math.round(n);
}

function fmtRupees(rupees: number) {
  return `₹${rupees.toLocaleString("en-IN")}`;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Build the React-PDF Document element. Returned directly (not as a component)
 * so it matches @react-pdf/renderer's strict DocumentElement type.
 */
export function buildInvoiceDocument(data: InvoiceData) {
  const subtotal = r(data.totalAmountInclGst / (1 + GST_RATE));
  const cgst = r((data.totalAmountInclGst - subtotal) / 2);
  const sgst = data.totalAmountInclGst - subtotal - cgst;
  const balance = data.totalAmountInclGst - data.advancePaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandBox}>M</Text>
              <Text style={[styles.h1]}>MICEHub</Text>
            </View>
            <Text style={styles.small}>India&apos;s MICE booking platform</Text>
            <Text style={styles.small}>support@micehub.in</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.h1}>INVOICE</Text>
            <Text style={styles.small}>{data.invoiceNumber}</Text>
            <Text style={styles.small}>Issued {fmtDate(data.invoiceDate)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill from (Venue)</Text>
            <Text style={[styles.bold]}>{data.venue.name}</Text>
            <Text style={styles.small}>{data.venue.city}</Text>
            <Text style={styles.small}>GSTIN: pending</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Bill to (Planner)</Text>
            <Text style={styles.bold}>{data.planner.email}</Text>
            <Text style={styles.small}>GSTIN: URP</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.label}>Event</Text>
            <Text>{EVENT_TYPE_LABELS[data.event.eventType]}</Text>
            <Text style={styles.small}>
              {fmtDate(data.event.startDate)} – {fmtDate(data.event.endDate)}
            </Text>
            <Text style={styles.small}>
              {data.event.guestCount.toLocaleString("en-IN")} guests
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Booking ref</Text>
            <Text style={styles.small}>{data.bookingId}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellLeft, styles.bold, { flex: 4 }]}>
              Description
            </Text>
            <Text style={[styles.cellRight, styles.bold, { flex: 1 }]}>
              Unit price
            </Text>
            <Text style={[styles.cellRight, styles.bold, { flex: 1 }]}>
              Qty
            </Text>
            <Text style={[styles.cellRight, styles.bold, { flex: 1 }]}>
              Total
            </Text>
          </View>
          {data.lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={{ flex: 4 }}>
                <Text style={styles.cellLeft}>{item.label}</Text>
                {item.unitLabel ? (
                  <Text style={[styles.small]}>{item.unitLabel}</Text>
                ) : null}
              </View>
              <Text style={[styles.cellRight, { flex: 1 }]}>
                {fmtRupees(item.unitPrice)}
              </Text>
              <Text style={[styles.cellRight, { flex: 1 }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.cellRight, { flex: 1 }]}>
                {fmtRupees(item.lineTotal)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal (excl. GST)</Text>
            <Text>{fmtRupees(subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>CGST @ 9%</Text>
            <Text>{fmtRupees(cgst)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>SGST @ 9%</Text>
            <Text>{fmtRupees(sgst)}</Text>
          </View>
          <View style={styles.totalsRowGrand}>
            <Text>Grand total</Text>
            <Text>{fmtRupees(data.totalAmountInclGst)}</Text>
          </View>
        </View>

        {data.advancePaid > 0 ? (
          <View style={styles.paidBox}>
            <Text style={styles.bold}>
              Advance paid: {fmtRupees(data.advancePaid)}
            </Text>
            {data.paymentReference ? (
              <Text style={styles.small}>
                Razorpay payment ID: {data.paymentReference}
              </Text>
            ) : null}
            <Text style={[styles.small, { marginTop: 4 }]}>
              Balance due: {fmtRupees(balance)} (payable after the event)
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.paidBox,
              { backgroundColor: "#fefce8", borderColor: "#fde047" },
            ]}
          >
            <Text style={styles.bold}>No advance received yet.</Text>
            <Text style={styles.small}>
              Hold is active until paid; expires automatically if not settled.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            This invoice is generated by MICEHub on behalf of the venue.
            CGST/SGST split assumes intra-state supply. For inter-state bookings
            the equivalent IGST @ 18% applies. Contact support@micehub.in for
            queries.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
