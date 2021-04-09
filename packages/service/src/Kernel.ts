import { EventEmitter } from 'events'
import { AsyncSeriesWaterfallHook } from 'tapable'
import * as joi from 'joi'
import { createDebug } from '@idora/utils'

import * as utils from './utils'
import { ICommand, IHook, IPaths, IPlugin, IPreset } from './utils/types'
import { IS_ADD_HOOK, IS_EVENT_HOOK, IS_MODIFY_HOOK, PluginType } from './utils/constants'
import { convertPluginsToObject, mergePlugins, printHelpLog, resolvePresetsOrPlugins } from './utils'
import Plugin from './Plugin'

export type PluginItem = string | [string, object]

interface IKernelOptions {
  appPath: string
  presets?: PluginItem[]
  plugins?: PluginItem[]
}

export default class Kernel extends EventEmitter {
  appPath: string

  isProduction: boolean = false

  optsPresets: PluginItem[] | void

  optsPlugins: PluginItem[] | void

  plugins: Map<string, IPlugin> | undefined

  paths: IPaths | undefined = undefined

  extraPlugins: IPlugin[] = []

  hooks: Map<string, IHook[]>

  methods: Map<string, Function>

  commands: Map<string, ICommand>

  utils: any

  runOpts: any

  debugger: any

  constructor (options: IKernelOptions) {
    super()
    this.debugger = createDebug('Dora:Kernel')
    this.appPath = options.appPath || process.cwd()
    this.optsPresets = options.presets
    this.optsPlugins = options.plugins
    this.hooks = new Map()
    this.methods = new Map()
    this.commands = new Map()
    this.initHelper()
  }

  async init () {
    this.debugger('init')

    this.initPresetsAndPlugins()
    await this.applyPlugins('onReady')
  }

  initHelper () {
    this.utils = utils
    this.debugger('initHelper')
  }

  initPresetsAndPlugins () {
    const allConfigPresets = mergePlugins(this.optsPresets || [], [])()
    const allConfigPlugins = mergePlugins(this.optsPlugins || [], [])()
    this.debugger('initPresetsAndPlugins', allConfigPresets, allConfigPlugins)

    this.plugins = new Map()
    this.extraPlugins = []
    this.resolvePresets(allConfigPresets)
    this.resolvePlugins(allConfigPlugins)
  }

  resolvePresets (presets: any) {
    const allPresets = resolvePresetsOrPlugins(this.appPath, presets, PluginType.Preset)
    while (allPresets.length) {
      this.initPreset(allPresets.shift()!)
    }
  }

  resolvePlugins (plugins: any) {
    const allPlugins = resolvePresetsOrPlugins(this.appPath, plugins, PluginType.Plugin)
    const _plugins = [...this.extraPlugins, ...allPlugins]
    while (_plugins.length) {
      this.initPlugin(_plugins.shift()!)
    }
    this.extraPlugins = []
  }

  initPreset (preset: IPreset) {
    this.debugger('initPreset', preset)
    const { id, path, opts, apply } = preset
    const pluginCtx = this.initPluginCtx({
      id,
      path,
      ctx: this
    })
    const { presets, plugins } = apply()(pluginCtx, opts) || {}
    this.registerPlugin(preset)
    if (Array.isArray(presets)) {
      const _presets = resolvePresetsOrPlugins(this.appPath, convertPluginsToObject(presets)(), PluginType.Preset)
      while (_presets.length) {
        this.initPreset(_presets.shift()!)
      }
    }
    if (Array.isArray(plugins)) {
      this.extraPlugins.push(...resolvePresetsOrPlugins(this.appPath, convertPluginsToObject(plugins)(), PluginType.Plugin))
    }
  }

  initPlugin (plugin: IPlugin) {
    const { id, path, opts, apply } = plugin
    const pluginCtx = this.initPluginCtx({
      id,
      path,
      ctx: this
    })
    this.debugger('initPlugin', plugin)
    this.registerPlugin(plugin)
    apply()(pluginCtx, opts)
    this.checkPluginOpts(pluginCtx, opts)
  }

  checkPluginOpts (pluginCtx: Plugin, opts: any) {
    if (typeof pluginCtx.optsSchema !== 'function') {
      return
    }
    const schema = pluginCtx.optsSchema(joi)
    if (!joi.isSchema(schema)) {
      throw `插件${pluginCtx.id}中设置参数检查 schema 有误，请检查！`
    }
    const { error } = schema.validate(opts)
    if (error) {
      error.message = `插件${pluginCtx.id}获得的参数不符合要求，请检查！`
      throw error
    }
  }

  registerPlugin (plugin: IPlugin) {
    if (this.plugins!.has(plugin.id)) {
      throw new Error(`插件 ${plugin.id} 已被注册`)
    }
    this.plugins!.set(plugin.id, plugin)
  }

  initPluginCtx ({ id, path, ctx }: { id: string, path: string, ctx: Kernel }) {
    const pluginCtx = new Plugin({
      id,
      path,
      ctx
    })
    const internalMethods = ['onReady', 'onStart']
    const kernelApis = [
      'appPath',
      'plugins',
      'paths',
      'utils',
      'runOpts',
      'applyPlugins'
    ]
    internalMethods.forEach(name => {
      if (!this.methods.has(name)) {
        pluginCtx.registerMethod(name)
      }
    })
    return new Proxy(pluginCtx, {
      get: (target, name: string) => {
        if (this.methods.has(name)) return this.methods.get(name)
        if (kernelApis.includes(name)) {
          return typeof this[name] === 'function' ? this[name].bind(this) : this[name]
        }
        return target[name]
      }
    })
  }

  async applyPlugins (args: string | { name: string, initialVal?: any, opts?: any }) {
    let name: string
    let initialVal
    let opts: any
    if (typeof args === 'string') {
      name = args
    } else {
      name = args.name
      initialVal = args.initialVal
      opts = args.opts
    }
    this.debugger('applyPlugins')
    this.debugger(`applyPlugins:name:${name}`)
    this.debugger(`applyPlugins:initialVal:${initialVal}`)
    this.debugger(`applyPlugins:opts:${opts}`)
    if (typeof name !== 'string') {
      throw new Error('调用失败，未传入正确的名称！')
    }
    const hooks = this.hooks.get(name) || []
    const waterfall = new AsyncSeriesWaterfallHook(['arg'])
    if (hooks.length) {
      const resArr: any[] = []
      for (const hook of hooks) {
        waterfall.tapPromise({
          name: hook.plugin!,
          stage: hook.stage || 0,
          before: hook.before
        }, async arg => {
          const res = await hook.fn(opts, arg)
          if (IS_MODIFY_HOOK.test(name) && IS_EVENT_HOOK.test(name)) {
            return res
          }
          if (IS_ADD_HOOK.test(name)) {
            resArr.push(res)
            return resArr
          }
          return null
        })
      }
    }
    return await waterfall.promise(initialVal)
  }

  setRunOpts (opts: any) {
    this.runOpts = opts
  }

  async run (args: string | { name: string, opts?: any }) {
    let name
    let opts
    if (typeof args === 'string') {
      name = args
    } else {
      name = args.name
      opts = args.opts
    }
    this.debugger('command:run')
    this.debugger(`command:run:name:${name}`)
    this.debugger('command:runOpts')
    this.debugger(`command:runOpts:${JSON.stringify(opts, null, 2)}`)
    this.setRunOpts(opts)
    await this.init()
    this.debugger('command:onStart')
    await this.applyPlugins('onStart')
    if (!this.commands.has(name)) {
      throw new Error(`${name} 命令不存在`)
    }
    if (opts && opts.isHelp) {
      const command = this.commands.get(name)
      const defaultOptionsMap = new Map()
      defaultOptionsMap.set('-h, --help', 'output usage information')
      let customOptionsMap = new Map()
      if (command?.optionsMap) {
        customOptionsMap = new Map(Object.entries(command?.optionsMap))
      }
      const optionsMap = new Map([...customOptionsMap, ...defaultOptionsMap])
      printHelpLog(name, optionsMap, command?.synopsisList ? new Set(command?.synopsisList) : new Set())
      return
    }

    await this.applyPlugins({
      name,
      opts
    })
  }
}
