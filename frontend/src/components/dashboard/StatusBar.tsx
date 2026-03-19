import type { LoadingState } from '@/types';

interface SectionStatus {
  name: string;
  state: LoadingState;
  error: string | null;
}

interface StatusBarProps {
  sections: SectionStatus[];
  wsConnected: boolean;
  lastSyncTime: string | null;
}

export default function StatusBar({ sections, wsConnected, lastSyncTime }: StatusBarProps) {
  const hasError = sections.some(s => s.state === 'error');
  const allLoaded = sections.every(s => s.state === 'success' || s.state === 'idle');
  const isLoading = sections.some(s => s.state === 'loading');

  const statusIcon = hasError ? '!' : isLoading ? '...' : '✓';
  const statusColor = hasError ? 'text-red-400' : isLoading ? 'text-amber-400' : 'text-green-400';
  const bgColor = hasError ? 'bg-red-500/5 border-red-500/20' : isLoading ? 'bg-amber-500/5 border-amber-500/20' : 'bg-green-500/5 border-green-500/20';

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 text-[11px] border-t ${bgColor} flex-shrink-0 print:hidden`}>
      {/* Overall status */}
      <span className={`font-bold ${statusColor}`}>{statusIcon}</span>

      {/* Section indicators */}
      <div className="flex items-center gap-1.5">
        {sections.map((s) => {
          let dotColor = 'bg-gray-600';
          let title = `${s.name}: 대기`;
          if (s.state === 'loading') { dotColor = 'bg-amber-400 animate-pulse'; title = `${s.name}: 로딩 중`; }
          else if (s.state === 'success') { dotColor = 'bg-green-400'; title = `${s.name}: 정상`; }
          else if (s.state === 'error') { dotColor = 'bg-red-400'; title = `${s.name}: 오류 - ${s.error ?? ''}`; }
          return (
            <div key={s.name} className="flex items-center gap-0.5 group relative">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              <span className="text-gray-500">{s.name}</span>
              {s.state === 'error' && s.error && (
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
                  <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-red-300 whitespace-nowrap shadow-lg">
                    {s.error}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <span className="text-gray-700 mx-1">|</span>

      {/* WebSocket status */}
      <div className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
        <span className="text-gray-500">{wsConnected ? '실시간' : '연결 끊김'}</span>
      </div>

      {/* Last sync time */}
      {lastSyncTime && (
        <>
          <span className="text-gray-700 mx-1">|</span>
          <span className="text-gray-500">
            마지막 동기화: {formatTime(lastSyncTime)}
          </span>
        </>
      )}

      {/* Summary on right */}
      <div className="ml-auto text-gray-500">
        {allLoaded && !hasError ? '모든 섹션 정상' :
         hasError ? `${sections.filter(s => s.state === 'error').length}개 섹션 오류` :
         '데이터 로딩 중...'}
      </div>
    </div>
  );
}
