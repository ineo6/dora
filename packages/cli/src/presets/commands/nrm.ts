import { execCommand } from '@idora/utils'
import { IPluginContext } from '@idora/service'

export default (ctx: IPluginContext) => {
  ctx.registerCommand({
    plugin: 'nrm',
    name: 'nrm',
    synopsisList: [
      'ls',
      'use <registry> [type]',
      'add <registry> <url> [home]',
      'del <registry>',
      'test [registry]',
    ],
    async fn () {
      const { cmd, key, value } = ctx.runOpts

      switch (cmd) {
        case 'ls':
          execCommand('cgr', [cmd])
          break
        case 'use':
          execCommand('cgr', [cmd, key])
          break
        case 'add':
          execCommand('cgr', [cmd, key, value])
          break
        case 'del':
          execCommand('cgr', [cmd, key])
          break
        case 'test':
          execCommand('cgr', [cmd])
          break
        default:
          break
      }
    }
  })
}
