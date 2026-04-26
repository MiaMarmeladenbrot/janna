import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { TimeEntry, Settings } from "../store/types";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { commonStyles, timesheetStyles as styles } from "./pdfStyles";

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

interface TimesheetPageProps {
  kw: number;
  entries: TimeEntry[];
  projectName: string;
  settings: Settings;
}

export function TimesheetPage({
  kw,
  entries,
  projectName,
  settings,
}: TimesheetPageProps) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const totalWorkHours = sorted.reduce((sum, e) => sum + e.hours, 0);

  return (
    <Page size="A4" style={[commonStyles.pageBase, styles.page]}>
      {/* Header */}
      <Text style={styles.title}>Stundennachweis: {projectName}</Text>

      <View style={styles.nameRow}>
        <View style={styles.nameLabel}>
          <Text style={commonStyles.bold}>Name: </Text>
          <Text>{settings.businessName}</Text>
        </View>
        <View style={styles.kwLabel}>
          <Text style={commonStyles.bold}>KW. </Text>
          <Text>{kw}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Header row */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colDate]}>Datum</Text>
          <Text style={[styles.headerCell, styles.colWork]}>Arbeiten:</Text>
          <Text style={[styles.headerCell, styles.colFrom]}>von</Text>
          <Text style={[styles.headerCell, styles.colTo]}>bis</Text>
          <Text style={[styles.headerCell, styles.colBreak]}>Pause</Text>
          <Text style={[styles.headerCell, styles.colHours]}>Stunden</Text>
          <Text style={[styles.headerCell, styles.colWorkHours]}>
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
              <Text style={[styles.cell, styles.colDate]}>{dateStr}</Text>
              <Text style={[styles.cellSmall, styles.colWork]}>{work}</Text>
              <Text style={[styles.cell, styles.colFrom]}>
                {formatTime(entry.startTime)}
              </Text>
              <Text style={[styles.cell, styles.colTo]}>
                {formatTime(entry.endTime)}
              </Text>
              <Text style={[styles.cell, styles.colBreak]}>
                {pauseH > 0 ? formatNum(pauseH) : ""}
              </Text>
              <Text style={[styles.cell, styles.colHours]}>
                {formatNum(totalH)}
              </Text>
              <Text style={[styles.cell, styles.colWorkHours]}>
                {formatNum(entry.hours)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer - total */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerLabel, styles.colDate]} />
        <Text style={[styles.footerLabel, styles.colWork]}>
          Gesamte Arbeitsstunden
        </Text>
        <Text style={[styles.footerLabel, styles.colFrom]} />
        <Text style={[styles.footerLabel, styles.colTo]} />
        <Text style={[styles.footerLabel, styles.colBreak]} />
        <Text style={[styles.footerLabel, styles.colHours]} />
        <Text style={[styles.footerValue, styles.colWorkHours]}>
          {formatNum(totalWorkHours)}
        </Text>
      </View>
    </Page>
  );
}

export function TimesheetPdf(props: TimesheetPageProps) {
  return (
    <Document>
      <TimesheetPage {...props} />
    </Document>
  );
}
