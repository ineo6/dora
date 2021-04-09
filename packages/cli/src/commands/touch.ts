import { Kernel } from '@idora/service'

export default function touch(kernel: Kernel, {
  cmd,
  key,
  value,
  isHelp
}: {
  cmd: string,
  key?: string,
  value?: string,
  isHelp?: boolean
}) {
  kernel.run({
    name: 'touch',
    opts: {
      cmd,
      key,
      value,
      isHelp
    }
  })
}
