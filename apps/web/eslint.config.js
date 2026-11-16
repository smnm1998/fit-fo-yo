import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    rules: {
      // u 플래그가 있어야 정규식 오타(짝 없는 { 등)가 문법 오류로 잡힘 (트러블 #30)
      'require-unicode-regexp': 'error',
    },
  },
];
