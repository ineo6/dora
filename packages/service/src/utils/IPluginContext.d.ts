import utils from '@idora/utils'
import joi from 'joi'

export declare interface IPluginContext {
  /**
   * 获取当前所有挂载的插件
   */
  plugins: Map<string, IPlugin>
  /**
   * 包含当前执行命令的相关路径集合
   */
  paths: IPaths
  /**
   * 获取当前执行命令所带的参数
   */
  runOpts: any
  /**
   * 为包 @tarojs/helper 的快捷使用方式，包含其所有 API
   */
  utils: utils
  /**
   * 注册一个可供其他插件调用的钩子，接收一个参数，即 Hook 对象
   */
  register: (hook: IHook) => void
  /**
   * 向 ctx 上挂载一个方法可供其他插件直接调用
   */
  registerMethod: (arg: (string | { name: string, fn?: Function }), fn?: Function) => void,
  /**
   * 注册一个自定义命令
   */
  registerCommand: (command: ICommand) => void
  /**
   * 为插件添加入参校验
   */
  addPluginOptsSchema: (fn: (joi: joi.Root) => void) => void
  [key: string]: any
}
