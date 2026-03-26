// Browser shim for Node.js "util" module
// Required by @tensorflow-models/speech-commands which imports { promisify } from "util"
export function promisify(fn: (...args: any[]) => void) {
  return (...args: any[]) =>
    new Promise((resolve, reject) => {
      fn(...args, (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
}

export default { promisify };
