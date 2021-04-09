import * as path from 'path'

export default () => {
  return {
    plugins: [
      // commands
      path.resolve(__dirname, 'commands/nrm.js'),
      path.resolve(__dirname, 'commands/touch/index.js')
    ]
  }
}
