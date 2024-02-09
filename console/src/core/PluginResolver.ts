import type {
    PluginCommand,
    PluginHolder,
    PluginList,
    PluginRenderers,
    PluginToolbar
} from "@/extension/ArgumentPlugin";
import type {AbstractPlugin } from "@/extension/BasePlugin";
import {Stack} from "@/core/BasicStructure";
import type {ToolbarItemOptions} from "@toast-ui/editor/types/ui";
import type {LucenceCore} from "@/core/LucenceCore";
import {DefaultPlugin} from "@/plugin/DefaultPlugin";
import type {MdNode} from "@toast-ui/editor";
// @ts-ignore
import katex from 'katex';
import axios, {type AxiosInstance} from "axios";
import type {LucencePluginList} from "@/extension/ExtentedPluginType";

/**
 * {@link PluginResolver}（PR解释器）负责处理Lucence Editor中所有插件的挂载任务，
 * PR解释器在{@link LucenceCore}的构造函数中实例化，实例化会先硬加载default插件，再
 * 调用{@link #handlePostConstruct}完成后置处理，后置处理会将所有plugin实例压栈到
 * {@code this._rawPluginList}中，再调用{@link #postConstructPlugin}方法，该方法
 * 会将插件中的原始渲染器（Renderer）构造为可以被Toast UI Editor挂载的自定义渲染器，
 * 渲染器中的所有组件中的render属性即被压入{@code this._rendererSource}的目标渲染器。
 * <p>
 * PR解释器完成后置构造后再由{@link LucenceCore}调用{@link #build}方法完成{@code this.core}
 * 的注入，再对插件剩下的注册事件进行调用注册。
 */
export class PluginResolver {
    
    public static HTTP: AxiosInstance = axios.create({
        baseURL: "/",
        timeout: 1000,
    });

    private readonly _rawHolder: Map<string, PluginHolder> = new Map();
    private readonly _rawPluginList: AbstractPlugin[] = [];
    private readonly _pluginList: PluginList = new Stack<PluginHolder>();
    
    // ------ 初始化渲染器
    private _rendererSource: Record<string, any> = {
        codeBlock(node: any):any {
            if (node.info === "mermaid") {
                return [
                    { type: 'openTag', tagName: 'div', classNames: [node.info, 'mermaid-box', 'show-mermaid'] },
                    { type: 'openTag', tagName: 'div', classNames: [node.info, 'mermaid-to-render'] },
                    { type: 'text', content: node.literal! },
                    { type: 'closeTag', tagName: 'div' },
                    { type: 'openTag', tagName: 'div', classNames: [node.info, 'hide-mermaid'] },
                    { type: 'text', content: node.literal! },
                    { type: 'closeTag', tagName: 'div' },
                    { type: 'closeTag', tagName: 'div' },
                ];
            }
            return [
                { type: 'openTag', tagName: 'pre', classNames: ['language-' + node.info] },
                { type: 'openTag', tagName: 'code', classNames: ['hljs', 'language-' + node.info] },
                { type: 'text', content: node.literal! },
                { type: 'closeTag', tagName: 'code' },
                { type: 'closeTag', tagName: 'pre' },
            ];
        },
        text(node: any): any {
            // 渲染行内latex
            const content: string = node.literal;
            const regex: RegExp = /\$(.+?)\$/g;
            let result: any;
            let lastIndex: number = 0;
            const tokens: any = [];
            while (result = regex.exec(content)) {
                const [match, innerContent] = result;
                if (lastIndex !== result.index) {
                    tokens.push({
                        type: 'text',
                        content: content.slice(lastIndex, result.index),
                    });
                }
                const span = document.createElement('span');
                try {
                    katex.render(innerContent, span);
                    // 检查渲染后的内容是否为空
                    if (span.innerHTML.trim() !== "") {
                        tokens.push({
                            type: 'html',
                            content: span.outerHTML,
                        });
                    } else {
                        tokens.push({
                            type: 'text',
                            content: match,
                        });
                    }
                } catch (e) {
                    // 如果渲染失败，则回退到原始文本
                    tokens.push({
                        type: 'text',
                        content: match,
                    });
                }
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < content.length) {
                tokens.push({
                    type: 'text',
                    content: content.slice(lastIndex),
                });
            }
            return tokens;
        }
    };
    
    private core: LucenceCore | undefined;

    // 自动挂载的前置处理
    public async postConstructor() {
        const rawPlugins: AbstractPlugin[] = [];
        // load Default Plugin
        const defaultOne: DefaultPlugin = new DefaultPlugin();
        rawPlugins.push(defaultOne);
        await PluginResolver.HTTP
            .get<LucencePluginList>("/apis/lucence.plugin.halo.run/v1alpha1/lucencePlugins")
            .then(async (response) => {
                const plugins = response.data.items;
                for (let plugin of plugins) {
                    await import(plugin.detail.source).then(module => {
                        if (plugin.detail.enable) {
                            // load plugin
                            rawPlugins.push(new module.default);
                        }
                    }).catch(error => {
                        // Can't resolve plugin
                        console.error(error)
                    })
                }
                // post constructor
                this.handlePostConstruct(rawPlugins);
            });
    }
    
    private handlePostConstruct(plugins: AbstractPlugin[]) {
        for (let plugin of plugins) {
            this._rawPluginList.push(plugin); // raw plugin push in
            this.postConstructPlugin(plugin); // construct renderers
        }
    }
    
    public build(core: LucenceCore) {
        this.core = core;
    }
    
    // 后置微内核构建
    private postConstructPlugin(plugin: AbstractPlugin): void {
        // 校验detail
        this.checkDetail(plugin);
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
        // 剥离Renderer
        const renderers: PluginRenderers | null = plugin.createRenderer();
        if (renderers !== null) {
            for (let renderer of renderers) {
                // renderer.name为PluginRenderer对象的主要名称
                this._rendererSource[renderer.name] = function (node: MdNode): any {
                    // 获取node.literal!中的name即渲染哪个rule
                    if (node.literal === null) return null;
                    const rawContent: string = node.literal;
                    const match = rawContent.match(/name:\s*([^\n]+)/);
                    if (!match || !match[1]) {
                        return null;
                    }
                    const componentName: string = match[1];
                    if (renderer.components[componentName] === undefined) return null;
                    // 展开来自渲染器组件中的所有formKit的名称
                    const attrs: string[] = renderer.components[componentName].attributes ? renderer.components[componentName].attributes!.map((item: any) => item.name) : [];
                    // TODO 对attribute逐个调用validate方法进行校验
                    const context: RendererContext = PluginResolver.parseRendererFromLiteral(rawContent, attrs);
                    // 调用render方法渲染
                    const fragment: DocumentFragment = renderer.components[componentName].render(context);
                    const outerDiv: HTMLDivElement = document.createElement('div');
                    outerDiv.appendChild(fragment);
                    return [
                        { type: 'openTag', tagName: 'div' },
                        { type: 'html', content: outerDiv.innerHTML, },
                        { type: 'closeTag', tagName: 'div' },
                    ];
                }
                // 注入注册表
                holder.register.renderers.push({
                    key: `${plugin.detail.name}.renderer.${renderer.name}`,
                    name: `${renderer.name}`,
                    desc: renderer.desc,
                    // 指示这个渲染器下有哪些组件
                    components: renderer.components,
                });
            }
        }
        this._rawHolder.set(plugin.detail.name, holder);
    }

    private static parseRendererFromLiteral(literal: string, attrs: string[]): RendererContext {
        const attributes: Record<string, any> = {};
        let content: string = '';
        if (attrs.length !== 0) {
            // @ts-ignore
            const remainingAttrs = Object.fromEntries(attrs.map(attr => [attr, true]));
            literal.split('\n').map(line => {
                const [key, value]: string[] = line.split(':').map(part => part.trim());
                if (key in remainingAttrs) {
                    delete remainingAttrs[key];
                    if (/^\d+$/.test(value)) {
                        attributes[key] = parseInt(value, 10);
                    } else if (value === 'true' || value === 'false') {
                        attributes[key] = value === 'true';
                    } else {
                        attributes[key] = value;
                    }
                } else if (key !== 'name') {
                    content += line;
                }
            });
        } else {
            literal.split('\n').map(line => {
                const [key, value]: string[] = line.split(':').map(part => part.trim());
                if (key !== 'name') {
                    content += line;
                }
            })
        }
        return new RendererContext(attributes, content);
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
    
    private checkCore(): void {
        if (this.core === undefined) {
            throw Error("Core in plugin resolver shouldn't be undefined!");
        }
    }
    
    private checkDetail(plugin: AbstractPlugin) {
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

export class RendererContext {
    
    private readonly _attributes: Record<string, string | number | boolean>;
    
    private readonly _content: string;
    
    constructor(attributes: Record<string, string | number | boolean>, content: string) {
        this._attributes = attributes;
        this._content = content;
    }

    public get(key: string, or?: string | number | boolean): string | number | boolean {
        if (this._attributes[key] !== undefined) {
            return this._attributes[key];
        } else {
            return or !== undefined ? or : '';
        }
    }
    
    public getContent(): string {
        return this._content;
    }
    
}
