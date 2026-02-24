declare module 'node:fs' {
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, content: string, encoding: string): void;
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
}

declare module 'node:assert' {
  export const strict: {
    ok(value: unknown, message?: string): void;
  };
}

declare const process: {
  argv: string[];
};

declare const console: {
  log(message: string): void;
  warn(message: string): void;
};
