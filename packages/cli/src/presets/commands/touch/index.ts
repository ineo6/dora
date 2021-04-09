import { IPluginContext } from '@idora/service'
import addCommand from "./addCommand";
import updateCommand from "./updateCommand";

export default (ctx: IPluginContext) => {
  ctx.registerCommand({
    plugin: 'touch',
    name: 'touch',
    synopsisList: [
      'add <name>',
      'update'
    ],
    async fn () {
      const { _: [cmd, ...cmdArgs] } = ctx.runOpts;

      if (cmdArgs && cmdArgs[0]) {
        switch (cmdArgs[0]) {
          case 'add':
            await addCommand(cmdArgs)
            break
          case 'update':
            await updateCommand()
            break
          default:
            break
        }

      }
    }
  })
}
