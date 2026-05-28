const WINDOW_MS = 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_QUEUE_SIZE = 100;

interface PendingRequest {
  resolve: () => void;
  reject: (err: Error) => void;
}

const requestTimestamps: number[] = [];
const queue: PendingRequest[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function refill(): void {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - WINDOW_MS) {
    requestTimestamps.shift();
  }
}

function processQueue(): void {
  if (timer !== null) return;

  const tick = (): void => {
    refill();
    while (queue.length > 0 && requestTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
      const item = queue.shift()!;
      requestTimestamps.push(Date.now());
      item.resolve();
    }

    if (queue.length > 0) {
      timer = setTimeout(tick, WINDOW_MS / MAX_REQUESTS_PER_WINDOW);
    } else {
      timer = null;
    }
  };

  timer = setTimeout(tick, WINDOW_MS / MAX_REQUESTS_PER_WINDOW);
}

export async function acquireToken(): Promise<void> {
  refill();

  if (requestTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
    requestTimestamps.push(Date.now());
    return;
  }

  if (queue.length >= MAX_QUEUE_SIZE) {
    throw new Error('Request queue full, try again later');
  }

  return new Promise<void>((resolve, reject) => {
    queue.push({ resolve, reject });
    processQueue();
  });
}

export function __resetThrottle(): void {
  requestTimestamps.length = 0;
  queue.length = 0;
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}
