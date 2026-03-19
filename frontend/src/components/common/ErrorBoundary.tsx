import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

// ============================================================
// 에러 경계 — 렌더링 에러 포착 + 오류 정보 복사 기능
// partners-dashboard에서 이식하여 TypeScript로 변환
// ============================================================

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ errorInfo: info });
    console.error('[Bart ErrorBoundary]', error, info?.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  handleCopy = (): void => {
    const { error, errorInfo } = this.state;
    const detail = [
      `[Bart Dashboard 오류 보고]`,
      `시간: ${new Date().toLocaleString('ko-KR')}`,
      `URL: ${window.location.href}`,
      `오류: ${error?.message || '알 수 없음'}`,
      `스택: ${error?.stack || '없음'}`,
      `컴포넌트: ${errorInfo?.componentStack || '없음'}`,
    ].join('\n');

    navigator.clipboard.writeText(detail).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, copied } = this.state;
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
          <div className="card p-8 max-w-md w-full text-center space-y-4">
            <div className="text-5xl">⚠</div>
            <h3 className="text-lg font-bold text-gray-100">페이지 로드 오류</h3>
            <p className="text-sm text-gray-400">
              {error?.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                className="btn-primary text-sm"
                onClick={this.handleRetry}
              >
                다시 시도
              </button>
              <button
                className="btn-secondary text-sm"
                onClick={this.handleCopy}
              >
                {copied ? '복사됨 ✓' : '오류 정보 복사'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
