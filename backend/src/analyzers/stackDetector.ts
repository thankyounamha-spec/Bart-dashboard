import fs from 'node:fs/promises';
import path from 'node:path';
import type { TechStack, TechStackResult, TechCategory, TechSource } from '../types/index.js';
import { logger } from '../utils/logger.js';

/** 알려진 설정 파일과 그에 대응하는 기술 스택 매핑 */
const CONFIG_FILE_MAP: Record<string, { name: string; category: TechCategory }> = {
  'tsconfig.json': { name: 'TypeScript', category: 'language' },
  '.eslintrc': { name: 'ESLint', category: 'tool' },
  '.eslintrc.js': { name: 'ESLint', category: 'tool' },
  '.eslintrc.json': { name: 'ESLint', category: 'tool' },
  '.eslintrc.cjs': { name: 'ESLint', category: 'tool' },
  'eslint.config.js': { name: 'ESLint', category: 'tool' },
  'eslint.config.mjs': { name: 'ESLint', category: 'tool' },
  '.prettierrc': { name: 'Prettier', category: 'tool' },
  '.prettierrc.json': { name: 'Prettier', category: 'tool' },
  'prettier.config.js': { name: 'Prettier', category: 'tool' },
  'tailwind.config.js': { name: 'Tailwind CSS', category: 'framework' },
  'tailwind.config.ts': { name: 'Tailwind CSS', category: 'framework' },
  'tailwind.config.cjs': { name: 'Tailwind CSS', category: 'framework' },
  'postcss.config.js': { name: 'PostCSS', category: 'tool' },
  'postcss.config.cjs': { name: 'PostCSS', category: 'tool' },
  'vite.config.ts': { name: 'Vite', category: 'tool' },
  'vite.config.js': { name: 'Vite', category: 'tool' },
  'next.config.js': { name: 'Next.js', category: 'framework' },
  'next.config.mjs': { name: 'Next.js', category: 'framework' },
  'nuxt.config.ts': { name: 'Nuxt', category: 'framework' },
  'jest.config.js': { name: 'Jest', category: 'tool' },
  'jest.config.ts': { name: 'Jest', category: 'tool' },
  'vitest.config.ts': { name: 'Vitest', category: 'tool' },
  'vitest.config.js': { name: 'Vitest', category: 'tool' },
  '.babelrc': { name: 'Babel', category: 'tool' },
  'babel.config.js': { name: 'Babel', category: 'tool' },
  'webpack.config.js': { name: 'Webpack', category: 'tool' },
  'Dockerfile': { name: 'Docker', category: 'tool' },
  'docker-compose.yml': { name: 'Docker Compose', category: 'tool' },
  'docker-compose.yaml': { name: 'Docker Compose', category: 'tool' },
  '.dockerignore': { name: 'Docker', category: 'tool' },
  'requirements.txt': { name: 'Python', category: 'language' },
  'pyproject.toml': { name: 'Python', category: 'language' },
  'setup.py': { name: 'Python', category: 'language' },
  'Pipfile': { name: 'Pipenv', category: 'tool' },
  'pom.xml': { name: 'Maven', category: 'tool' },
  'build.gradle': { name: 'Gradle', category: 'tool' },
  'build.gradle.kts': { name: 'Gradle (Kotlin)', category: 'tool' },
  'Cargo.toml': { name: 'Rust', category: 'language' },
  'go.mod': { name: 'Go', category: 'language' },
  'Gemfile': { name: 'Ruby', category: 'language' },
};

/** package.json 의존성에서 잘 알려진 라이브러리 감지 */
const KNOWN_PACKAGES: Record<string, { name: string; category: TechCategory }> = {
  'react': { name: 'React', category: 'framework' },
  'react-dom': { name: 'React DOM', category: 'framework' },
  'next': { name: 'Next.js', category: 'framework' },
  'vue': { name: 'Vue.js', category: 'framework' },
  'nuxt': { name: 'Nuxt', category: 'framework' },
  'angular': { name: 'Angular', category: 'framework' },
  '@angular/core': { name: 'Angular', category: 'framework' },
  'svelte': { name: 'Svelte', category: 'framework' },
  'express': { name: 'Express', category: 'framework' },
  'fastify': { name: 'Fastify', category: 'framework' },
  'koa': { name: 'Koa', category: 'framework' },
  'nestjs': { name: 'NestJS', category: 'framework' },
  '@nestjs/core': { name: 'NestJS', category: 'framework' },
  'prisma': { name: 'Prisma', category: 'library' },
  '@prisma/client': { name: 'Prisma', category: 'library' },
  'typeorm': { name: 'TypeORM', category: 'library' },
  'sequelize': { name: 'Sequelize', category: 'library' },
  'mongoose': { name: 'Mongoose', category: 'library' },
  'drizzle-orm': { name: 'Drizzle ORM', category: 'library' },
  'tailwindcss': { name: 'Tailwind CSS', category: 'framework' },
  'axios': { name: 'Axios', category: 'library' },
  'lodash': { name: 'Lodash', category: 'library' },
  'zod': { name: 'Zod', category: 'library' },
  'joi': { name: 'Joi', category: 'library' },
  'redux': { name: 'Redux', category: 'library' },
  '@reduxjs/toolkit': { name: 'Redux Toolkit', category: 'library' },
  'zustand': { name: 'Zustand', category: 'library' },
  'mobx': { name: 'MobX', category: 'library' },
  'jest': { name: 'Jest', category: 'tool' },
  'vitest': { name: 'Vitest', category: 'tool' },
  'mocha': { name: 'Mocha', category: 'tool' },
  'cypress': { name: 'Cypress', category: 'tool' },
  'playwright': { name: 'Playwright', category: 'tool' },
  '@playwright/test': { name: 'Playwright', category: 'tool' },
  'storybook': { name: 'Storybook', category: 'tool' },
  'webpack': { name: 'Webpack', category: 'tool' },
  'vite': { name: 'Vite', category: 'tool' },
  'esbuild': { name: 'esbuild', category: 'tool' },
  'typescript': { name: 'TypeScript', category: 'language' },
  'pg': { name: 'PostgreSQL', category: 'database' },
  'mysql2': { name: 'MySQL', category: 'database' },
  'better-sqlite3': { name: 'SQLite', category: 'database' },
  'sqlite3': { name: 'SQLite', category: 'database' },
  'redis': { name: 'Redis', category: 'database' },
  'ioredis': { name: 'Redis', category: 'database' },
  'mongodb': { name: 'MongoDB', category: 'database' },
};

/** 파일 확장자에서 언어 감지 */
const EXTENSION_MAP: Record<string, { name: string; category: TechCategory }> = {
  '.ts': { name: 'TypeScript', category: 'language' },
  '.tsx': { name: 'TypeScript (JSX)', category: 'language' },
  '.js': { name: 'JavaScript', category: 'language' },
  '.jsx': { name: 'JavaScript (JSX)', category: 'language' },
  '.py': { name: 'Python', category: 'language' },
  '.java': { name: 'Java', category: 'language' },
  '.kt': { name: 'Kotlin', category: 'language' },
  '.rs': { name: 'Rust', category: 'language' },
  '.go': { name: 'Go', category: 'language' },
  '.rb': { name: 'Ruby', category: 'language' },
  '.php': { name: 'PHP', category: 'language' },
  '.cs': { name: 'C#', category: 'language' },
  '.swift': { name: 'Swift', category: 'language' },
  '.dart': { name: 'Dart', category: 'language' },
};

/**
 * 프로젝트 디렉토리를 분석하여 사용 기술 스택을 감지
 * package.json, 설정 파일, 락 파일, 확장자 등을 종합적으로 분석
 */
export async function detectTechStack(projectPath: string): Promise<TechStackResult> {
  logger.debug(`기술 스택 감지 시작: ${projectPath}`);

  const stacks: TechStack[] = [];
  // 중복 방지를 위한 이름 추적
  const seenNames = new Set<string>();

  function addStack(name: string, version: string | null, category: TechCategory, source: TechSource, sourceFile: string): void {
    if (seenNames.has(name)) return;
    seenNames.add(name);
    stacks.push({ name, version, category, source, sourceFile });
  }

  // 1. package.json 분석 (루트 + 하위 디렉토리)
  // 모노레포나 frontend/backend 분리 구조에서도 기술 스택을 감지하기 위해
  // 루트와 주요 하위 디렉토리의 package.json을 모두 검색
  const pkgSearchDirs = [projectPath];
  try {
    const rootEntries = await fs.readdir(projectPath, { withFileTypes: true });
    for (const entry of rootEntries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        pkgSearchDirs.push(path.join(projectPath, entry.name));
      }
    }
  } catch { /* 디렉토리 읽기 실패 무시 */ }

  for (const dir of pkgSearchDirs) {
    const relativePkgPath = path.relative(projectPath, path.join(dir, 'package.json')) || 'package.json';
    try {
      const pkgPath = path.join(dir, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);

      // Node.js 런타임 감지
      addStack('Node.js', pkg.engines?.node || null, 'runtime', 'packageJson', relativePkgPath);

      // dependencies + devDependencies 병합 분석
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [depName, depVersion] of Object.entries(allDeps)) {
        const known = KNOWN_PACKAGES[depName];
        if (known) {
          const version = typeof depVersion === 'string' ? depVersion.replace(/^[\^~]/, '') : null;
          addStack(known.name, version, known.category, 'packageJson', relativePkgPath);
        }
      }
    } catch {
      // package.json이 없는 디렉토리는 정상
    }
  }

  // 2. 락 파일로 패키지 매니저 감지
  const lockFiles: Array<{ file: string; name: string }> = [
    { file: 'yarn.lock', name: 'Yarn' },
    { file: 'pnpm-lock.yaml', name: 'pnpm' },
    { file: 'package-lock.json', name: 'npm' },
    { file: 'bun.lockb', name: 'Bun' },
  ];

  for (const { file, name } of lockFiles) {
    try {
      await fs.access(path.join(projectPath, file));
      addStack(name, null, 'tool', 'lockFile', file);
    } catch {
      // 해당 락 파일 없음
    }
  }

  // 3. 설정 파일 감지 (루트 + 하위 디렉토리)
  for (const dir of pkgSearchDirs) {
    for (const [fileName, tech] of Object.entries(CONFIG_FILE_MAP)) {
      try {
        await fs.access(path.join(dir, fileName));
        const relPath = path.relative(projectPath, path.join(dir, fileName)) || fileName;
        addStack(tech.name, null, tech.category, 'configFile', relPath);
      } catch {
        // 해당 설정 파일 없음
      }
    }
  }

  // 4. 소스 파일 확장자로 언어 감지 (루트, src, 하위 디렉토리의 src)
  const dirsToScan = new Set([projectPath, path.join(projectPath, 'src')]);
  for (const dir of pkgSearchDirs) {
    dirsToScan.add(dir);
    dirsToScan.add(path.join(dir, 'src'));
  }
  const extensionsSeen = new Set<string>();

  for (const dir of dirsToScan) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext && EXTENSION_MAP[ext] && !extensionsSeen.has(ext)) {
            extensionsSeen.add(ext);
            const tech = EXTENSION_MAP[ext];
            addStack(tech.name, null, tech.category, 'fileExtension', entry.name);
          }
        }
      }
    } catch {
      // 디렉토리 읽기 실패 시 무시
    }
  }

  logger.info(`기술 스택 감지 완료: ${stacks.length}개 항목`);

  return {
    stacks,
    analyzedAt: new Date().toISOString(),
  };
}
