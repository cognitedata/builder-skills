/**
 * Core Data Model view constants
 * These reference the standard Cognite Core Data Model views
 */

import { ViewId } from './cdf-types';

/**
 * Core Data Model space constant
 */
export const CORE_DM_SPACE = 'cdf_cdm';

/**
 * Core Data Model version
 */
export const CORE_DM_VERSION = 'v1';

/**
 * View reference for CogniteAsset entities (from Core Data Model)
 */
export const ASSET_VIEW: ViewId = {
  space: CORE_DM_SPACE,
  externalId: 'CogniteAsset',
  version: CORE_DM_VERSION,
};

/**
 * View reference for Cognite3DObject entities (from Core Data Model)
 */
export const COGNITE_3D_OBJECT_VIEW: ViewId = {
  space: CORE_DM_SPACE,
  externalId: 'Cognite3DObject',
  version: CORE_DM_VERSION,
};

/**
 * View reference for CogniteCADNode entities (from Core Data Model)
 */
export const COGNITE_CAD_NODE_VIEW: ViewId = {
  space: CORE_DM_SPACE,
  externalId: 'CogniteCADNode',
  version: CORE_DM_VERSION,
};

/**
 * View reference for CogniteVisualizable entities (from Core Data Model)
 */
export const COGNITE_VISUALIZABLE_VIEW: ViewId = {
  space: CORE_DM_SPACE,
  externalId: 'CogniteVisualizable',
  version: CORE_DM_VERSION,
};

/**
 * View reference for Cognite3DModel entities (from Core Data Model)
 */
export const COGNITE_3D_MODEL_VIEW: ViewId = {
  space: CORE_DM_SPACE,
  externalId: 'Cognite3DModel',
  version: CORE_DM_VERSION,
};

/**
 * View reference for CogniteCADRevision entities (from Core Data Model)
 */
export const COGNITE_CAD_REVISION_VIEW: ViewId = {
  space: CORE_DM_SPACE,
  externalId: 'CogniteCADRevision',
  version: CORE_DM_VERSION,
};
