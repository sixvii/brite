import { useState } from 'react';
import { cn } from '@/lib/utils';

interface EventFiltersProps {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

const filters = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This Weekend' },
];

const EventFilters = ({ onFilterChange, activeFilter }: EventFiltersProps) => {
  return (
    <div className="flex items-center gap-4 py-4">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'text-[14.5px] font-medium transition-colors py-2 px-1',
            activeFilter === filter.id
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default EventFilters;