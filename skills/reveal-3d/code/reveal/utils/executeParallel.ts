/**
 * Execute async callbacks in parallel with a controlled concurrency limit.
 * Prevents overwhelming the API while maximizing throughput.
 */
export async function executeParallel<T>(
  callbacks: Array<() => Promise<T>>,
  maxParallel: number
): Promise<Array<T | undefined>> {
  const results: Array<T | undefined> = new Array(callbacks.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    const currentIndex = nextIndex++;
    if (currentIndex >= callbacks.length) return;

    try {
      results[currentIndex] = await callbacks[currentIndex]();
    } catch (error) {
      console.error(`executeParallel: callback ${currentIndex} failed:`, error);
      results[currentIndex] = undefined;
    }

    await runNext();
  }

  await Promise.all(
    Array.from({ length: Math.min(maxParallel, callbacks.length) }, () => runNext())
  );

  return results;
}

/**
 * Split an array into smaller arrays of the given size.
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
