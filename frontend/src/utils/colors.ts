import { COMMIT_TYPE_COLORS, TECH_CATEGORY_COLORS } from '@shared/constants/index';

/**
 * Get color hex string for a commit type.
 */
export function getCommitTypeColor(type: string): string {
  return COMMIT_TYPE_COLORS[type] ?? COMMIT_TYPE_COLORS['other'] ?? '#9ca3af';
}

/**
 * Get Tailwind-compatible bg class for commit type.
 */
export function getCommitTypeBgClass(type: string): string {
  const map: Record<string, string> = {
    feat: 'bg-indigo-500',
    fix: 'bg-red-500',
    refactor: 'bg-amber-500',
    docs: 'bg-blue-500',
    style: 'bg-violet-500',
    chore: 'bg-gray-500',
    test: 'bg-emerald-500',
    perf: 'bg-orange-500',
    other: 'bg-gray-400',
  };
  return map[type] ?? map['other'];
}

/**
 * Get color hex string for a tech category.
 */
export function getTechCategoryColor(category: string): string {
  return TECH_CATEGORY_COLORS[category] ?? TECH_CATEGORY_COLORS['other'] ?? '#6b7280';
}

/**
 * Get Tailwind-compatible bg/text classes for a tech category.
 */
export function getTechCategoryClasses(category: string): string {
  const map: Record<string, string> = {
    language: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    framework: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    library: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    database: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    tool: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    runtime: 'bg-red-500/20 text-red-400 border-red-500/30',
    other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return map[category] ?? map['other'];
}

/**
 * Get color for file change status.
 */
export function getFileStatusColor(status: string): string {
  const map: Record<string, string> = {
    added: 'text-emerald-400',
    modified: 'text-amber-400',
    deleted: 'text-red-400',
    renamed: 'text-blue-400',
  };
  return map[status] ?? 'text-gray-400';
}

export function getFileStatusBgColor(status: string): string {
  const map: Record<string, string> = {
    added: 'bg-emerald-500/10',
    modified: 'bg-amber-500/10',
    deleted: 'bg-red-500/10',
    renamed: 'bg-blue-500/10',
  };
  return map[status] ?? 'bg-gray-500/10';
}
