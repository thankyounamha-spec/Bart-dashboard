import { useState } from 'react';
import Modal from '../common/Modal';
import { useProjectStore } from '@/store/useProjectStore';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddProjectModal({ isOpen, onClose }: AddProjectModalProps) {
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addProject = useProjectStore((s) => s.addProject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!path.trim()) {
      setError('프로젝트 경로를 입력해주세요');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addProject(path.trim(), name.trim() || undefined);
      setPath('');
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트를 추가할 수 없습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPath('');
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="프로젝트 추가">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Path input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            프로젝트 경로 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/Users/me/projects/my-app"
            className="input-field font-mono text-sm"
            disabled={submitting}
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500">
            Git 저장소가 있는 프로젝트의 절대 경로를 입력하세요
          </p>
        </div>

        {/* Name input (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            프로젝트 이름 <span className="text-gray-600">(선택)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="폴더 이름이 기본값으로 사용됩니다"
            className="input-field text-sm"
            disabled={submitting}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary text-sm"
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn-primary text-sm"
            disabled={submitting || !path.trim()}
          >
            {submitting ? '추가 중...' : '추가하기'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
