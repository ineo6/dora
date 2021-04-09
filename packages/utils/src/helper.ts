import * as fs from 'fs-extra'
import * as path from 'path'
import * as os from 'os'
import * as child_process from 'child_process'
// @ts-ignore
import findModuleBin from 'find-module-bin';

import {
  NODE_MODULES_REG,
} from './constants'

const execSync = child_process.execSync

export const execCommand = function (cmd: string, args: any = []) {
  const binPath = findModuleBin(cmd);
  if (binPath) {
    try {
      const stdout = child_process.execFileSync(binPath, args);

      console.log(stdout)
      console.log(stdout.toString())
    } catch (e) {
      console.error(`${cmd} error:`, e.message)
    }
  }
};

export function normalizePath(path: string) {
  return path.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
}

export const isNodeModule = (filename: string) => NODE_MODULES_REG.test(filename)

export function isNpmPkg(name: string): boolean {
  if (/^(\.|\/)/.test(name)) {
    return false
  }
  return true
}

export function promoteRelativePath(fPath: string): string {
  const fPathArr = fPath.split(path.sep)
  let dotCount = 0
  fPathArr.forEach(item => {
    if (item.indexOf('..') >= 0) {
      dotCount++
    }
  })
  if (dotCount === 1) {
    fPathArr.splice(0, 1, '.')
    return fPathArr.join('/')
  }
  if (dotCount > 1) {
    fPathArr.splice(0, 1)
    return fPathArr.join('/')
  }
  return normalizePath(fPath)
}

export function getUserHomeDir(): string {
  function homedir(): string {
    const env = process.env
    const home = env.HOME
    const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME

    if (process.platform === 'win32') {
      return env.USERPROFILE || '' + env.HOMEDRIVE + env.HOMEPATH || home || ''
    }

    if (process.platform === 'darwin') {
      return home || (user ? '/Users/' + user : '')
    }

    if (process.platform === 'linux') {
      // eslint-disable-next-line no-nested-ternary
      return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : ''))
    }

    return home || ''
  }

  return typeof (os.homedir as (() => string) | undefined) === 'function' ? os.homedir() : homedir()
}

export function getSystemUsername(): string {
  const userHome = getUserHomeDir()
  const systemUsername = process.env.USER || path.basename(userHome)
  return systemUsername
}

export function shouldUseYarn(): boolean {
  try {
    execSync('yarn --version', {stdio: 'ignore'})
    return true
  } catch (e) {
    return false
  }
}

export function shouldUseCnpm(): boolean {
  try {
    execSync('cnpm --version', {stdio: 'ignore'})
    return true
  } catch (e) {
    return false
  }
}

export function isEmptyObject(obj: any): boolean {
  if (obj == null) {
    return true
  }
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      return false
    }
  }
  return true
}

export function generateEnvList(env: object): object {
  const res = {}
  if (env && !isEmptyObject(env)) {
    for (const key in env) {
      try {
        res[`process.env.${key}`] = JSON.parse(env[key])
      } catch (err) {
        res[`process.env.${key}`] = env[key]
      }
    }
  }
  return res
}

/*eslint-disable*/
const retries = (process.platform === 'win32') ? 100 : 1

export function emptyDirectory(dirPath: string, opts: { excludes: string[] } = {excludes: []}) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = path.join(dirPath, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        let removed = false
        let i = 0 // retry counter
        do {
          try {
            if (!opts.excludes.length || !opts.excludes.some(item => curPath.indexOf(item) >= 0)) {
              emptyDirectory(curPath)
              fs.rmdirSync(curPath)
            }
            removed = true
          } catch (e) {
          } finally {
            if (++i < retries) {
              continue
            }
          }
        } while (!removed)
      } else {
        fs.unlinkSync(curPath)
      }
    })
  }
}

/* eslint-enable */

export function getInstalledNpmPkgPath(pkgName: string, basedir: string): string | null {
  // eslint-disable-next-line global-require
  const resolvePath = require('resolve')
  try {
    return resolvePath.sync(`${pkgName}/package.json`, {basedir})
  } catch (err) {
    return null
  }
}

export function getInstalledNpmPkgVersion(pkgName: string, basedir: string): string | null {
  const pkgPath = getInstalledNpmPkgPath(pkgName, basedir)
  if (!pkgPath) {
    return null
  }
  return fs.readJSONSync(pkgPath).version
}

export function readDirWithFileTypes(floder: string): FileStat[] {
  const list = fs.readdirSync(floder)
  const res = list.map(name => {
    const stat = fs.statSync(path.join(floder, name))
    return {
      name,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile()
    }
  })
  return res
}

export const getAllFilesInFolder = async (
  floder: string,
  filter: string[] = []
): Promise<string[]> => {
  let files: string[] = []
  const list = readDirWithFileTypes(floder)

  await Promise.all(
    list.map(async item => {
      const itemPath = path.join(floder, item.name)
      if (item.isDirectory) {
        const _files = await getAllFilesInFolder(itemPath, filter)
        files = [...files, ..._files]
      } else if (item.isFile) {
        if (!filter.find(rule => rule === item.name)) files.push(itemPath)
      }
    })
  )

  return files
}

export interface FileStat {
  name: string
  isDirectory: boolean
  isFile: boolean
}

// @ts-ignore
export const getModuleDefaultExport = exports => (exports.__esModule ? exports.default : exports)
