export interface BentoDetailExpansionOptions {
  items: unknown[];
  maxExpandedRows?: number;
}

/**
 * Creates canonical metadata-driven configuration for row expansion detail in PraxisTable.
 * Encapsulates the ceremony of schemaContract, registry rendering, and interaction constraints.
 */
export function createBentoDetailExpansion(
  itemsOrOptions: unknown[] | BentoDetailExpansionOptions,
): Record<string, unknown> {
  const items = Array.isArray(itemsOrOptions) ? itemsOrOptions : itemsOrOptions.items;
  const maxExpandedRows = Array.isArray(itemsOrOptions)
    ? 1
    : (itemsOrOptions.maxExpandedRows ?? 1);

  return {
    enabled: true,
    contractVersion: '1.0.0',
    identity: { rowKeySource: 'table.idField', requireStableIdField: true },
    state: { mode: 'uncontrolled' },
    interaction: {
      trigger: 'icon',
      toggleOnRowClick: false,
    },
    limits: {
      allowMultiple: false,
      maxExpandedRows,
      onOverflow: 'collapseOldest',
    },
    detail: {
      schemaContract: {
        kind: 'praxis.detail.schema',
        version: '1.0.0',
        compat: 'semver',
        allowedNodes: [
          'card',
          'cardGrid',
          'value',
          'stack',
          'text',
          'icon',
          'badge',
          'metric',
          'progress',
          'compose',
          'timeline',
          'list',
          'tabs',
          'tab',
          'mediaBlock',
        ],
        sanitization: 'strict',
      },
      rendering: {
        strategy: 'registry',
        registryId: 'praxis.detail.default',
        rendererVersion: '1.0.0',
        fallbackNodePolicy: 'failClosed',
      },
      source: {
        mode: 'inline',
        inlineSchema: {
          layout: 'stack',
          items,
        },
      },
    },
  };
}
