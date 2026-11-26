import jsxA11y from 'eslint-plugin-jsx-a11y';
import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  // 접근성: 키보드·스크린리더로 쓸 수 없는 마크업을 lint에서 잡는다
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      // u 플래그가 있어야 정규식 오타(짝 없는 { 등)가 문법 오류로 잡힘 (트러블 #30)
      'require-unicode-regexp': 'error',
      // 아키텍처 규칙을 지침이 아니라 lint로 강제 (.claude/rules/code-style.md)
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@fitfoyo/database',
              message: 'web은 DB에 직접 닿지 않습니다(BFF). 데이터는 apps/api를 거쳐 받으세요.',
            },
            {
              name: '@prisma/client',
              message: 'web은 DB에 직접 닿지 않습니다(BFF). 데이터는 apps/api를 거쳐 받으세요.',
            },
          ],
          patterns: [
            {
              group: ['@fitfoyo/database/*', '**/apps/api/**', '**/api/src/**'],
              message: '앱끼리 직접 import하지 않습니다. 공유 코드는 packages/*로 옮기세요.',
            },
          ],
        },
      ],
    },
  },
];
