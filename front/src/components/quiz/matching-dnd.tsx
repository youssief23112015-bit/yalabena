import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  leftItems: string[];                     // keys to match (e.g. ["cat", "dog"])
  rightOptions: string[];                  // shuffled values to drag
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

function DraggableChip({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Transform.toString(transform) }}
      className={cn(
        "flex cursor-grab items-center gap-1 rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </div>
  );
}

function DropSlot({ id, label, matched }: { id: string; label?: string; matched: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-9 min-w-[140px] items-center justify-center rounded-md border-2 border-dashed px-3 text-sm",
        matched && "border-solid border-green-300 bg-green-50",
        isOver && !matched && "border-primary bg-primary/5",
      )}
    >
      {label ?? <span className="text-muted-foreground">Drop here</span>}
    </div>
  );
}

export function MatchingDnd({ leftItems, rightOptions, value, onChange }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const matchedValues = new Set(Object.values(value));
  const unassigned = rightOptions.filter((o) => !matchedValues.has(o));

  const onDragStart = (e: DragStartEvent) => setActive(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActive(null);
    const dragged = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (!over || !over.startsWith("slot:")) return;
    const key = over.slice(5);
    // Remove the dragged value from any other slot first
    const next = Object.fromEntries(Object.entries(value).filter(([, v]) => v !== dragged));
    next[key] = dragged;
    onChange(next);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {unassigned.map((opt) => <DraggableChip key={opt} id={opt} label={opt} />)}
          {unassigned.length === 0 && <p className="text-xs text-muted-foreground">All options placed. Drag a chip off a slot to move it.</p>}
        </div>
        <div className="space-y-2">
          {leftItems.map((key) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-32 truncate text-sm font-medium">{key}</span>
              <DropSlot id={`slot:${key}`} label={value[key]} matched={!!value[key]} />
            </div>
          ))}
        </div>
      </div>
      <DragOverlay>
        {active ? <div className="rounded-md border bg-background px-3 py-1.5 text-sm shadow-lg">{active}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}