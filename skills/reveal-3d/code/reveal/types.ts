import type { CogniteClient, Node3D } from '@cognite/sdk';
import type {
  CogniteCadModel,
  CognitePointCloudModel,
  DMInstanceRef,
  NodeAppearance,
  Cognite3DViewerOptions,
} from '@cognite/reveal';
import type * as THREE from 'three';

// Viewer Options - subset of Cognite3DViewerOptions
export type ViewerOptions = Pick<
  Cognite3DViewerOptions,
  'loadingIndicatorStyle' | 'antiAliasingHint' | 'ssaoQualityHint'
>;

// Geometry filter for partial model loading (matches Reveal SDK's GeometryFilter)
export interface RevealGeometryFilter {
  boundingBox: THREE.Box3;
  isBoundingBoxInModelCoordinates?: boolean;
}

// CAD Model Options
export interface AddCadResourceOptions {
  modelId: number;
  revisionId: number;
  styling?: {
    default?: {
      renderGhosted?: boolean;
      renderInFront?: boolean;
    };
  };
  geometryFilter?: RevealGeometryFilter;
}

export interface CadModelOptions {
  type: 'cad';
  modelId: number;
  revisionId: number;
}

// Tagged Resource Options
export type TaggedAddResourceOptions =
  | {
      type: 'cad';
      addOptions: AddCadResourceOptions;
    }
  | {
      type: 'pointcloud';
      addOptions: {
        modelId: number;
        revisionId: number;
      };
    };

// FDM Mappings
export interface ThreeDModelFdmMappings {
  modelId: number;
  revisionId: number;
  mappings: Map<string, Node3D[]>; // instanceKey (space:externalId) -> array of 3D nodes
}

// Styling
export interface FdmAssetStylingGroup {
  fdmAssetExternalIds: DMInstanceRef[];
  style: {
    cad?: NodeAppearance;
    pointcloud?: NodeAppearance;
  };
}

export interface InstanceStylingGroup {
  fdmAssetExternalIds?: DMInstanceRef[];
  style: {
    cad?: NodeAppearance;
    pointcloud?: NodeAppearance;
  };
}

// Reveal Context Props
export interface RevealContextProps {
  children: React.ReactNode;
  sdk: CogniteClient;
  color?: THREE.Color;
  viewerOptions?: ViewerOptions;
  useCoreDm?: boolean;
}

// Model with type info
export type CogniteModel = CogniteCadModel | CognitePointCloudModel;
