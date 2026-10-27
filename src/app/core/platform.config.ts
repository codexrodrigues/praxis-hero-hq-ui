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
      borders: {
        showRowBorders: true,
        showColumnBorders: false,
        showOuterBorder: true,
      },
      elevation: {
        level: 0,
        shadowColor: 'transparent',
      },
      spacing: {
        cellPadding: '10px 16px',
        headerPadding: '12px 16px',
      },
      typography: {
        fontSize: '14px',
        headerFontSize: '12px',
      },
    },
    toolbar: {
      visible: true,
      position: 'top',
      filters: {
        enabled: true,
        showAdvancedButton: true,
      },
    },
    actions: {
      row: {
        enabled: true,
        position: 'end',
        display: 'icons',
        trigger: 'always',
      },
      bulk: {
        enabled: true,
        position: 'both',
      },
    },
    behavior: {
      pagination: {
        enabled: true,
        pageSize: 10,
        pageSizeOptions: [5, 10, 25, 50, 100],
        showFirstLastButtons: true,
        strategy: 'server',
      },
      sorting: {
        enabled: true,
        strategy: 'server',
        multiSort: false,
        showSortIndicators: true,
        allowClearSort: true,
      },
      resizing: {
        enabled: true,
      },
      selection: {
        type: 'multiple',
        mode: 'checkbox',
        allowSelectAll: true,
        checkboxPosition: 'start',
        persistSelection: true,
        persistOnDataUpdate: false,
        visual: {
          highlightSelected: true,
          showSelectionCount: true,
        },
      },
      filtering: {
        enabled: true,
        strategy: 'server',
        debounceTime: 300,
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          settings: {
            inline: true,
            useInlineSearchableSelectVariant: true,
          },
        },
      },
      expansion: {
        enabled: false,
        source: 'schema',
      },
    },
    filteringUi: {
      advancedOpenMode: 'drawer',
      overlayVariant: 'card',
      overlayBackdrop: true,
    },
    localization: {
      locale: 'pt-BR',
      direction: 'ltr',
      currency: {
        code: 'BRL',
        symbol: 'R$',
        position: 'before',
        spacing: true,
        precision: 2,
      },
    },
  },
};


