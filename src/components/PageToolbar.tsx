import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface PageToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export default function PageToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
}: PageToolbarProps) {
  return (
    <div className="table-toolbar">
      <div className="table-search">
        <Search size={16} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}
