export const PRESET_PREFIX = '@idora/preset-';
export const PLUGIN_PREFIX = '@idora/plugin-';

export const IS_EVENT_HOOK = /^on/;
export const IS_ADD_HOOK = /^add/;
export const IS_MODIFY_HOOK = /^modify/;

export const presetOrPluginPrefixReg = new RegExp(`^${PRESET_PREFIX}|${PLUGIN_PREFIX}`);

export enum PluginType {
  Preset = 'Preset',
  Plugin = 'Plugin'
}

export const PluginNamePrefix = {
  [PluginType.Preset]: PLUGIN_PREFIX,
  [PluginType.Plugin]: PLUGIN_PREFIX,
};
