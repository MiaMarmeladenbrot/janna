import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { Invoice, Client, Project, Settings } from "../store/types";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  headerBlock: {
    fontSize: 9.5,
    lineHeight: 1.6,
    color: "#333",
  },
  headerLogo: {
    width: 100,
    height: 120,
    objectFit: "contain" as const,
  },
  headerName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  rechnungTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#8B0000",
    marginBottom: 20,
    textDecoration: "underline",
  },
  recipientBlock: {
    marginBottom: 20,
    fontSize: 11,
    lineHeight: 1.6,
  },
  salutation: {
    marginBottom: 12,
    fontSize: 11,
  },
  introText: {
    marginBottom: 16,
    fontSize: 11,
    lineHeight: 1.5,
  },
  invoiceMetaRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  invoiceMetaLabel: {
    width: 160,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  invoiceMetaValue: {
    width: 160,
    fontSize: 10,
  },
  positionBlock: {
    marginTop: 16,
    marginBottom: 20,
  },
  positionDescription: {
    fontSize: 11,
    marginBottom: 6,
  },
  positionDetailRow: {
    flexDirection: "row",
    fontSize: 11,
    paddingLeft: 60,
    marginBottom: 16,
    gap: 30,
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
    marginTop: 24,
    fontSize: 11,
  },
  closing: {
    marginTop: 20,
    fontSize: 11,
    lineHeight: 1.6,
  },
  signature: {
    marginTop: 20,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
});

function formatEuroPdf(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = rounded === Math.floor(rounded);
  if (isWhole) {
    return `€ ${Math.floor(rounded).toLocaleString("de-DE")},-`;
  }
  return `€ ${rounded.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`;
}

function formatDatePdf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}

interface RechnungPdfProps {
  invoice: Invoice;
  client: Client;
  project: Project;
  settings: Settings;
}

export function RechnungPdf({
  invoice,
  client,
  project,
  settings,
}: RechnungPdfProps) {
  const netTotal = invoice.positions.reduce((s, p) => s + p.netAmount, 0);
  const vatAmount = netTotal * invoice.vatRate;
  const grossTotal = netTotal + vatAmount;
  const vatPercent = Math.round(invoice.vatRate * 100);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with business details and logo */}
        <View style={styles.headerRow}>
          <View style={styles.headerBlock}>
            <Text style={styles.headerName}>{settings.businessName}</Text>
            {settings.businessTitle.split("\n").map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
            <Text>{settings.street}</Text>
            <Text>
              {settings.zip} {settings.city}
            </Text>
            <Text>Tel: {settings.phone}</Text>
            <Text style={{ color: "#0066cc" }}>{settings.email}</Text>
            <Text>Iban: {settings.iban}</Text>
            <Text>Steuernr: {settings.taxNumber}</Text>
          </View>
          <Image src="/logo.jpg" style={styles.headerLogo} />
        </View>

        {/* Rechnung heading */}
        <Text style={styles.rechnungTitle}>Rechnung</Text>

        {/* Recipient */}
        <View style={styles.recipientBlock}>
          <Text>{client.name}</Text>
          <Text>{client.contactPerson}</Text>
          <Text>{client.street}</Text>
          <Text>
            {client.zip} {client.city}
          </Text>
        </View>

        {/* Salutation */}
        <Text style={styles.salutation}>{client.salutation}</Text>

        {/* Intro text */}
        <Text style={styles.introText}>
          Hiermit erlaube ich mir den Betrag von insgesamt{" "}
          {formatEuroPdf(grossTotal)} wie folgt in Rechnung zu stellen:
        </Text>

        {/* Invoice number and date */}
        <View style={{ marginBottom: 16 }}>
          <View style={styles.invoiceMetaRow}>
            <Text style={styles.invoiceMetaLabel}>Rechnungsnummer:</Text>
            <Text style={styles.invoiceMetaLabel}>Rechnungsdatum:</Text>
          </View>
          <View style={styles.invoiceMetaRow}>
            <Text style={styles.invoiceMetaValue}>{invoice.number}</Text>
            <Text style={styles.invoiceMetaValue}>
              {formatDatePdf(invoice.date)}
            </Text>
          </View>
        </View>

        {/* Positions */}
        {invoice.positions.map((pos, idx) => {
          const desc = pos.description || project.description;
          const fullDesc = project.name
            ? `${desc} in\n${project.name}`
            : desc;
          return (
            <View key={pos.id} style={styles.positionBlock}>
              <Text style={styles.positionDescription}>
                Pos{idx + 1}. {fullDesc}
              </Text>
              {pos.billingType === "flatrate" ? (
                <View style={styles.positionDetailRow}>
                  <Text>Zeitraum KW. {pos.kwRange}</Text>
                  <Text>Pauschal, {formatEuroPdf(pos.flatAmount)}</Text>
                </View>
              ) : (
                <View style={styles.positionDetailRow}>
                  <Text>Zeitraum KW. {pos.kwRange}</Text>
                  <Text>
                    {pos.totalHours} Std. x {formatEuroPdf(pos.hourlyRate)} ={" "}
                    {formatEuroPdf(pos.netAmount)}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Amounts */}
        <View style={{ marginTop: 4 }}>
          {invoice.positions.length > 1 && (
            <View style={[styles.amountRow, { marginBottom: 6 }]}>
              <Text style={styles.amountLabel}>Nettobetrag:</Text>
              <Text style={styles.amountValue}>
                {formatEuroPdf(netTotal)}
              </Text>
            </View>
          )}
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>{vatPercent}% USt. :</Text>
            <Text style={styles.amountValue}>{formatEuroPdf(vatAmount)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text
              style={[styles.amountLabel, { fontFamily: "Helvetica-Bold" }]}
            >
              Gesamtbetrag:
            </Text>
            <Text style={styles.amountValueBold}>
              {formatEuroPdf(grossTotal)}
            </Text>
          </View>
        </View>

        {/* Payment terms */}
        <Text style={styles.paymentTerms}>{settings.paymentTerms}</Text>

        {/* Closing */}
        <View style={styles.closing}>
          <Text>Vielen Dank für die angenehme Zusammenarbeit.</Text>
          <Text>{"\n"}Mit freundlichen Grüßen,</Text>
        </View>

        <Text style={styles.signature}>{settings.businessName}</Text>
      </Page>
    </Document>
  );
}
