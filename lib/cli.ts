import { Arguments, JSZip, Yargs, yargs } from "./deps.ts";
import {
  cancelSkill,
  changeLed,
  connect,
  EventType,
  getDeviceInfo,
  getHazardSettings,
  getSkills,
  getStreamingEvents,
  isActionEvent,
  isMessageEvent,
  removeSkill,
  restart,
  runSkill,
  setVolume,
  speak,
  stopStreamingEvents,
  uploadSkill,
} from "./api.ts";

// Catch SIGINT and call exit explicitly so that the unload handler will be
// called
Deno.addSignalListener("SIGINT", () => {
  Deno.exit(0);
});

async function getSkillId(name: string): Promise<string | undefined> {
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
  "info [key]",
  "Get information about the robot",
  (yargs: Yargs) => {
    yargs.positional("key", {
      description: "A key on the device info object",
      type: "string",
    });
  },
  async (args: Arguments & { key?: string }) => {
    const info = await getDeviceInfo();
    const { key } = args;
    if (key) {
      const matchingKeys = Object.keys(info).filter((k) => k.startsWith(key));
      if (matchingKeys.length > 0) {
        const matchingInfo: Partial<typeof info> = {};
        for (const k of matchingKeys) {
          matchingInfo[k] = info[k];
        }
        console.log(matchingInfo);
      }
    } else {
      console.log(info);
    }
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
  "remove <name>",
  "Remove a skill",
  (yargs: Yargs) => {
    yargs.positional("name", {
      describe: "A script name, like 'look-around'",
      type: "string",
    });
  },
  async (args: Arguments & { name: string }) => {
    const { name } = args;
    const id = await getSkillId(name);
    if (!id) {
      console.log(`Unknown skill "${name}"`);
      return;
    }

    await removeSkill(id);
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
    if (!id) {
      console.log(`Unknown skill "${name}"`);
      return;
    }

    const socket = await connect();
    const events: EventType[] = ["SkillData", "SkillSystemStateChange"];

    // Unsubscribe from subscribed events when the CLI exits
    globalThis.addEventListener("unload", () => {
      stopStreamingEvents(socket, ...events);
    });

    const result = await runSkill(id);
    console.log(result);

    for await (const event of getStreamingEvents(socket, ...events)) {
      if (isMessageEvent(event)) {
        if (event.message.data && /Debug =>/.test(event.message.message)) {
          console.log(`[${event.eventName}] ${event.message.data}`);
        } else {
          console.log(`[${event.eventName}] ${event.message.message}`);
        }
      } else if (isActionEvent(event)) {
        console.log(`[${event.eventName}] ${event.message.action}`);
      } else {
        console.log(`[${event.eventName}] ${event.message}`);
      }

      if (
        event.eventName === "SkillSystemStateChange" &&
        event.message.action === "Stopped"
      ) {
        Deno.exit(0);
      }
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
    if (!id) {
      console.log(`Unknown skill "${name}"`);
      return;
    }

    const result = await cancelSkill(id);
    console.log(result);
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

parser.command(
  "uniqueId",
  "Generate a new unique ID",
  {},
  () => {
    console.log(crypto.randomUUID());
  },
);

parser.command(
  "stream <events..>",
  "Show a live event stream from the robot for a given set of events",
  (yargs: Yargs) => {
    yargs.positional("events", {
      describe: "One or more events to stream",
      type: "array",
    });
  },
  async (args: Arguments & { events: EventType[] }) => {
    const socket = await connect();
    const { events } = args;

    // Unsubscribe from subscribed events when the CLI exits
    globalThis.addEventListener("unload", () => {
      stopStreamingEvents(socket, ...events);
    });

    for await (const event of getStreamingEvents(socket, ...events)) {
      console.log(event);
    }
  },
);

parser.command(
  "restart",
  "Restart Misty",
  {},
  async () => {
    const result = await restart();
    console.log(result);
  },
);

parser.command(
  "hazards",
  "Get or set hazard settings",
  {},
  async () => {
    const result = await getHazardSettings();
    console.log(result);
  },
);

try {
  await parser.parse();
} catch {
  // ignore errors here; they're handled in .fail
}
