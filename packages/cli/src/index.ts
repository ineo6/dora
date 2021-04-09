import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { Kernel } from '@idora/service'
import { yParser, chalk } from '@idora/utils'

import nrm from './commands/nrm'
import customCommand from './commands/customCommand'

function printHelp () {
  console.log('Usage: dora <command> [options]')
  console.log()
  console.log('Options:')
  console.log('  -v, --version       output the version number')
  console.log('  -h, --help          output usage information')
  console.log()
  console.log('Commands:')
  console.log('  nrm <cmd>           npm and yarn registry manage')
  console.log('  touch <cmd>         easy create common config')
  console.log('  help [cmd]          display help for [cmd]')
}

export default class Cli {
  parseArgs () {
    const args = yParser(process.argv.slice(2), {
      alias: {
        version: 'v',
        help: 'h'
      },
      boolean: ['version', 'help']
    })

    if (args.version && !args._[0]) {
      const local = existsSync(join(__dirname, '../.local'))
        ? chalk.cyan('@local')
        : ''

      const pkg = require('../package.json')
      console.log(`${pkg.name}@${pkg.version}${local}`)
    } else if (!args._[0]) {
      args.h = true
      args.help = true
    }

    try {
      if (args._[0]) {
        const [command, ...cmdArgs] = args._

        const kernel = new Kernel({
          appPath: '',
          presets: [
            resolve(__dirname, './presets/index.js')
          ]
        })

        switch (command) {
          case 'nrm':
            const cmdType = cmdArgs[0]
            const key = cmdArgs[1]
            const value = cmdArgs[2]
            nrm(kernel, {
              cmd: cmdType,
              key,
              value,
              isHelp: args.h
            })
            break
          case 'help':
            printHelp()
            break
          default:
            customCommand(command, kernel, args)
            break
        }
      } else if (args.h) {
        printHelp()
      }
    } catch (e) {
      console.log(chalk)
      console.error(chalk.red(e.message))
      console.error(e.stack)
      process.exit(1)
    }
  }

  run () {
    this.parseArgs()
  }
}
