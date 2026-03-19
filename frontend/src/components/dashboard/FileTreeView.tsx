import { useEffect, useState, useCallback } from 'react';
import type { FileTreeNode } from '@/types';
import { fetchFileTree } from '@/services/api';
import LoadingSkeleton from '../common/LoadingSkeleton';
import ErrorBanner from '../common/ErrorBanner';

interface FileTreeViewProps {
  projectId: string;
}

function getExtensionColor(ext?: string): string {
  if (!ext) return 'text-gray-400';
  const map: Record<string, string> = {
    ts: 'text-blue-400',
    tsx: 'text-blue-300',
    js: 'text-yellow-400',
    jsx: 'text-yellow-300',
    json: 'text-green-400',
    md: 'text-gray-300',
    css: 'text-pink-400',
    scss: 'text-pink-300',
    html: 'text-orange-400',
    py: 'text-emerald-400',
    go: 'text-cyan-400',
    rs: 'text-orange-300',
    sql: 'text-violet-400',
    yml: 'text-red-300',
    yaml: 'text-red-300',
    prisma: 'text-indigo-300',
  };
  return map[ext] ?? 'text-gray-400';
}

function TreeNode({ node, depth }: { node: FileTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);

  const isDir = node.type === 'directory';
  const paddingLeft = depth * 16 + 4;

  return (
    <div>
      <button
        onClick={() => isDir && setExpanded(!expanded)}
        className={`flex items-center gap-1.5 w-full text-left py-0.5 text-xs hover:bg-gray-700/30 dark:hover:bg-gray-700/30 rounded transition-colors ${
          isDir ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {isDir ? (
          <span className="text-gray-500 w-3 text-center flex-shrink-0">
            {expanded ? '▼' : '▶'}
          </span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className={isDir ? 'text-amber-400' : getExtensionColor(node.extension)}>
          {isDir ? '📁' : '📄'}
        </span>
        <span className={`truncate ${isDir ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
          {node.name}
        </span>
      </button>
      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode key={`${child.path}-${idx}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTreeView({ projectId }: FileTreeViewProps) {
  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFileTree(projectId)
      .then((data) => {
        setTree(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '파일 트리를 불러올 수 없습니다');
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">프로젝트 구조</h3>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {collapsed ? '펼치기' : '접기'}
        </button>
      </div>

      {!collapsed && (
        <>
          {loading && <LoadingSkeleton variant="block" />}
          {error && <ErrorBanner message={error} onRetry={load} />}
          {!loading && !error && tree.length === 0 && (
            <p className="text-xs text-gray-500 py-2">파일이 없습니다</p>
          )}
          {!loading && !error && tree.length > 0 && (
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {tree.map((node, idx) => (
                <TreeNode key={`${node.path}-${idx}`} node={node} depth={0} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
