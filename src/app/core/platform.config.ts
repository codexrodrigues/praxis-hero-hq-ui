import type { GlobalConfig } from '@praxisui/core';

const isBrowser = typeof window !== 'undefined';
const isLocalhost =
  isBrowser &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const PRAXIS_API_ORIGIN = isLocalhost
  ? ''
  : 'https://praxis-api-quickstart.onrender.com';
export const PRAXIS_API_BASE_URL = `${PRAXIS_API_ORIGIN}/api`;

export const GLOBAL_CONFIG_SEED: Partial<GlobalConfig> = {
  crud: {
    defaults: {
      openMode: 'modal',
    },
  },
  dynamicFields: {
    asyncSelect: { loadOn: 'open' },
    cascade: { enable: true, loadOnChange: 'respectLoadOn', debounceMs: 250 },
  },
  table: {
    appearance: {
      density: 'comfortable',
      spacing: {
        cellPadding: '10px 16px',
        headerPadding: '12px 16px',
      },
      typography: {
        fontSize: '14px',
        headerFontSize: '12px',
      },
    },
    filteringUi: {
      advancedOpenMode: 'drawer',
      overlayVariant: 'card',
      overlayBackdrop: true,
    },
  },
};
