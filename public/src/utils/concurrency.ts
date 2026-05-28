export async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<unknown>,
  concurrency: number,
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    await Promise.all(batch.map(fn));
  }
}
