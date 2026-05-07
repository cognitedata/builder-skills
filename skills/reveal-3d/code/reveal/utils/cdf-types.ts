/**
 * Core CDF Data Modeling Types
 * These are the base types used across the application for working with CDF data models.
 * They represent the raw structure of data returned from CDF APIs.
 */

/**
 * Reference to a view in the data model
 */
export type ViewId = {
  space: string;
  externalId: string;
  version: string;
};

/**
 * Base interface for CDF nodes representing the raw structure from CDF APIs.
 * CDF nests properties as: properties[space][view/version]
 */
export interface CDFNode {
  space: string;
  externalId: string;
  properties: Record<string, unknown>;
}
