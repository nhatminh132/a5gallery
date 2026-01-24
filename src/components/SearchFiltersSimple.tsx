import { Search, X } from 'lucide-react';

interface SearchFiltersSimpleProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function SearchFiltersSimple({
  searchQuery,
  onSearchChange,
}: SearchFiltersSimpleProps) {
  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by title, description, or image ID..."
        className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
      />
      {searchQuery && (
        <button
          onClick={handleClearSearch}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}