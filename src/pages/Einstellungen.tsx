import { useApp } from "../store/AppContext";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";
import { NumberInput } from "../components/common/NumberInput";
import type { Settings } from "../store/types";


export function Einstellungen() {
  const { state, dispatch } = useApp();
  const s = state.settings;

  const update = (fields: Partial<Settings>) => {
    dispatch({ type: "UPDATE_SETTINGS", settings: fields });
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
      </div>
    </div>
  );
}
