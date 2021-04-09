import { downloadGitRepo, chalk, ora, fs } from '@idora/utils';
import { join } from 'path';
import * as os from "os";

const origin = 'ineo6/dora-touch-template';
const branch = "#master";

const tmpDirPrefix = join(os.tmpdir(), '.tmp');
const tmpDir = fs.mkdtempSync(tmpDirPrefix);

export default async function updateCommand () {
  const spinner = ora(`downloading ${origin}...`);
  spinner.start();

  return new Promise<void>((resolve, reject) => {
    downloadGitRepo(`${origin}${branch}`, tmpDir, { clone: false }, function (err: unknown) {
      spinner.stop();
      if (err) {
        console.log(chalk.red('拉取远程仓库失败', err));
      } else {
        try {
          fs.copySync(join(tmpDir, 'files'), join(__dirname, './template'));

          resolve()
          console.log(chalk.green('更新touch file完成'));
        } catch (e) {
          reject()
          console.log(chalk.red('更新touch file失败', e.message));
        }
      }
    })
  })
}
