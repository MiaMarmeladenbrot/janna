import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { TimeEntry, Settings } from "../store/types";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  title: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  nameLabel: {
    flexDirection: "row",
    fontSize: 10,
  },
  kwLabel: {
    flexDirection: "row",
    fontSize: 10,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  // Table
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 3,
    minHeight: 14,
  },
  // Columns
  colDatum: { width: 65 },
  colArbeiten: { width: 250, paddingRight: 6 },
  colVon: { width: 38, textAlign: "center" },
  colBis: { width: 38, textAlign: "center" },
  colPause: { width: 35, textAlign: "center" },
  colStunden: { width: 45, textAlign: "center" },
  colArbeitst: { width: 45, textAlign: "center" },
  headerCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  cell: {
    fontSize: 9,
  },
  cellSmall: {
    fontSize: 8,
  },
  // Footer
  footerRow: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footerLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  footerValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
  },
});

function formatNum(n: number): string {
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatTime(time: string): string {
  // time is "HH:mm", display as-is
  return time || "";
}

function getWorkDescription(entry: TimeEntry): string {
  const parts: string[] = [];
  if (entry.checkedTasks.length > 0) {
    parts.push(entry.checkedTasks.join(", "));
  }
  if (entry.note) {
    parts.push(entry.note);
  }
  return parts.join(". ") || "";
}

function getTotalHoursFromTime(entry: TimeEntry): number {
  // Total hours from start to end (before break)
  if (!entry.startTime || !entry.endTime) return entry.hours;
  const [sh, sm] = entry.startTime.split(":").map(Number);
  const [eh, em] = entry.endTime.split(":").map(Number);
  const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
  return diff > 0 ? diff : entry.hours;
}

interface StundennachweisPdfProps {
  kw: number;
  entries: TimeEntry[];
  projectName: string;
  settings: Settings;
}

export function StundennachweisPdf({
  kw,
  entries,
  projectName,
  settings,
}: StundennachweisPdfProps) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const totalArbeitsstunden = sorted.reduce((sum, e) => sum + e.hours, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>Stundennachweis: {projectName}</Text>

        <View style={styles.nameRow}>
          <View style={styles.nameLabel}>
            <Text style={styles.bold}>Name: </Text>
            <Text>{settings.businessName}</Text>
          </View>
          <View style={styles.kwLabel}>
            <Text style={styles.bold}>KW. </Text>
            <Text>{kw}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colDatum]}>Datum</Text>
            <Text style={[styles.headerCell, styles.colArbeiten]}>
              Arbeiten:
            </Text>
            <Text style={[styles.headerCell, styles.colVon]}>von</Text>
            <Text style={[styles.headerCell, styles.colBis]}>bis</Text>
            <Text style={[styles.headerCell, styles.colPause]}>Pause</Text>
            <Text style={[styles.headerCell, styles.colStunden]}>Stunden</Text>
            <Text style={[styles.headerCell, styles.colArbeitst]}>
              Arbeitst.
            </Text>
          </View>

          {/* Data rows */}
          {sorted.map((entry) => {
            const d = parseISO(entry.date);
            const dateStr = format(d, "dd.MM.yyyy", { locale: de });
            const work = getWorkDescription(entry);
            const totalH = getTotalHoursFromTime(entry);
            const pauseH = entry.breakMinutes / 60;

            return (
              <View key={entry.id} style={styles.tableRow} wrap={false}>
                <Text style={[styles.cell, styles.colDatum]}>{dateStr}</Text>
                <Text style={[styles.cellSmall, styles.colArbeiten]}>
                  {work}
                </Text>
                <Text style={[styles.cell, styles.colVon]}>
                  {formatTime(entry.startTime)}
                </Text>
                <Text style={[styles.cell, styles.colBis]}>
                  {formatTime(entry.endTime)}
                </Text>
                <Text style={[styles.cell, styles.colPause]}>
                  {pauseH > 0 ? formatNum(pauseH) : ""}
                </Text>
                <Text style={[styles.cell, styles.colStunden]}>
                  {formatNum(totalH)}
                </Text>
                <Text style={[styles.cell, styles.colArbeitst]}>
                  {formatNum(entry.hours)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer - total */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerLabel, styles.colDatum]} />
          <Text style={[styles.footerLabel, styles.colArbeiten]}>
            Gesamte Arbeitsstunden
          </Text>
          <Text style={[styles.footerLabel, styles.colVon]} />
          <Text style={[styles.footerLabel, styles.colBis]} />
          <Text style={[styles.footerLabel, styles.colPause]} />
          <Text style={[styles.footerLabel, styles.colStunden]} />
          <Text style={[styles.footerValue, styles.colArbeitst]}>
            {formatNum(totalArbeitsstunden)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
