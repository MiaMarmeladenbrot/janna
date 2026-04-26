import type { InvoicePosition } from "../../store/types";
import { Card } from "../../components/common/Card";
import { PositionItem } from "./PositionItem";

interface PositionListProps {
  positions: InvoicePosition[];
  overtimePositionIds: ReadonlySet<string>;
  descriptionPlaceholder?: string;
  onUpdate: (id: string, updates: Partial<InvoicePosition>) => void;
  onRemove: (id: string) => void;
}

export function PositionList({
  positions,
  overtimePositionIds,
  descriptionPlaceholder,
  onUpdate,
  onRemove,
}: PositionListProps) {
  return (
    <Card title={`Positionen (${positions.length})`}>
      {positions.length === 0 ? (
        <div className="text-sm text-stone-400 italic text-center py-4">
          Noch keine Positionen.
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map((pos, idx) => (
            <PositionItem
              key={pos.id}
              pos={pos}
              index={idx}
              isOvertime={overtimePositionIds.has(pos.id)}
              descriptionPlaceholder={descriptionPlaceholder}
              onUpdate={(updates) => onUpdate(pos.id, updates)}
              onRemove={() => onRemove(pos.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
