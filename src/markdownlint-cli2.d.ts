// markdownlint-cli2 ships no types; this is the one entry point src/lint-md.ts uses.
declare module "markdownlint-cli2" {
  export function main(params: {
    directory?: string;
    argv: string[];
    logMessage?: (message: string) => void;
    logError?: (message: string) => void;
  }): Promise<number>;
}
