# default-browser-win

> Get the default browser on Windows and launch URLs, optionally in private mode.

This project is part of [#CreateWeekly](https://twitter.com/JosephusPaye/status/1214853295023411200), my attempt to create something new publicly every week in 2020.

## Installation

```sh
npm install -g @josephuspaye/default-browser-win
```

## Examples

### Get the default browser

```js
import { getDefaultBrowser } from '@josephuspaye/default-browser-win';

async function main() {
  try {
    const result = await getDefaultBrowser();
    console.log(JSON.stringify(result, null, '  '));
  } catch (err) {
    console.error('unable to get default browser: ' + err.message);
  }
}

main();
```

<details>

<summary>View output</summary>

```json
{
  "browser": {
    "name": "Microsoft Edge",
    "privateSwitch": "-inprivate"
  },
  "shellCommand": {
    "exeFullPath": "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "exe": "msedge.exe",
    "args": "--single-argument %1"
  },
  "shellCommandString": "\"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\" --single-argument %1"
}
```

</details>

### Launch a URL in the default browser

```js
import { launch } from '@josephuspaye/default-browser-win';

async function main() {
  try {
    const result = await launch('http://rationallyspeakingpodcast.org');
    console.log(JSON.stringify(result, null, '  '));
  } catch (err) {
    console.error('unable to launch URL in default browser: ' + err.message);
  }
}

main();
```

### Launch a URL in the default browser in private/incognito mode

```js
import { launch } from '@josephuspaye/default-browser-win';

async function main() {
  try {
    const result = await launch('http://rationallyspeakingpodcast.org', {
      private: true,
    });
    console.log(JSON.stringify(result, null, '  '));
  } catch (err) {
    console.error('unable to launch URL in default browser: ' + err.message);
  }
}

main();
```

**NOTE:** It's currently not possible to launch the original (pre-Chromium) Microsoft Edge in private mode. If it is the default browser, the URL will be launched in normal browsing mode. You can disable this behavior by returning `false` from the `onUnableToOpenPrivately()` callback option passed to `launch()`.

## API

```ts
interface KnownBrowser {
  name: string;
  privateSwitch: string;
}

interface ShellCommand {
  exe: string;
  exeFullPath: string;
  args: string;
}

interface LaunchOptions {
  /**
   * Launch the URL in private mode.
   */
  private?: boolean;

  /**
   * Handle what happens when the default browser is one that can't be open
   * in private mode. Return true to open anyway, or false to abort.
   */
  onUnableToOpenPrivately?: (
    browser: KnownBrowser,
    shellCommand: ShellCommand
  ) => Promise<boolean>;
}

/**
 * Get the user's default browser and the shell command to launch it.
 * @throws Throws if there's an error finding the default browser or if no default browser is found
 */
function getDefaultBrowser(): Promise<{
  browser: KnownBrowser;
  shellCommand: ShellCommand;
  shellCommandString: string;
}>;

/**
 * Launch the default browser with the given URL, optionally in private/incognito mode.
 * @throws Throws if there's an error finding the default browser or if no default browser is found
 */
function launch(url: string, options?: LaunchOptions): Promise<void>;
```

## Licence

[MIT](LICENCE)
