import * as subproc from 'child_process';
import * as fs from 'fs';
import { Command } from 'commander';

function parseArgs() {
  const parser = new Command();
  parser.version('0.0.1');

  parser
    .option(
      '-p, --platform-type <type>',
      '(wechat or baidu): platform of the mini program',
      'baidu')
    .option('-in, --inputs <path>', 'A list of input files.', '')
    .option('-nj, --njobs <number>', 'Maximum number of subprocesses', '5')
    .option('-k, --keep-inter-results', 'keep intermediate results to files')
    .option('-i, --check-implicit-flow', 'check implicit tainted flow');
  parser.parse(process.argv);
  return parser.opts();
}

function justRush() {
  const args = parseArgs();
  const inputPath = args.inputs;
  const maxChildProcesses = args.njobs;
  const platform = args.platformType;
  const keepInterResults = args.keepInterResults;
  const checkImplicitFlow = args.checkImplicitFlow;
  let currentChildProcesses = 0;

  if (inputPath === '') {
    console.error('Please specify input files.');
    return 0;
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Input does not exist: ${inputPath}`);
    return 0;
  }
  const inputs = fs
    .readFileSync(inputPath)
    .toString()
    .replace(/\r\n/g, '\n')
    .split('\n').filter((x) => x);

  let current = 0;
  let doneFiles = 0;
  
  let totalFiles = 0;
  if (inputs[inputs.length - 1] === '') {
    totalFiles = inputs.length - 1;
  } else {
    totalFiles = inputs.length;
  }

  function rush() {
    if (currentChildProcesses < maxChildProcesses) {
      if (current === inputs.length) {
        return;
      }
      const path = inputs[current];
      current += 1;
      if (path === '') {
        return;
      }

      console.log(`Analyzing ${path}`);

      // generate commandline args
      const trackerArgs: string[] = [
        './out/miniTracker.js',
        '-p',
        platform,
        '-s',
        path,
        '-f',
        'all',
      ];
      if (keepInterResults) {
        trackerArgs.push('-k');
      }
      if (checkImplicitFlow) {
        trackerArgs.push('-i');
      }

      // execute miniTracker
      const child = subproc.execFile(
        'node',
        trackerArgs,
        (err, stdout, stderr) => {
          // console.log(stdout);
        }
      );
      currentChildProcesses += 1;
      child.on('exit', (code, signal) => {
        doneFiles += 1;
        if (code) {
          console.log(`[${doneFiles}/${totalFiles}] Error when analyzing ${path}. Code ${code}`);
        } else {
          console.log(`[${doneFiles}/${totalFiles}] Done ${path}.`);
        }
        currentChildProcesses -= 1;
      });
    }
    setTimeout(rush, 1);
  }
  setTimeout(rush, 0);
}

if (require.main === module) {
  justRush();
}
