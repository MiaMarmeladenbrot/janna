import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import type { Invoice, Client, Project, Settings } from "../store/types";
import { formatPeriod } from "../utils/period";
import { formatEuroShort } from "../utils/currency";
import { formatDate } from "../utils/dateFormat";
import { getInvoiceTotals } from "../utils/calculations";
import { commonStyles, invoiceStyles as styles } from "./pdfStyles";
import {
  INVOICE_INTRO_AMOUNT_PLACEHOLDER,
  SMALL_BUSINESS_NOTE,
} from "../store/defaults";

interface InvoicePdfProps {
  invoice: Invoice;
  client: Client;
  project: Project;
  settings: Settings;
}

export function InvoicePdf({
  invoice,
  client,
  project,
  settings,
}: InvoicePdfProps) {
  const { net: netTotal, vat: vatAmount, gross: grossTotal } =
    getInvoiceTotals(invoice);
  const vatPercent = Math.round(invoice.vatRate * 100);
  const hasVat = invoice.vatRate > 0;
  const intro = settings.invoiceIntro
    .trim()
    .replaceAll(INVOICE_INTRO_AMOUNT_PLACEHOLDER, formatEuroShort(grossTotal));
  const notes = invoice.notes.trim();

  return (
    <Document>
      <Page size="A4" style={[commonStyles.pageBase, styles.page]}>
        {/* Header: recipient left, logo + sender + invoice meta right */}
        <View style={styles.headerRow}>
          <View style={styles.leftColumn}>
            <Text style={styles.returnAddressLine}>
              {settings.businessName}, {settings.street}, {settings.zip}{" "}
              {settings.city}
            </Text>
            <View style={styles.recipientBlock}>
              <Text>{client.name}</Text>
              <Text>{client.contactPerson}</Text>
              <Text>{client.street}</Text>
              <Text>
                {client.zip} {client.city}
              </Text>
            </View>
          </View>

          <View style={styles.rightColumn}>
            {settings.logoDataUrl && (
              <Image src={settings.logoDataUrl} style={styles.headerLogo} />
            )}
          </View>
        </View>

        {/* Invoice meta inline above the title */}
        <View style={styles.titleMetaRow}>
          <View style={styles.titleMetaItem}>
            <Text style={styles.titleMetaLabel}>Rechnungsnummer:</Text>
            <Text>{invoice.number}</Text>
          </View>
          <View style={styles.titleMetaItem}>
            <Text style={styles.titleMetaLabel}>Rechnungsdatum:</Text>
            <Text>{formatDate(invoice.date)}</Text>
          </View>
        </View>

        {/* Invoice heading */}
        <Text style={styles.invoiceTitle}>Rechnung</Text>

        {/* Salutation */}
        <Text style={styles.salutation}>{client.salutation},</Text>

        {/* Intro text */}
        {intro && <Text style={styles.introText}>{intro}</Text>}

        {/* Positions table */}
        <View style={styles.positionsTable}>
          <View style={styles.positionsHeaderRow}>
            <Text style={[styles.colPosition, styles.colHeaderText]}>
              Position
            </Text>
            <Text style={[styles.colDescription, styles.colHeaderText]}>
              Beschreibung
            </Text>
            <Text style={[styles.colPeriod, styles.colHeaderText]}>
              Zeitraum
            </Text>
            <Text style={[styles.colAmount, styles.colHeaderText]}>Betrag</Text>
          </View>
          {invoice.positions.map((pos, idx) => {
            const desc = pos.description || project.description;
            const amount =
              pos.billingType === "flatrate" ? pos.flatAmount : pos.netAmount;
            const isLast = idx === invoice.positions.length - 1;
            return (
              <View
                key={pos.id}
                style={
                  isLast
                    ? [styles.positionsRow, { borderBottomWidth: 0 }]
                    : styles.positionsRow
                }
              >
                <Text style={styles.colPosition}>{idx + 1}</Text>
                <View style={styles.colDescription}>
                  <Text>{project.name}</Text>
                  <Text style={styles.descriptionSubline}>{desc}</Text>
                </View>
                <Text style={styles.colPeriod}>{formatPeriod(pos)}</Text>
                <Text style={styles.colAmount}>{formatEuroShort(amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Amounts */}
        <View style={{ marginTop: 4 }}>
          {hasVat && invoice.positions.length > 1 && (
            <View style={[styles.amountRow, { marginBottom: 6 }]}>
              <Text style={styles.amountLabel}>Nettobetrag:</Text>
              <Text style={styles.amountValue}>{formatEuroShort(netTotal)}</Text>
            </View>
          )}
          {hasVat && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>{vatPercent}% USt. :</Text>
              <Text style={styles.amountValue}>{formatEuroShort(vatAmount)}</Text>
            </View>
          )}
          <View style={styles.amountRow}>
            <Text
              style={[styles.amountLabel, { fontFamily: "Helvetica-Bold" }]}
            >
              Gesamtbetrag:
            </Text>
            <Text style={styles.amountValueBold}>
              {formatEuroShort(grossTotal)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentTerms}>
          {!hasVat && settings.smallBusiness && (
            <Text>{SMALL_BUSINESS_NOTE}</Text>
          )}
          {notes && <Text style={{ marginTop: 6 }}>{notes}</Text>}
          {project.paymentTerms.trim() && (
            <Text style={{ marginTop: 6 }}>{project.paymentTerms}</Text>
          )}
        </View>

        {/* Closing */}
        <Text style={styles.closingThanks}>
          Vielen Dank für die angenehme Zusammenarbeit.
        </Text>
        <Text style={styles.closingGreeting}>Mit freundlichen Grüßen,</Text>

        <Text style={styles.signature}>{settings.businessName}</Text>

        <View style={styles.footer} fixed>
          <View style={styles.footerColumn}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              {settings.businessName}
            </Text>
            <Text>{settings.street}</Text>
            <Text>
              {settings.zip} {settings.city}
            </Text>
          </View>
          <View style={styles.footerColumnCenter}>
            <Text>Tel: {settings.phone}</Text>
            <Text style={{ color: "#0066cc" }}>{settings.email}</Text>
          </View>
          <View style={styles.footerColumnRight}>
            <Text>IBAN: {settings.iban}</Text>
            <Text>Steuernr.: {settings.taxNumber}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
