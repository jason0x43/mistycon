# MistyCon

A simple controller app for the Misty II robot

## Requirements

This application is written for the Deno runtime. If you don't already have Deno
installed, the app will install a local copy the first time it's run.

For the best editing experience, ensure your editor is setup to run the Deno
language server. When editing skills in the `skills/` directory, the langage
server should be setup to load `skills/deno.json`.

## Getting started

First, create a `config.json` file in the project directory. This file currently
has only one required parameter, and should look like:

```json
{
  "address": "10.0.1.123"
}
```

To issue a command, run the `mc` script. If you don't have Deno, you'll see some
progress bars as the script installs a local copy, then you'll see the standard
help output:

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

A skill is a JavaScript file that will uploaded to the robot and will execute on
the robot's internal runtime. Each skill consists of a JavaScript file and a
JSON manifest file, both with the same name (e.g. `look-around.js` and
`look-around.json`). The `mc` script can be used to deploy apps from the
`skills/` directory, like

```
$ ./mc deploy look-around
```

If your editor is properly configured, the Deno language server will be used to
provide completion for the misty API when you edit files in the `skills/`
directory.

## Misty II API

The Misty
[REST API docs](https://docs.mistyrobotics.com/misty-ii/rest-api/overview/) are
frequently inaccurate; the
[API Explorer](http://sdk.mistyrobotics.com/api-explorer/index.html) is more
trustworthy. The
[JavaScript API docs](https://docs.mistyrobotics.com/misty-ii/javascript-sdk/api-reference/)
are somewhat more reliable.
