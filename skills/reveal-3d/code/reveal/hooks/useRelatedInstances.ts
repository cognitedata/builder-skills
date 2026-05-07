import { useQuery } from '@tanstack/react-query';
import type { DMInstanceRef } from '@cognite/reveal';
import type { ViewDefinition, ViewReference } from '@cognite/sdk';
import { useRevealContext } from './useRevealContext';
import {
  COGNITE_VISUALIZABLE_VIEW,
  COGNITE_3D_OBJECT_VIEW,
} from '../utils/views';

type DmsUniqueIdentifier = {
  space: string;
  externalId: string;
};

export function use3dRelatedEdgeConnections(instance: DMInstanceRef) {
  const { sdk } = useRevealContext();
  return useQuery({
    queryKey: ['3d-related-edges', instance.space, instance.externalId],
    queryFn: async (): Promise<DMInstanceRef[]> => {
      try {
        // Query for nodes connected via edges that have 3D data
        const response = await sdk.instances.query({
          with: {
            start_instance: {
              nodes: {
                filter: {
                  and: [
                    {
                      equals: {
                        property: ['node', 'externalId'],
                        value: instance.externalId,
                      },
                    },
                    {
                      equals: {
                        property: ['node', 'space'],
                        value: instance.space,
                      },
                    },
                  ],
                },
              },
              limit: 1,
            },
            start_to_object_edges: {
              edges: {
                from: 'start_instance',
                maxDistance: 1,
                direction: 'outwards',
              },
              limit: 1000,
            },
            objects_connected_with_3d: {
              nodes: {
                from: 'start_to_object_edges',
                chainTo: 'destination',
                filter: {
                  exists: {
                    property: [
                      COGNITE_VISUALIZABLE_VIEW.space,
                      COGNITE_VISUALIZABLE_VIEW.externalId,
                      'object3D',
                    ],
                  },
                },
              },
            },
            object_3ds: {
              nodes: {
                from: 'objects_connected_with_3d',
                through: {
                  view: { type: 'view', ...COGNITE_VISUALIZABLE_VIEW },
                  identifier: 'object3D',
                },
              },
              limit: 1000,
            },
          },
          select: {
            start_instance: {},
            start_to_object_edges: {},
            objects_connected_with_3d: {},
            object_3ds: {},
          },
        });

        // Return the instances that are connected to 3D objects
        return (
          response.items?.objects_connected_with_3d?.map((node) => ({
            space: node.space,
            externalId: node.externalId,
          })) ?? []
        );
      } catch (error) {
        console.error('Error fetching related edge connections:', error);
        return [];
      }
    },
    enabled: !!sdk,
  });
}

export function use3dRelatedDirectConnections(instance: DMInstanceRef) {
  const { sdk } = useRevealContext();
  return useQuery({
    queryKey: ['3d-related-direct', instance.space, instance.externalId],
    queryFn: async (): Promise<DMInstanceRef[]> => {
      try {
        // Step 1: Inspect the instance to find its views
        const views = await sdk.instances.inspect({
          inspectionOperations: { involvedViews: {} },
          items: [
            {
              instanceType: 'node',
              externalId: instance.externalId,
              space: instance.space,
            },
          ],
        });
        const view = views.items[0]?.inspectionResults?.involvedViews?.[0];

        // Step 2: Get the instance content with its views
        const instanceResponse = await sdk.instances.retrieve({
          items: [
            {
              instanceType: 'node',
              externalId: instance.externalId,
              space: instance.space,
            },
          ],
          sources: view ? [{ source: view }] : undefined,
        });

        const instanceContent = instanceResponse.items[0];
        if (!instanceContent?.properties) {
          return [];
        }

        // Step 3: Extract all direct relation properties
        const directlyRelatedObjects = Object.values(
          instanceContent.properties
        ).flatMap((spaceScope) => {
          if (typeof spaceScope !== 'object' || !spaceScope) return [];
          return Object.values(spaceScope).flatMap((fieldValues) => {
            if (typeof fieldValues !== 'object' || !fieldValues) return [];
            return Object.values(fieldValues).filter(
              (value): value is DmsUniqueIdentifier =>
                typeof value === 'object' &&
                'externalId' in value &&
                'space' in value &&
                typeof value.externalId === 'string' &&
                typeof value.space === 'string'
            );
          });
        });

        if (directlyRelatedObjects.length === 0) {
          return [];
        }

        // Step 4: Inspect all related objects to get their views
        const relatedObjectInspectionsResult = await sdk.instances.inspect({
          inspectionOperations: { involvedViews: {} },
          items: directlyRelatedObjects.map((fdmId) => ({
            ...fdmId,
            instanceType: 'node',
          })),
        });

        const relatedObjectsViewLists =
          relatedObjectInspectionsResult.items.map(
            (item) => item.inspectionResults?.involvedViews ?? []
          );

        // Step 5: Create a mapping of object index to views
        const relatedObjectViewsWithObjectIndex = relatedObjectsViewLists
          .map((viewList, idx) => viewList.map((view) => [idx, view] as const))
          .flat();

        // Step 6: Deduplicate views and fetch their definitions
        const [deduplicatedViews, viewToDeduplicatedIndexMap] =
          createDeduplicatedViewToIndexMap(relatedObjectViewsWithObjectIndex);

        const viewProps = await sdk.views.retrieve(
          deduplicatedViews.map((view) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { type, ...viewWithoutType } = view;
            return viewWithoutType;
          }),
          { includeInheritedProperties: true }
        );

        // Step 7: Filter to only 3D-related views
        const threeDRelatedViews = relatedObjectViewsWithObjectIndex.filter(
          ([, view]) => {
            const viewResultIndex = viewToDeduplicatedIndexMap.get(
              createViewKey(view)
            );
            if (viewResultIndex === undefined) return false;

            const propsForView = viewProps.items[viewResultIndex];
            return is3dView(propsForView);
          }
        );

        // Step 8: Return the 3D-related instances
        return threeDRelatedViews.map(([idx]) => directlyRelatedObjects[idx]);
      } catch (error) {
        console.error('Error fetching related direct connections:', error);
        return [];
      }
    },
    enabled: !!sdk,
  });
}

// Helper functions

type ViewKey = `${string}/${string}/${string}`;

function createViewKey(source: ViewReference): ViewKey {
  return `${source.externalId}/${source.space}/${source.version}`;
}

function createDeduplicatedViewToIndexMap(
  viewsWithObjectIndex: Array<readonly [number, ViewReference]>
): [Array<ViewReference>, Map<ViewKey, number>] {
  const deduplicatedViews: Array<ViewReference> = [];
  const viewToDeduplicatedIndexMap = new Map<ViewKey, number>();
  viewsWithObjectIndex.forEach(([, view]) => {
    const viewKey = createViewKey(view);
    if (!viewToDeduplicatedIndexMap.has(viewKey)) {
      viewToDeduplicatedIndexMap.set(viewKey, deduplicatedViews.length);
      deduplicatedViews.push(view);
    }
  });
  return [deduplicatedViews, viewToDeduplicatedIndexMap];
}

/**
 * Check if a view is 3D-related by checking if it implements Cognite3DObject
 */
function is3dView(view: ViewDefinition): boolean {
  return (view.implements ?? []).some(
    (type) =>
      type.externalId === COGNITE_3D_OBJECT_VIEW.externalId &&
      type.space === COGNITE_3D_OBJECT_VIEW.space &&
      type.version === COGNITE_3D_OBJECT_VIEW.version
  );
}
