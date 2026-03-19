import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

// ============================================================
// 토스트 알림 시스템 — partners-dashboard에서 이식
// API 에러, 성공 메시지 등을 하단에 팝업으로 표시
// 에러 토스트는 클릭 시 상세 정보 클립보드 복사
// ============================================================

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warn' | 'info';
  endpoint?: string;
  detail?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type'], duration?: number, endpoint?: string, detail?: string) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/** 전역 토스트 상태 관리 Provider */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    duration = 4000,
    endpoint = '',
    detail = '',
  ) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type, endpoint, detail }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

const TYPE_CONFIG = {
  success: { bg: 'bg-green-900/90', border: 'border-green-700', icon: '✓', textColor: 'text-green-200' },
  error:   { bg: 'bg-red-900/90', border: 'border-red-700', icon: '✗', textColor: 'text-red-200' },
  warn:    { bg: 'bg-amber-900/90', border: 'border-amber-700', icon: '⚠', textColor: 'text-amber-200' },
  info:    { bg: 'bg-blue-900/90', border: 'border-blue-700', icon: 'ℹ', textColor: 'text-blue-200' },
};

/** 토스트 표시 컨테이너 — 화면 하단 좌측 고정 */
export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // 전역 API 에러 이벤트 구독
  const { addToast } = useToast();
  useEffect(() => {
    function handleApiError(e: Event) {
      const detail = (e as CustomEvent).detail || {};
      if (detail.message) {
        addToast(detail.message, 'error', 5000, detail.endpoint, detail.fullDetail);
      }
    }
    window.addEventListener('bart:api-error', handleApiError);
    return () => window.removeEventListener('bart:api-error', handleApiError);
  }, [addToast]);

  const handleCopy = async (toast: Toast) => {
    const text = [
      `[Bart Dashboard 오류]`,
      `시간: ${new Date().toLocaleString('ko-KR')}`,
      `URL: ${window.location.href}`,
      `오류: ${toast.message}`,
      toast.endpoint ? `API: ${toast.endpoint}` : '',
      toast.detail ? `상세: ${toast.detail}` : '',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(toast.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard API 실패 시 무시
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.info;
        const isCopied = copiedId === t.id;
        return (
          <div
            key={t.id}
            className={`${cfg.bg} ${cfg.textColor} border ${cfg.border} rounded-lg px-4 py-3 shadow-xl backdrop-blur-sm flex items-start gap-3 animate-slide-in cursor-pointer group`}
            onClick={() => t.type === 'error' ? handleCopy(t) : removeToast(t.id)}
            title={t.type === 'error' ? '클릭하여 오류 정보 복사' : '클릭하여 닫기'}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.message}</p>
              {t.endpoint && (
                <p className="text-xs opacity-70 mt-0.5 font-mono truncate">{t.endpoint}</p>
              )}
              {t.type === 'error' && (
                <p className="text-[10px] opacity-50 mt-1">
                  {isCopied ? '복사됨 ✓' : '클릭하여 오류 정보 복사'}
                </p>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
              className="text-white/50 hover:text-white/80 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
