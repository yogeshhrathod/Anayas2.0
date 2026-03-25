import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
  DEFAULT_CODE_FONT_STACK,
  DEFAULT_UI_FONT_STACK,
} from '../../constants/fonts';

export function FontProvider({ children }: { children: React.ReactNode }) {
  const uiFontFamily = useStore(state => state.settings.uiFontFamily);
  const codeFontFamily = useStore(state => state.settings.codeFontFamily);

  useEffect(() => {
    // Use saved font if it exists and is not empty, otherwise use default
    const uiFontStack =
      uiFontFamily && typeof uiFontFamily === 'string' && uiFontFamily.trim().length > 0
        ? uiFontFamily.trim()
        : DEFAULT_UI_FONT_STACK;
    const codeFontStack =
      codeFontFamily && typeof codeFontFamily === 'string' && codeFontFamily.trim().length > 0
        ? codeFontFamily.trim()
        : DEFAULT_CODE_FONT_STACK;

    // Apply CSS variables
    document.documentElement.style.setProperty('--font-ui', uiFontStack);
    document.documentElement.style.setProperty('--font-code', codeFontStack);

    // Apply to body
    document.body.style.fontFamily = uiFontStack;

    let styleEl = document.getElementById(
      'dynamic-font-styles'
    ) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-font-styles';
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      :root {
        --font-ui: ${uiFontStack};
        --font-code: ${codeFontStack};
      }
      body, .font-sans {
        font-family: var(--font-ui) !important;
      }
      .font-mono, code, kbd, samp, pre, .monaco-editor, .monaco-mouse-cursor-text {
        font-family: var(--font-code) !important;
      }
    `;
  }, [uiFontFamily, codeFontFamily]);

  return <>{children}</>;
}
