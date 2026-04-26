import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "../components/common/Button";

interface PdfDownloadButtonProps {
  // Factory that produces the PDF document on click. Allowing both sync and
  // async returns lets call sites await dynamic-imported PDF components, which
  // keeps @react-pdf/renderer out of the initial bundle.
  buildDocument: () => React.ReactElement | Promise<React.ReactElement>;
  fileName: string;
  label?: string;
  disabled?: boolean;
}

export function PdfDownloadButton({
  buildDocument,
  fileName,
  label = "PDF",
  disabled,
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const [{ pdf }, doc] = await Promise.all([
        import("@react-pdf/renderer"),
        Promise.resolve(buildDocument()),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(doc as any).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF konnte nicht erstellt werden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="secondary" onClick={handleDownload} disabled={loading || disabled}>
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      {label}
    </Button>
  );
}
