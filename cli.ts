import { Arguments, JSZip, Yargs, yargs } from "./deps.ts";
import {
  cancelSkill,
  changeLed,
  getDeviceInfo,
  getSkills,
  removeSkill,
  runSkill,
  setVolume,
  speak,
  uploadSkill,
} from "./api.ts";

export async function getSkillId(name: string): Promise<string | undefined> {
  const skills = await getSkills();
  return skills.find((skill) => skill.name === name)?.uniqueId;
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
      await changeLed(color);
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
    }).option("rate", {
      alias: "r",
      type: "number",
      default: 1,
    }).option("pitch", {
      alias: "p",
      type: "number",
      default: 1,
    });
  },
  async (args: Arguments & { text: string; rate: number; pitch: number }) => {
    const { text } = args;
    await speak({
      flush: false,
      text: text,
      speechRate: args.rate,
      pitch: args.pitch,
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
  async (args: Arguments & { value: number }) => {
    const { value } = args;
    await setVolume(value);
  },
);

parser.command(
  "info",
  "Get information about the robot",
  {},
  async () => {
    console.log(await getDeviceInfo());
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

    const result = await uploadSkill({
      overwriteExisting: true,
      file: new File([data], `${name}.zip`, { type: "application/zip" }),
    });
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
      const result = await removeSkill(id);
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
      const result = await runSkill(id);
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
    const id = await getSkillId(name);
    if (id) {
      const result = await cancelSkill(id);
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
    const skills = await getSkills({ running: args.running });
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
