# MistyCon

A simple controller app for the Misty II robot

## Requirements

This application is written for the Deno runtime. If you don't already have Deno
installed, the app will install a local copy the first time it's run.

For the best editing experience, ensure your editor is running both Deno and
JSON language servers. When editing a skill script, reference the Misty SDK
types (`mistySdk.d.ts`) with a triple-slash directive. When editing a JSON
manifest, reference the Misty JSON schema (`mistySdk.schema.json`) using a
`$schema` property. These references will allow your editor language server to
provide autocompletion and type checking for the script and manifest files.

## Getting started

First, create a `config.json` file in the project directory. This file currently
has only one required parameter, the local IP address of the Misty II robot that
will be controlled. It should look like:

```json
{
  "address": "10.0.1.123"
}
```

To issue a command, run the `mc` script. If you don't have Deno, you'll see some
progress bars as the script installs a local copy, then you'll see the standard
help output, which should look similar to this:

```
mc <command>

Commands:
  mc led <color>     Control the LED
  mc say <text>      Speak
  mc volume <value>  Set the default volume
  mc info            Get information about the robot
  mc deploy <name>   Deploy a script to Misty
  mc delete <name>   Delete a skill
  mc run <name>      Run a previously deployed skill
  mc cancel <name>   Cancel a running skill
  mc skills          List skills

Options:
      --version  Show version number              [boolean]
  -h, --help     Show help                        [boolean]
```

To turn on the robot's main light and make it bright green, run:

```
$ ./mc led 0,255,0
```

or

```
$ ./mc led green
```

## Writing skills

A skill is a JavaScript file that will be uploaded to the robot and will execute
on the robot's internal runtime. Each skill consists of a JavaScript file and a
JSON manifest file, both with the same name (e.g. `lookAround.js` and
`lookAround.json`). The `mc` script can be used to deploy apps from the
`skills/` directory, like

```
$ ./mc deploy lookAround
```

If your editor is running Deno and JSON language servers, and if the types and
JSON schema are properly referenced in the script and manifest files, your
editor will provide autocompletion and type checking while editing a skill.

A skill script with a types reference:

```js
/// <reference types="../mistySdk.d.ts" />

misty.ChangeLED(0, 255, 0);
misty.Drive(10, 0);
```

A skill manifest with a schema reference:

```json
{
	"$schema": "../mistySdk.schema.json",
	"Name": "driveAround",
	"Description": "Have Misty drive around"
}
```

## Misty II reference

- [REST API](https://docs.mistyrobotics.com/misty-ii/rest-api/overview/)
- [JavaScript SDK](https://docs.mistyrobotics.com/misty-ii/javascript-sdk/api-reference/)
- [Events](https://docs.mistyrobotics.com/misty-ii/robot/sensor-data/#events-overview)
- [API Explorer](http://sdk.mistyrobotics.com/api-explorer/index.html)
