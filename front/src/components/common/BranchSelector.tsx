import React from 'react';

interface BranchSelectorProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({ value, onChange, placeholder = 'Select Branch' }) => {
  // يمكنك استبدال هذه القائمة باستدعاء API للفروع إذا متوفرة
  return (
    <select
      className="border rounded-md px-3 py-2 text-sm bg-background"
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? e.target.value : undefined)}
    >
      <option value="">{placeholder}</option>
      <option value="branch-1">Main Branch</option>
      <option value="branch-2">Second Branch</option>
    </select>
  );
};