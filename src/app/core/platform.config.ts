import type { GlobalConfig } from '@praxisui/core';

export const PRAXIS_API_ORIGIN = 'https://praxis-api-quickstart.onrender.com';
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
