import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // 启用类型感知规则（ESLint v9 + typescript-eslint 支持）
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // 与 Vercel 构建严格度对齐
      '@typescript-eslint/no-explicit-any': 'error',
      // 这些为类型感知规则，可发现潜在的隐患
      // 对于已添加注释说明的 any 使用，允许通过 eslint-disable 抑制警告
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
    },
  },
];

export default eslintConfig;
