import { useEffect, useRef, useState } from "react";
import { useApp } from "../store/useApp";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { NumberInput } from "../components/common/NumberInput";
import { Button } from "../components/common/Button";
import type { Settings } from "../store/types";

// @react-pdf/renderer only renders jpg/jpeg/png data URLs in the invoice PDF.
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function Settings() {
  const { state, dispatch } = useApp();
  const s = state.settings;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoStatus, setLogoStatus] = useState<
    { kind: "success" | "error"; message: string } | null
  >(null);

  // Auto-clear the success message after a few seconds; errors stay until the
  // next upload attempt so the user can read them.
  useEffect(() => {
    if (logoStatus?.kind !== "success") return;
    const timeout = window.setTimeout(() => setLogoStatus(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [logoStatus]);

  const update = (fields: Partial<Settings>) => {
    dispatch({ type: "UPDATE_SETTINGS", settings: fields });
  };

  const handleLogoUpload = (file: File) => {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoStatus({
        kind: "error",
        message: "Nur JPG- oder PNG-Dateien sind erlaubt.",
      });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoStatus({
        kind: "error",
        message: "Datei zu groß (max. 2 MB).",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update({ logoDataUrl: reader.result });
        setLogoStatus({ kind: "success", message: "Logo hochgeladen." });
      }
    };
    reader.onerror = () => {
      setLogoStatus({
        kind: "error",
        message: "Bild konnte nicht gelesen werden.",
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <PageHeader title="Einstellungen" />

      <div className="space-y-6 max-w-2xl">
        <Card title="Geschäftsdaten">
          <div className="space-y-4">
            <Input
              label="Name"
              value={s.businessName}
              onChange={(e) => update({ businessName: e.target.value })}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-stone-600">
                Berufsbezeichnung
              </label>
              <textarea
                value={s.businessTitle}
                onChange={(e) => update({ businessTitle: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:border-stone-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Straße"
                value={s.street}
                onChange={(e) => update({ street: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="PLZ"
                  value={s.zip}
                  onChange={(e) => update({ zip: e.target.value })}
                />
                <div className="col-span-2">
                  <Input
                    label="Ort"
                    value={s.city}
                    onChange={(e) => update({ city: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Telefon"
                value={s.phone}
                onChange={(e) => update({ phone: e.target.value })}
              />
              <Input
                label="E-Mail"
                value={s.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
            <Input
              label="IBAN"
              value={s.iban}
              onChange={(e) => update({ iban: e.target.value })}
            />
            <Input
              label="Steuernummer"
              value={s.taxNumber}
              onChange={(e) => update({ taxNumber: e.target.value })}
            />
            <NumberInput
              label="Nächste Rechnungsnr."
              value={s.nextInvoiceNumber}
              onValueChange={(v) => update({ nextInvoiceNumber: v })}
              decimals={0}
            />
          </div>
        </Card>

        <Card title="Logo">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {s.logoDataUrl ? (
                <img
                  src={s.logoDataUrl}
                  alt="Logo"
                  className="h-24 w-24 rounded-lg border border-stone-200 object-contain bg-white"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-xs text-stone-400">
                  Kein Logo
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-stone-600">
                  Wird oben rechts auf jeder Rechnung angezeigt.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Bild hochladen
                  </Button>
                  {s.logoDataUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        update({ logoDataUrl: undefined });
                        setLogoStatus(null);
                      }}
                    >
                      Zurücksetzen
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {logoStatus && (
              <p
                className={
                  logoStatus.kind === "success"
                    ? "text-sm text-green-700"
                    : "text-sm text-red-600"
                }
              >
                {logoStatus.message}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = "";
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
