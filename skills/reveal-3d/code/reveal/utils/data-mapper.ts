/**
 * Data Mapper Utilities
 * Unwraps CDF's nested property structure to flat application types
 */

import type { CDFNode, ViewId } from './cdf-types';

/**
 * Unwraps properties from a CDF node for a specific view.
 * CDF nests properties as: properties[space][view/version]
 * This function flattens them to: { space, externalId, ...properties }
 *
 * @example
 * const batch = unwrapProperties<Batch>(cdfBatch, BATCH_VIEW);
 * const material = unwrapProperties<Material>(cdfMaterial, MATERIAL_VIEW);
 */
export function unwrapProperties<
  T extends { space: string; externalId: string },
>(node: CDFNode, view: ViewId): T {
  const props: Record<string, unknown> = {};

  if (node.properties) {
    const spaceProps = node.properties[view.space] as
      | Record<string, unknown>
      | undefined;
    if (spaceProps) {
      const viewKey = `${view.externalId}/${view.version}`;
      const viewProps = spaceProps[viewKey] as
        | Record<string, unknown>
        | undefined;
      if (viewProps) {
        Object.assign(props, viewProps);
      }
    }
  }

  return {
    space: node.space,
    externalId: node.externalId,
    ...props,
  } as T;
}

/**
 * Unwraps an array of CDF nodes
 *
 * @example
 * const batches = unwrapPropertiesArray<Batch>(cdfBatches, BATCH_VIEW);
 */
export function unwrapPropertiesArray<
  T extends { space: string; externalId: string },
>(nodes: CDFNode[], view: ViewId): T[] {
  return nodes.map((node) => unwrapProperties<T>(node, view));
}
