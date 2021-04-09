import { Kernel } from '@idora/service'

export default function customCommand (
  command: string,
  kernel: Kernel,
  args: { _: string[], [key: string]: any }
) {
  const options: any = {}
  const excludeKeys = ['_', 'version', 'v', 'help', 'h']
  Object.keys(args).forEach(key => {
    if (!excludeKeys.includes(key)) {
      options[key] = args[key]
    }
  })

  kernel.run({
    name: command,
    opts: {
      _: args._,
      options,
      isHelp: args.h
    }
  })
}
