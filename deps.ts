import yargs from "https://deno.land/x/yargs@v17.2.1-deno/deno.ts";
export { yargs };

import { Arguments } from "https://deno.land/x/yargs@v17.2.1-deno/deno-types.ts";
export type { Arguments };

type Yargs = ReturnType<typeof yargs>;
export type { Yargs };

export { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";
