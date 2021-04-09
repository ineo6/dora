import { Kernel } from '@idora/service'

export default function nrm(kernel: Kernel, {
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
    name: 'nrm',
    opts: {
      cmd,
      key,
      value,
      isHelp
    }
  })
}
