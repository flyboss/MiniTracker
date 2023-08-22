import {Command} from 'commander';

export function commander() {
    const program = new Command();
    program.version('0.0.1');

    program
        .option('-p, --platform-type <type>', '(wechat or baidu): platform of the mini program','baidu')
        .option('-f, --file-type <type>', '(single or all): single page or all pages of the mini program','single')
        .option('-s, --source-path <path>', 'mini program path(should include version id)','')
        .option('-l, --log-path <path>', 'log path','logs/')
        .option('-k, --keep-inter-results', 'keep intermediate results to files')
        .option('-i, --check-implicit-flow', 'check implicit tainted flow')
    program.parse(process.argv);
    return program.opts();
}
