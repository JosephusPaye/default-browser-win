// @ts-check

const { launch } = require('.');

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
