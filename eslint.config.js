import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // supabase/functions é código Deno (Edge Functions), fora do bundle do jogo.
    ignores: ['dist', 'node_modules', 'coverage', 'supabase/functions'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
