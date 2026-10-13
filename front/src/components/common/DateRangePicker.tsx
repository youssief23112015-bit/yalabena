import React from 'react';

interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        className="border rounded-md px-2 py-1 text-sm bg-background"
        value={value.from.toISOString().split('T')[0]}
        onChange={(e) => onChange({ ...value, from: new Date(e.target.value) })}
      />
      <span className="text-muted-foreground">to</span>
      <input
        type="date"
        className="border rounded-md px-2 py-1 text-sm bg-background"
        value={value.to.toISOString().split('T')[0]}
        onChange={(e) => onChange({ ...value, to: new Date(e.target.value) })}
      />
    </div>
  );
};