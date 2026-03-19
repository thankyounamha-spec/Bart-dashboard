import { useEffect, useState } from 'react';
import { fetchClaudeLogs } from '@/services/api';
import type { ClaudeLogResult } from '@/types';

export default function ClaudeLogCard({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<ClaudeLogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchClaudeLogs(projectId)
      .then((data) => { if (!cancelled) setLogs(data); })
      .catch(() => { if (!cancelled) setLogs(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="card p-4 space-y-2 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3" />
        <div className="h-3 bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  if (!logs || logs.conversations.length === 0) return null;

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}시간 전`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const visibleConvs = expanded ? logs.conversations : logs.conversations.slice(0, 3);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Claude 대화
        </h3>
        <span className="text-[10px] text-gray-600">
          {logs.totalConversations}개
        </span>
      </div>

      <div className="space-y-2">
        {visibleConvs.map((conv) => (
          <div key={conv.id} className="group">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 line-clamp-1">{conv.summary}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-600">{formatDate(conv.startedAt)}</span>
                  <span className="text-[10px] text-gray-600">{conv.messageCount}개 메시지</span>
                </div>
                {conv.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {conv.toolsUsed.slice(0, 4).map((tool) => (
                      <span key={tool} className="text-[9px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-300 font-mono">
                        {tool}
                      </span>
                    ))}
                    {conv.toolsUsed.length > 4 && (
                      <span className="text-[9px] text-gray-600">+{conv.toolsUsed.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {logs.conversations.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {expanded ? '접기' : `${logs.conversations.length - 3}개 더 보기`}
        </button>
      )}
    </div>
  );
}
