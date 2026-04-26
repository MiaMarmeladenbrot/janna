import { StyleSheet } from "@react-pdf/renderer";

/**
 * Styles shared across all PDFs. Apply via composition on the `<Page>`,
 * e.g. `<Page style={[commonStyles.pageBase, invoiceStyles.page]}>`.
 * react-pdf inherits `fontFamily` and `color` to children, so individual
 * styles below only need to set them when they differ from the base.
 */
export const commonStyles = StyleSheet.create({
  pageBase: {
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
});

export const invoiceStyles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 11,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 52,
  },
  leftColumn: {
    width: 250,
  },
  rightColumn: {
    width: 140,
    alignItems: "flex-end",
  },
  returnAddressLine: {
    fontSize: 8,
    color: "#555",
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    paddingBottom: 2,
    marginBottom: 12,
  },
  recipientBlock: {
    fontSize: 11,
    lineHeight: 1.6,
  },
  headerLogo: {
    width: 120,
    height: 120,
    objectFit: "contain",
  },
  titleMetaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    marginBottom: 12,
    fontSize: 10,
  },
  titleMetaItem: {
    flexDirection: "row",
  },
  titleMetaLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 6,
  },
  invoiceTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 32,
  },
  salutation: {
    marginBottom: 8,
    fontSize: 11,
  },
  introText: {
    marginBottom: 12,
    fontSize: 11,
    lineHeight: 1.5,
  },
  positionsTable: {
    marginTop: 8,
    marginBottom: 8,
  },
  positionsHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 4,
    marginBottom: 4,
  },
  positionsRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  colPosition: {
    width: 50,
    paddingRight: 8,
    fontSize: 10,
  },
  colDescription: {
    flex: 1,
    paddingRight: 8,
    fontSize: 10,
  },
  colPeriod: {
    width: 75,
    paddingRight: 8,
    fontSize: 10,
  },
  colAmount: {
    width: 80,
    fontSize: 10,
    textAlign: "right",
  },
  colHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  descriptionSubline: {
    marginTop: 2,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  amountLabel: {
    width: 140,
    textAlign: "right",
    fontSize: 11,
    marginRight: 10,
  },
  amountValue: {
    width: 100,
    textAlign: "right",
    fontSize: 11,
  },
  amountValueBold: {
    width: 100,
    textAlign: "right",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  paymentTerms: {
    marginTop: 30,
    fontSize: 11,
  },
  closingThanks: {
    marginTop: 10,
    fontSize: 11,
  },
  closingGreeting: {
    marginTop: 10,
    fontSize: 11,
  },
  signature: {
    marginTop: 10,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    marginVertical: 10,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: "#bbb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#666",
    lineHeight: 1.5,
  },
  footerColumn: {
    flex: 1,
  },
  footerColumnRight: {
    flex: 1,
    textAlign: "right",
  },
  footerColumnCenter: {
    flex: 1,
    textAlign: "center",
  },
});

export const timesheetStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
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
  colDate: { width: 65 },
  colWork: { width: 250, paddingRight: 6 },
  colFrom: { width: 38, textAlign: "center" },
  colTo: { width: 38, textAlign: "center" },
  colBreak: { width: 35, textAlign: "center" },
  colHours: { width: 45, textAlign: "center" },
  colWorkHours: { width: 45, textAlign: "center" },
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
