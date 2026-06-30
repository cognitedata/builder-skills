---
name: dm-limits-and-best-practices
description: "Reference skill for CDF write operations and concurrency control. Covers batching upsert/delete operations, avoiding 429s with QueuedTaskRunner, and the Semaphore utility. For reading data model instances, use the generated SDK (query-with-sdk skill) instead of calling instances.list/query/search directly. Triggers: 429 error, rate limit, batching, semaphore, QueuedTaskRunner, cdfTaskRunner, instances.upsert, instances.delete, concurrency, deadlock, write to CDF, upsert nodes."
allowed-tools: Read, Glob, Grep, Edit, Write
metadata:
  argument-hint: ""
---

# CDF Data Modeling: Write Operations, Concurrency & Best Practices

This is a reference skill for **write operations** (upsert, delete) and concurrency control when calling CDF APIs.

> **Reading data?** If a generated SDK exists under `src/generated_sdks/`, use it — call `sdk.queryViewName()`, `sdk.getByIdViewName()`, etc. Do not call `client.instances.list`, `client.instances.query`, or `client.instances.search` directly. See the **`query-with-sdk`** skill.

This skill owns runtime reliability concerns: limits, concurrency, retries, throughput, and batching behavior.
For traversal payload correctness and graph-specific failure signatures, see `dm-graph-traversal`.

---

## DMS Limits Reference

For the latest concurrency limits and resource limits, see:
**https://docs.cognite.com/cdf/dm/dm_reference/dm_limits_and_restrictions**

Key limits for write operations:
- Instance **apply** and **delete** operations each have their own concurrent request limits
- Exceeding these limits returns **429 Too Many Requests**
- `instances.upsert` accepts up to 1000 items per call

---

## QueuedTaskRunner (Semaphore)

**Always use the global `cdfTaskRunner`** to wrap CDF API calls. It limits concurrent requests and prevents 429 errors and deadlocks.

### Source Code

If the project does not already have a semaphore utility, create `src/shared/utils/semaphore.ts` with this implementation:

```typescript
/**
 * AbortError thrown when a queued task is cancelled
 */
export class AbortError extends Error {
  public constructor(message: string = 'Aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

type PendingTask<AsyncFn, AsyncFnResult> = {
  resolve: (result: AsyncFnResult) => void;
  reject: (error: unknown) => void;
  fn: AsyncFn;
  key?: string;
};

const DEFAULT_MAX_CONCURRENT_TASKS = 15;

/**
 * QueuedTaskRunner for controlling concurrent operations
 * Used to limit concurrent CDF API requests to avoid rate limiting and deadlocks
 * Essentially a semaphore that allows a limited number of tasks to run at once.
 */
export default class QueuedTaskRunner<
  AsyncFn extends () => Promise<AsyncFnResult>,
  AsyncFnResult = Awaited<ReturnType<AsyncFn>>,
> {
  private pendingTasks: PendingTask<AsyncFn, AsyncFnResult>[] = [];
  private currentPendingTasks: number = 0;
  private readonly maxConcurrentTasks: number = 1;

  public constructor(
    maxConcurrentTasks: number = DEFAULT_MAX_CONCURRENT_TASKS
  ) {
    this.maxConcurrentTasks = maxConcurrentTasks;
  }

  public schedule(
    fn: AsyncFn,
    options: { key?: string } = {}
  ): Promise<AsyncFnResult> {
    this.startTrackingTime();

    return new Promise((resolve, reject) => {
      if (options.key !== undefined) {
        // Cancel existing tasks with the same key (deduplication)
        this.pendingTasks
          .filter((task) => task.key === options.key)
          .forEach((task) => task.reject(new AbortError()));

        this.pendingTasks = this.pendingTasks.filter(
          (task) => task.key !== options.key
        );
      }

      this.pendingTasks.push({
        resolve,
        reject,
        fn,
        key: options.key,
      });

      this.attemptConsumingNextTask();
    });
  }

  public async attemptConsumingNextTask(): Promise<void> {
    if (this.pendingTasks.length === 0) return;
    if (this.currentPendingTasks >= this.maxConcurrentTasks) return;

    const pendingTask = this.pendingTasks.shift();
    if (pendingTask === undefined) {
      throw new Error('pendingTask is undefined, this should never happen');
    }

    this.currentPendingTasks++;
    const { fn, resolve, reject } = pendingTask;

    try {
      const result = await fn();
      resolve(result);
    } catch (e) {
      reject(e);
    } finally {
      this.currentPendingTasks--;
      this.tick();
      this.attemptConsumingNextTask();
    }
  }

  public clearQueue = (): void => {
    this.pendingTasks = [];
  };

  private startTime: number | null = null;

  private startTrackingTime = (): void => {
    if (this.startTime === null) {
      this.startTime = performance.now();
    }
  };

  private tick = (): void => {
    if (this.pendingTasks.length === 0) {
      this.startTime = null;
    }
  };
}

/**
 * Global task runner for CDF API requests
 * Limits concurrent requests to avoid 429 rate limiting and deadlocks
 */
export const cdfTaskRunner = new QueuedTaskRunner(DEFAULT_MAX_CONCURRENT_TASKS);
```

### Usage Pattern

Always wrap CDF calls with `cdfTaskRunner.schedule()`:

```typescript
import { cdfTaskRunner } from '../../../../shared/utils/semaphore';

// Single upsert wrapped in the semaphore
export async function saveNodes(client: CogniteClient, nodes: NodeOrEdgeCreate[]): Promise<void> {
  return cdfTaskRunner.schedule(async () => {
    await client.instances.upsert({ items: nodes });
  });
}

// Multiple parallel writes (safe — the semaphore limits concurrency)
export async function saveAll(client: CogniteClient, work: WorkItem[]): Promise<void> {
  await Promise.all([
    saveNodes(client, work.nodes),
    saveEdges(client, work.edges),
  ]);
}

// Each of the above functions internally uses cdfTaskRunner.schedule(),
// so Promise.all is safe — the semaphore prevents exceeding concurrency limits
```

### Deduplication with Keys

Use the `key` option to cancel stale requests when the same operation is triggered again:

```typescript
await cdfTaskRunner.schedule(
  async () => client.instances.upsert({ items: batch }),
  { key: `upsert-batch-${batchId}` }
);
// If another call with the same key arrives before this completes,
// the previous pending call is rejected with AbortError
```

---

## Batching Write Operations

When upserting many instances, chunk them to stay under the apply concurrency limit. Each `instances.upsert` call accepts up to 1000 items.

### Chunking Utility

```typescript
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
```

### Batched Upsert with QueuedTaskRunner

```typescript
const UPSERT_BATCH_SIZE = 1000;

async function batchUpsertNodes(
  client: CogniteClient,
  nodes: NodeOrEdgeCreate[]
): Promise<void> {
  const chunks = chunk(nodes, UPSERT_BATCH_SIZE);

  // Process chunks through the semaphore — safe even with Promise.all
  await Promise.all(
    chunks.map((batch) =>
      cdfTaskRunner.schedule(async () => {
        await client.instances.upsert({
          items: batch,
        });
      })
    )
  );
}
```

### Batched Delete with QueuedTaskRunner

Instance deletes have an even stricter concurrency limit. Use a separate, more restrictive task runner:

```typescript
import QueuedTaskRunner from '../../../../shared/utils/semaphore';

// Dedicated runner for deletes (stricter concurrency — check docs for current limit)
const deleteTaskRunner = new QueuedTaskRunner(2);

async function batchDeleteNodes(
  client: CogniteClient,
  nodeIds: { space: string; externalId: string }[]
): Promise<void> {
  const chunks = chunk(nodeIds, 1000);

  for (const batch of chunks) {
    await deleteTaskRunner.schedule(async () => {
      await client.instances.delete(
        batch.map((id) => ({
          instanceType: 'node' as const,
          ...id,
        }))
      );
    });
  }
}
```

---

## Common Pitfalls

### 1. Deadlocks from Nested Semaphore Calls

If function A holds a semaphore slot and calls function B which also needs a slot, you can deadlock if all slots are occupied. **Keep the semaphore at the outermost call level**, or ensure inner calls don't go through the same semaphore.

```typescript
// BAD: Nested semaphore — can deadlock
async function fetchAndEnrich(client: CogniteClient) {
  return cdfTaskRunner.schedule(async () => {
    const batches = await fetchBatches(client); // This also calls cdfTaskRunner.schedule!
    // If all slots are held by fetchAndEnrich callers, fetchBatches will never run
  });
}

// GOOD: Let inner functions own the semaphore
async function fetchAndEnrich(client: CogniteClient) {
  const batches = await fetchBatches(client); // Has its own semaphore call
  const enriched = await Promise.all(
    batches.map((b) => enrichBatch(client, b)) // Each has its own semaphore call
  );
  return enriched;
}
```

### 2. Unbounded Promise.all Without Semaphore

Firing many parallel API calls will hit the 429 limit immediately:

```typescript
// BAD: Too many simultaneous requests
await Promise.all(chunks.map((batch) => client.instances.upsert({ items: batch })));

// GOOD: Each call goes through the semaphore
await Promise.all(
  chunks.map((batch) =>
    cdfTaskRunner.schedule(() => client.instances.upsert({ items: batch }))
  )
);
```

### 3. Oversized Upsert Batches

`instances.upsert` accepts at most 1000 items per call. Passing more than 1000 items will fail. Always chunk large write arrays.

---

## Summary Checklist

- [ ] For reading data model instances, use the generated SDK — not `client.instances.*` directly
- [ ] Wrap CDF write calls with `cdfTaskRunner.schedule()`
- [ ] Chunk upsert operations to 1000 items per `instances.upsert` call
- [ ] Use a separate, stricter task runner for deletes
- [ ] Avoid nesting `cdfTaskRunner.schedule()` calls to prevent deadlocks
- [ ] Use `Promise.all` with semaphore-wrapped functions, never with raw API calls
- [ ] Refer to https://docs.cognite.com/cdf/dm/dm_reference/dm_limits_and_restrictions for current limits
