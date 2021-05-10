import Kernel from './Kernel';
import { ICommand, IHook } from './utils/types';

function processArgs(args: string | any[]) {
  let name;
  let fn;
  if (!args.length) {
    // eslint-disable-next-line no-throw-literal
    throw '参数为空';
  } else if (args.length === 1) {
    if (typeof args[0] === 'string') {
      name = args[0];
    } else {
      name = args[0].name;
      fn = args[0].fn;
    }
  } else {
    name = args[0];
    fn = args[1];
  }
  return {
    name,
    fn,
  };
}

export default class Plugin {
  id: string

  path: string

  ctx: Kernel

  optsSchema: Function | undefined

  constructor(opts: { id: any; path: any; ctx: any }) {
    this.id = opts.id;
    this.path = opts.path;
    this.ctx = opts.ctx;
  }

  register(hook: IHook) {
    if (typeof hook.name !== 'string') {
      throw new Error(`插件 ${this.id} 中注册 hook 失败， hook.name 必须是 string 类型`);
    }
    if (typeof hook.fn !== 'function') {
      throw new Error(`插件 ${this.id} 中注册 hook 失败， hook.fn 必须是 function 类型`);
    }
    const hooks = this.ctx.hooks.get(hook.name) || [];
    hook.plugin = this.id;
    this.ctx.hooks.set(hook.name, hooks.concat(hook));
  }

  registerCommand(command: ICommand) {
    if (this.ctx.commands.has(command.name)) {
      throw new Error(`命令 ${command.name} 已存在`);
    }
    this.ctx.commands.set(command.name, command);
    this.register(command);
  }

  registerMethod(...args: string[]) {
    const { name, fn } = processArgs(args);
    if (this.ctx.methods.has(name)) {
      throw `已存在方法 ${name}`;
    }
    this.ctx.methods.set(name, fn || ((fn: Function) => {
      this.register({
        name,
        fn,
      });
    }));
  }

  addPluginOptsSchema(schema: Function | undefined) {
    this.optsSchema = schema;
  }
}
