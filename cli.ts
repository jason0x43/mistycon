import { Arguments, JSZip, Yargs, yargs } from "./deps.ts";
import config from "./config.json" assert { type: "json" };
import { Skill } from "./mistyApi.ts";

const api = `http://${config.address}/api`;

async function send(path: string, data: Record<string, unknown> | FormData) {
  const fetchInit: RequestInit = { method: "POST" };
  if (data instanceof FormData) {
    fetchInit.body = data;
  } else {
    fetchInit.headers = { "Content-Type": "application/json" };
    fetchInit.body = JSON.stringify(data);
  }

  const resp = await fetch(`${api}/${path}`, fetchInit);
  return resp.json();
}

async function get<T>(path: string, options?: RequestInit) {
  const resp = await fetch(`${api}/${path}`, options);
  const result = await resp.json();
  return result.result as T;
}

async function getSkillId(name: string): Promise<string | undefined> {
  const skills = await get<Skill[]>("skills");
  for (const skill of skills) {
    if (skill.name === name) {
      return skill.uniqueId;
    }
  }
  return undefined;
}

const parser = yargs(Deno.args)
  .scriptName("mc")
  .strict()
  .version("0.1.0")
  .option("h", {
    alias: "help",
  })
  .demandCommand(1);

parser.command(
  "led <color>",
  "Control the LED",
  (yargs: Yargs) => {
    yargs.positional("color", {
      describe: "A color for the LED (e.g. '255,0,0' or 'red')",
      type: "string",
    });
  },
  async (args: Arguments & { color: string }) => {
    let color: { red: number; green: number; blue: number } | undefined;

    if (/\d+,\d+,\d+/.test(args.color)) {
      const parts = args.color.split(",").map(Number);
      color = { red: parts[0], green: parts[1], blue: parts[2] };
    } else {
      switch (args.color.toLowerCase()) {
        case "red":
          color = { red: 255, green: 0, blue: 0 };
          break;
        case "green":
          color = { red: 0, green: 255, blue: 0 };
          break;
        case "blue":
          color = { red: 0, green: 0, blue: 255 };
          break;
        case "magenta":
          color = { red: 255, green: 0, blue: 255 };
          break;
        case "cyan":
          color = { red: 0, green: 255, blue: 255 };
          break;
        case "yellow":
          color = { red: 255, green: 255, blue: 0 };
          break;
        case "orange":
          color = { red: 255, green: 128, blue: 0 };
          break;
        case "purple":
          color = { red: 128, green: 0, blue: 255 };
          break;
        case "off":
          color = { red: 0, green: 0, blue: 0 };
          break;
      }
    }

    if (color) {
      await send("led", color);
    }
  },
);

parser.command(
  "say <text>",
  "Speak",
  (yargs: Yargs) => {
    yargs.positional("text", {
      describe: "A string of text to speak",
      type: "string",
    });
  },
  async (args: Arguments & { text: string }) => {
    const { text } = args;
    await send("tts/speak", {
      flush: false,
      text: text,
      speechRate: 1,
      pitch: 0.2,
    });
  },
);

parser.command(
  "volume <value>",
  "Set the default volume",
  (yargs: Yargs) => {
    yargs.positional("value", {
      describe: "A value between 0 and 100",
      type: "number",
    });
  },
  async (args: Arguments & { value: string }) => {
    const { value } = args;
    await send("audio/volume", { Volume: Number(value) });
  },
);

parser.command(
  "info",
  "Get information about the robot",
  {},
  async () => {
    const data = await get("device");
    console.log(data);
  },
);

parser.command(
  "deploy <name>",
  "Deploy a script to Misty",
  (yargs: Yargs) => {
    yargs.positional("name", {
      describe: "A script name, like 'look-around'",
      type: "string",
    });
  },
  async (args: Arguments & { name: string }) => {
    const { name } = args;

    const zip = new JSZip();
    zip.addFile(`${name}.js`, await Deno.readFile(`./skills/${name}.js`));
    zip.addFile(`${name}.json`, await Deno.readFile(`./skills/${name}.json`));
    const data = await zip.generateAsync({ type: "uint8array" });

    const body = new FormData();
    body.append(
      "File",
      new File([data], `${name}.zip`, { type: "application/zip" }),
    );
    body.append("ImmediatelyApply", "false");
    body.append("OverwriteExisting", "true");
    const result = await send("skills", body);
    console.log(result);
  },
);

parser.command(
  "delete <name>",
  "Delete a skill",
  (yargs: Yargs) => {
    yargs.positional("name", {
      describe: "A script name, like 'look-around'",
      type: "string",
    });
  },
  async (args: Arguments & { name: string }) => {
    const { name } = args;
    const id = await getSkillId(name);
    if (id) {
      const params = new URLSearchParams();
      params.set("Skill", id);
      const result = await get(`${api}/skills?${params}`, { method: "DELETE" });
      console.log(result);
    } else {
      console.log(`Unknown skill "${name}"`);
    }
  },
);

parser.command(
  "run <name>",
  "Run a previously deployed skill",
  (yargs: Yargs) => {
    yargs.positional("name", {
      describe: "A skill's name, like 'look-around'",
      type: "string",
    });
  },
  async (args: Arguments & { name: string }) => {
    const { name } = args;
    const id = await getSkillId(name);
    if (id) {
      const result = await send("skills/start", { Skill: id });
      console.log(result);
    } else {
      console.log(`Unknown skill "${name}"`);
    }
  },
);

parser.command(
  "cancel <name>",
  "Cancel a running skill",
  (yargs: Yargs) => {
    yargs.positional("name", {
      describe: "A skill's unique ID",
      type: "string",
    });
  },
  async (args: Arguments & { name: string }) => {
    const { name } = args;
    const id = getSkillId(name);
    if (id) {
      const result = await send("skills/cancel", { Skill: id });
      console.log(result);
    } else {
      console.log(`Unknown skill "${name}"`);
    }
  },
);

parser.command(
  "skills",
  "List skills",
  {
    verbose: {
      alias: "v",
      describe: "Show all info",
      type: "boolean",
    },
    running: {
      alias: "r",
      describe: "Only list running skills",
      type: "boolean",
    },
  },
  async (args: Arguments & { verbose: boolean; running: boolean }) => {
    const skills = args.running
      ? await get<Skill[]>("skills/running")
      : await get<Skill[]>("skills");
    if (args.verbose) {
      console.log(skills);
    } else {
      for (const skill of skills) {
        console.log(skill.name);
      }
    }
  },
);

try {
  await parser.parse();
} catch {
  // ignore errors here; they're handled in .fail
}
