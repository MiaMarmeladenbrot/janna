import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { Button } from "../components/common/Button";

interface PdfDownloadButtonProps {
  document: React.ReactElement;
  fileName: string;
}

export function PdfDownloadButton({
  document,
  fileName,
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(document as any).toBlob();
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
    <Button variant="secondary" onClick={handleDownload} disabled={loading}>
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      PDF
    </Button>
  );
}
