/**
 * Utility function to wait for a condition
 */
export function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 10000, interval = 100 } = options;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const result = await condition();
        if (result) {
          resolve();
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
        } else {
          setTimeout(check, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    check();
  });
}
