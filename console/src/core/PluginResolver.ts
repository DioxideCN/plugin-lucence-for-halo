import type {PluginCommand, PluginHolder, PluginList, PluginRenderer, PluginToolbar} from "@/extension/ArgumentPlugin";
import type {AbstractPlugin } from "@/extension/BasePlugin";
import {Stack} from "@/core/BasicStructure";
import type {ToolbarItemOptions} from "@toast-ui/editor/types/ui";
import type {LucenceCore} from "@/core/LucenceCore";
import {DefaultPlugin} from "@/plugin/DefaultPlugin";
import {ThemeGravityDom} from "@/plugin/ThemeGravityDom";

export class PluginResolver {

    private readonly _rawHolder: Map<string, PluginHolder> = new Map();
    private readonly _pluginList: PluginList = new Stack<PluginHolder>();
    private readonly _rawPluginList: AbstractPlugin[] = [];
    
    private _rendererSource: object = {};
    
    private core: LucenceCore | undefined;

    // 自动挂载的前置处理
    constructor() {
        // Default Plugin
        const defaultOne: DefaultPlugin = new DefaultPlugin();
        // Theme Gravity Dom
        const themeGravityDomOne = new ThemeGravityDom();
        // post constructor
        this.handlePostConstruct(defaultOne, themeGravityDomOne);
    }
    
    private handlePostConstruct(...plugins: AbstractPlugin[]) {
        for (let plugin of plugins) {
            this._rawPluginList.push(plugin); // raw plugin push in
            this.postConstructPlugin(plugin); // construct renderers
        }
    }
    
    public build(core: LucenceCore) {
        this.core = core;
    }
    
    private postConstructPlugin(plugin: AbstractPlugin): void {
        // detail数据校验
        if (!plugin.detail) {
            throw Error("Plugin doesn't have detail.");
        }
        // detail.icon校验
        if (!plugin.detail.icon || !matchUrl(plugin.detail.icon)) {
            throw Error("Plugin must provide a correct icon url.");
        }
        // detail.name校验
        if (!plugin.detail.name || !matchName(plugin.detail.name)) {
            throw Error("Plugin must provide a correct name.");
        }
        // detail.version校验
        if (!plugin.detail.version || !matchVersion(plugin.detail.version)) {
            throw Error("Plugin must provide a correct version.");
        }
        // detail.github校验
        if (!plugin.detail.github || !matchUrl(plugin.detail.github)) {
            throw Error("Plugin must provide a correct github url.");
        }
        // 剥离Renderer
        const renderers = plugin.createRenderer();
        const holder: PluginHolder = {
            key: plugin.detail.name,
            detail: plugin.detail,
            register: {
                toolbar: [],
                renderers: [],
                command: [],
                event: [],
            }
        };
        if (renderers !== null) {
            const _renderers = this.extractRenderers(renderers);
            // 合并对象
            Object.assign(this._rendererSource, this._rendererSource, _renderers);
            // 注入注册表
            for (let index = 0; index < renderers.length; index++) {
                holder.register.renderers.push({
                    key: `${plugin.detail.name}.renderer.${Object.keys(renderers[index])[1]}`,
                    desc: renderers[index].desc,
                });
            }
        }
        this._rawHolder.set(plugin.detail.name, holder);
    }

    // 装配Plugin
    private load(plugin: AbstractPlugin): void {
        this.checkCore();
        // build plugin
        plugin.build(this.core!);
        const holder: PluginHolder = this._rawHolder.get(plugin.detail.name)!;
        // 是否已经存在相同name和display的插件，如果是则不load这个插件并throw异常中断程序
        for (let elem of this._pluginList.elems()) {
            if (elem.key === plugin.detail.name) {
                throw Error(`Plugin id "${plugin.detail.name}" has been registered before, you should change your plugin id.`);
            }
        }
        // 插件的事件注册在BasicStructure#PluginEventHolder.register方法中进行实现
        const commands: PluginCommand[] | null = plugin.createCommands();
        // 注册toolbar
        const toolbar: PluginToolbar | null = plugin.createToolbar();
        if (toolbar) {
            const items: ToolbarItemOptions[] = toolbar.items;
            for (let i: number = 0; i < items.length; i++) {
                this.core!.editor.insertToolbarItem({
                    groupIndex: 0,
                    itemIndex: i,
                }, items[i]);
                holder.register.toolbar.push({
                    key: `${plugin.detail.name}.tool.${items[i].name}`,
                    name: `${items[i].name}`,
                    tooltip: `${items[i].tooltip}`,
                });
            }
        }
        // 注册commands
        if (commands) {
            for (let i = 0; i < commands.length; i++) {
                this.core!.editor.addCommand(
                    'markdown',
                    commands[i].name,
                    commands[i].command,
                )
                holder.register.command.push({
                    key: `${plugin.detail.name}.command.${i + 1}`,
                    name: `${commands[i].name}`,
                    returnType: `boolean`,
                });
            }
        }
        // 将构建完成的插件压栈
        this._rawHolder.delete(plugin.detail.name);
        this._pluginList.push(holder);
        plugin.onEnable();
    }
    
    // 卸载Plugin
    public disable(plugin: AbstractPlugin): void {
        // 弹栈
        plugin.onDisable();
    }
    
    // 自动挂载
    public autoload(): void {
        this.checkCore();
        for (let plugin of this._rawPluginList) {
            // 这时候的resolver必须经过了build
            this.load(plugin);
        }
        // 扫描
        this.scanAll();
    }
    
    // 扫描所有plugin并通过load挂载
    private scanAll() {
        
    }

    /**
     * 将插件实例中的渲染器全部分离到新的对象中
     */
    private extractRenderers(renderers: PluginRenderer) {
        return renderers.reduce((result, obj) => {
            // @ts-ignore
            const [key, value] = Object.entries(obj)[1];
            // @ts-ignore
            result[key] = value;
            return result;
        }, {});
    }
    
    private checkCore(): void {
        if (this.core === undefined) {
            throw Error("Core in plugin resolver shouldn't be undefined!");
        }
    }

    /**
     * 获取plugin列表
     */
    public get pluginList(): PluginHolder[] {
        return this._pluginList.elems();
    }

    /**
     * 获取renderer列表
     */
    public get rendererSource(): object {
        return this._rendererSource;
    }
    
}

function matchName(name: string): boolean {
    const regex: RegExp = /^[a-z_]+$/;
    return regex.test(name);
}

function matchVersion(version: string): boolean {
    const regex: RegExp = /^\d+\.\d+\.\d+$/;
    return regex.test(version);
}

function matchUrl(url: string): boolean {
    // 这是一个简单的URL匹配正则表达式，可能不适用于所有URL，但应该满足基本需求
    const regex: RegExp = 
        /^(https?:\/\/)?([^\s:\/?#]+)(:([0-9]+))?((\/[^\s?#]*)?(\?[^\s#]*)?(#\S*)?)?$/;
    return regex.test(url);
}
