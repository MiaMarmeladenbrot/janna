import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Settings, StundenKontoEntry } from "../store/types";
import { getStundenKontoBalance } from "../utils/calculations";
import { formatMonthOnly, parseMonthKey } from "../utils/dateFormat";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  kwCol: {
    width: 60,
    textAlign: "center",
  },
  stundenCol: {
    width: 80,
    textAlign: "center",
  },
  sollIstRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 20,
  },
  sollBox: {
    backgroundColor: "#d4edda",
    padding: "4 12",
    flexDirection: "row",
  },
  istBox: {
    backgroundColor: "#f8d7da",
    padding: "4 12",
    flexDirection: "row",
  },
  infoSection: {
    marginBottom: 16,
    fontSize: 10,
    lineHeight: 1.6,
  },
  kontoSection: {
    marginTop: 10,
  },
  kontoTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 8,
  },
  kontoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  kontoMonth: {
    width: 100,
    fontSize: 10,
  },
  kontoNote: {
    width: 140,
    fontSize: 9,
    color: "#666",
  },
  kontoValue: {
    width: 60,
    textAlign: "right",
    fontSize: 10,
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  summaryLabel: {
    width: 240,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  summaryValue: {
    width: 60,
    textAlign: "right",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
});

interface StundenPdfProps {
  month: number;
  year: number;
  hoursByKW: Map<number, number>;
  sollHours: number;
  istHours: number;
  settings: Settings;
  stundenKonto: StundenKontoEntry[];
}

function formatNum(n: number): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SOURCE_LABELS: Record<string, string> = {
  cap: "Wochenlimit",
  invoice: "Rechnung",
  manual: "Manuell",
};

export function StundenPdf({
  month,
  year,
  hoursByKW,
  sollHours,
  istHours,
  settings,
  stundenKonto,
}: StundenPdfProps) {
  const sortedWeeks = Array.from(hoursByKW.entries()).sort(([a], [b]) => a - b);
  const monthDate = new Date(year, month, 1);
  const monthName = capitalizeFirst(formatMonthOnly(monthDate));
  const weekCount = sortedWeeks.length;

  const balance = getStundenKontoBalance(stundenKonto);
  const sorted = [...stundenKonto].sort((a, b) => a.month.localeCompare(b.month));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Stunden Ubersicht</Text>
        <Text style={styles.subtitle}>Stunden Ubersicht im {monthName}</Text>

        {/* KW Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.kwCol]}>KW</Text>
            <Text style={[styles.tableHeaderCell, styles.stundenCol]}>
              Stunde
            </Text>
          </View>
          {sortedWeeks.map(([kw, hours]) => (
            <View key={kw} style={styles.tableRow}>
              <Text style={styles.kwCol}>{kw}</Text>
              <Text style={styles.stundenCol}>{formatNum(hours)}</Text>
            </View>
          ))}
        </View>

        {/* Soll / Ist */}
        <View style={styles.sollIstRow}>
          <View style={styles.sollBox}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: "#155724" }}>
              soll
            </Text>
            <Text style={{ marginLeft: 40, color: "#155724" }}>
              {formatNum(sollHours)}
            </Text>
          </View>
          <View style={[styles.istBox, { marginLeft: 4 }]}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: "#721c24" }}>
              Hast
            </Text>
            <Text style={{ marginLeft: 40, color: "#721c24" }}>
              {formatNum(istHours)}
            </Text>
          </View>
        </View>

        {/* Info text */}
        <View style={styles.infoSection}>
          <Text>verabredung mit Matthias</Text>
          <Text>St.Lohn {settings.hourlyRate} euro</Text>
          <Text>
            Begrenzt auf {settings.weeklyCap} der woche Macht{" "}
            {settings.weeklyTarget} Stunde der woche die ich für RWB Arbeite
            wenn
          </Text>
          <Text>
            {monthName} {weekCount} wochen {settings.weeklyCap * weekCount} Mehr
            Stunden entstehen mussen die entweder
          </Text>
          <Text>
            {" "}
            Stunde der Monat Kompeziert oder auf andere Tagen versetzt
          </Text>
          <Text>
            {settings.weeklyTarget}*{weekCount} {formatNum(sollHours)} werden
          </Text>
        </View>

        {/* Stunden-Konto section */}
        <View style={styles.kontoSection}>
          <Text style={styles.kontoTitle}>Stunden-Konto:</Text>

          {sorted.map((entry) => {
            const d = parseMonthKey(entry.month);
            const label = capitalizeFirst(formatMonthOnly(d));
            return (
              <View key={entry.id} style={styles.kontoRow}>
                <Text style={styles.kontoMonth}>{label}</Text>
                <Text style={styles.kontoNote}>
                  {entry.note || SOURCE_LABELS[entry.source]}
                </Text>
                <Text style={styles.kontoValue}>
                  {entry.hours > 0 ? "+" : ""}
                  {formatNum(entry.hours)}
                </Text>
              </View>
            );
          })}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Guthaben Saldo:</Text>
            <Text style={styles.summaryValue}>{formatNum(balance)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
