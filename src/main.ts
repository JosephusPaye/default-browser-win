import URL from 'url';
import path from 'path';
import { spawn } from 'child_process';
import { commandsAsScript } from '@josephuspaye/powershell';

export interface KnownBrowser {
  name: string;
  privateSwitch: string;
}

export interface ShellCommand {
  exe: string;
  exeFullPath: string;
  args: string;
}

const knownBrowsers: {
  [key: string]: KnownBrowser;
} = {
  'brave.exe': {
    name: 'Brave',
    privateSwitch: '-incognito',
  },
  'chrome.exe': {
    name: 'Google Chrome',
    privateSwitch: '-incognito',
  },
  'firefox.exe': {
    name: 'Mozilla Firefox',
    privateSwitch: '-private-window',
  },
  'iexplore.exe': {
    name: 'Internet Explorer',
    privateSwitch: '-private',
  },
  'msedge.exe': {
    name: 'Microsoft Edge',
    privateSwitch: '-inprivate',
  },
  'launchwinapp.exe': {
    name: 'Microsoft Edge',
    privateSwitch: '', // unknown, `-inprivate` doesn't work
  },
  'opera.exe': {
    name: 'Opera',
    privateSwitch: '--private',
  },
  'vivaldi.exe': {
    name: 'Vivaldi',
    privateSwitch: '-incognito',
  },
};

// https://regexr.com/5jd9g
const filePathRegex = /(?:^"(.+?)" ?(.*))|(?:^([^\s]+) ?(.*))/;

/**
 * Extract the executable name from the given shell command that launches a browser.
 * Commands are of the format:
 *    "C:\Program Files\Firefox Developer Edition\firefox.exe" -osint -url "%1"
 */
function parseShellCommand(shellCommand: string): ShellCommand | null {
  const matches = filePathRegex.exec(shellCommand);

  if (!matches) {
    return null;
  }

  const filePath = (matches[1] ?? matches[3] ?? '').trim();
  const args = (matches[2] ?? matches[4] ?? '').trim();

  if (filePath.length === 0) {
    return null;
  }

  const { base } = path.parse(filePath);

  return {
    exeFullPath: filePath,
    exe: base.trim(),
    args,
  };
}

/**
 * Get the user's default browser and the shell command to launch it.
 * @throws Throws if there's an error finding the default browser or if no default browser is found
 */
export async function getDefaultBrowser() {
  const script = `
  New-PSDrive -PSProvider registry -Root HKEY_CLASSES_ROOT -Name HKCR > $null;
  $progId = (Get-ItemProperty -Path HKCU:\\SOFTWARE\\Microsoft\\Windows\\Shell\\Associations\\URLAssociations\\https\\UserChoice).ProgId;
  $exe = (Get-ItemProperty -Path ("HKCR:\\" + $progId + "\\shell\\open\\command"))."(default)";

  Write-Output $exe;
  `.trim();

  let output = await commandsAsScript(script);

  let browser: KnownBrowser | undefined = undefined;
  let shellCommand: ShellCommand | null = null;

  const stdout = output.stdout.trim();

  if (stdout.length > 0) {
    shellCommand = parseShellCommand(stdout);
    browser = knownBrowsers[shellCommand?.exe.toLowerCase() ?? ''];
  }

  if (!browser || !shellCommand) {
    throw new Error('default browser not found');
  }

  return { browser, shellCommand, shellCommandString: output.stdout };
}

/**
 * Launch the default browser with the given URL, optionally in private/incognito mode.
 * @throws Throws if there's an error finding the default browser or if no default browser is found
 */
export async function launch(url: string, options: { private?: boolean } = {}) {
  if (!url || url.trim().length === 0) {
    throw new Error('url must be a string with a valid URL');
  }

  if (!options?.private) {
    spawn(`start "" "${URL.parse(url).href}"`, {
      detached: true,
      shell: true,
      stdio: 'ignore',
      timeout: 5000,
      windowsHide: true,
    });
    return;
  }

  const {
    browser,
    shellCommand,
    shellCommandString,
  } = await getDefaultBrowser();

  const urlNormalized = URL.parse(url).href;

  const launchUrl = `${browser.privateSwitch} "${urlNormalized}"`;

  let launchArgs = shellCommandString.includes('%1')
    ? shellCommand.args.replace('"%1"', launchUrl).replace('%1', launchUrl)
    : shellCommand.args + ` ${launchUrl}`;

  launchArgs = launchArgs
    .replace(/--single-argument/gi, '') // Remove Chrome and derivatives' flag to process all args as a single arg
    .replace(/-osint/gi, ''); // Remove Firefox's OS integration flag

  const command = `start "" "${shellCommand.exeFullPath}" ${launchArgs}`;

  spawn(command, {
    detached: true,
    shell: true,
    stdio: 'ignore',
    timeout: 5000,
    windowsHide: true,
  });
}

async function main() {
  await launch('https://google.com', { private: false });
}

main();
