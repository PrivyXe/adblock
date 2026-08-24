/**
 * Controlled, safe logging utility. Avoids log spam in production.
 */
const IS_DEV = false; // Set true for local debug, false for production extension

export const Logger = {
  info(message: string, ...args: unknown[]): void {
    if (IS_DEV) {
      console.log(`[AdBlock INFO] ${message}`, ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[AdBlock WARN] ${message}`, ...args);
  },

  error(message: string, ...args: unknown[]): void {
    console.error(`[AdBlock ERROR] ${message}`, ...args);
  },

  debug(message: string, ...args: unknown[]): void {
    if (IS_DEV) {
      console.debug(`[AdBlock DEBUG] ${message}`, ...args);
    }
  }
};
