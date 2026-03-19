import type { ErdTable } from '@/types';

interface ErdTableDetailProps {
  table: ErdTable;
  onClose: () => void;
}

export default function ErdTableDetail({ table, onClose }: ErdTableDetailProps) {
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-100">{table.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors p-1"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Column cards grid */}
      <div className="p-5">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          컬럼 ({table.columns.length})
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {table.columns.map((col) => {
            const constraints: string[] = [];
            if (col.isPrimaryKey) constraints.push('PK');
            if (col.isForeignKey) constraints.push('FK');
            if (!col.isNullable) constraints.push('NOT NULL');
            if (col.defaultValue) constraints.push(`DEFAULT: ${col.defaultValue}`);

            return (
              <div
                key={col.name}
                className="card p-3 flex items-center gap-3"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {col.isPrimaryKey ? (
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : col.isForeignKey ? (
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                      <span className="w-2 h-2 bg-gray-500 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-gray-200">{col.name}</span>
                    <span className="text-xs font-mono text-gray-500">{col.type}</span>
                  </div>
                  {constraints.length > 0 && (
                    <div className="flex gap-1.5 mt-1">
                      {constraints.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {col.relationTo && (
                    <p className="text-xs text-blue-400 mt-1">
                      -&gt; {col.relationTo}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
