import { inquirer, chalk, fs } from '@idora/utils';
import { resolve, basename } from 'path';
import { templateJsonFile, templatePath } from './constants';
import updateCommand from './updateCommand';

let fileList: ITemplateFile[] = [];

// todo 临时方案
// 代码较大的情况下会在执行命令后完成
(async function () {
  if (!fs.existsSync(templateJsonFile)) {
    await updateCommand();
  }

  fileList = require(templateJsonFile);
}());

interface ITemplateFile {
  name: string;
  description: string;
  alias?: string;
  path: string;
}

interface IChoice {
  name: string;
  value: string;
  short: string;
}

const choices: IChoice[] = fileList.map((tpl) => ({
  name: `${tpl.name} - ${chalk.visible(tpl.description)}`,
  value: resolve(templatePath, tpl.path),
  short: tpl.name,
}));

async function copyFileToDest(file: string) {
  const fileName = basename(file);

  const fileConfig = fileList.find((item) => item.name === fileName);

  const destFilePath = resolve(process.cwd(), fileConfig?.alias || fileName);
  let shouldWrite = true;

  if (fs.existsSync(destFilePath)) {
    const answers = await inquirer.prompt({
      name: 'override',
      message: '当前目录下已存在相同文件，是否要覆盖？',
      type: 'confirm',
      default: false,
    });

    shouldWrite = answers.override;
  }

  if (shouldWrite) {
    fs.copyFileSync(file, destFilePath);
  }
}

export default async function addCommand(cmdArgs: any[]) {
  let filePath = '';
  const arg1 = cmdArgs[0];

  if (arg1) {
    const matchFile = choices.find((item) => item.short === arg1);

    if (matchFile) {
      filePath = matchFile.value;
    }
  }

  if (!filePath) {
    const answers = await inquirer.prompt([
      {
        name: 'name',
        message: '请选择要创建的模板文件',
        type: 'list',
        choices,
      },
    ]);

    filePath = answers.name;
  }

  await copyFileToDest(filePath);
}
