import * as os from 'os'
import * as chalk from 'chalk'

export enum processTypeEnum {
  START = 'start',
  CREATE = 'create',
  COMPILE = 'compile',
  CONVERT = 'convert',
  COPY = 'copy',
  GENERATE = 'generate',
  MODIFY = 'modify',
  ERROR = 'error',
  WARNING = 'warning',
  UNLINK = 'unlink',
  REFERENCE = 'reference',
  REMIND = 'remind'
}

export interface IProcessTypeMap {
  [key: string]: {
    name: string,
    color: string | chalk.Chalk
  }
}

export const processTypeMap: IProcessTypeMap = {
  [processTypeEnum.REMIND]: {
    name: '提示',
    color: 'green'
  }
}

export const NODE_MODULES = 'node_modules'
export const NODE_MODULES_REG = /(.*)node_modules/

export const isWindows = os.platform() === 'win32'
