import type {ToolbarItemOptions} from "@toast-ui/editor/types/ui";
import type {CommandFn} from "@toast-ui/editor/types/plugin";
import type {Stack} from "@/core/BasicStructure";
import type {MdNode, PluginInfo} from "@toast-ui/editor";
import type {HTMLConvertor, HTMLToken} from "@toast-ui/editor/types/toastmark";
import type {CustomHTMLRenderer} from "@toast-ui/editor/types/editor";
import type {RendererContext} from "@/core/PluginResolver";

export type PluginToolbar = {
    append: 'start' | 'end',
    items: ToolbarItemOptions[],
}

export type PluginCommand = {
    name: string,
    command: CommandFn,
}

/**
 * 暴露给第三方开发者的插件信息定义类型
 */
export type PluginDetail = {
    icon: string,
    name: string,
    display: string,
    author: string,
    version: string,
    description: string,
    github: string,
}
/**
 * 扩展槽的信息统计
 */
export type PluginHolder = {
    key: string,
    detail: PluginDetail,
    register: {
        toolbar: {
            key: string,
            name: string,
            tooltip: string,
        }[],
        renderers: {
            key: string,
            name: string,
            desc: string,
            components: PluginComponents,
        }[],
        command: {
            key: string,
            name: string,
            returnType: string,
        }[],
        event: {
            key: string,
            eventType: PluginEvent,
            desc: string | undefined,
        }[],
    }
}
export type PluginList = Stack<PluginHolder>;

export type PluginEvent = 
    // 文本事件
    "content_input"      |
    "content_delete"     |
    "content_select"     |
    "content_change"     |
    // 渲染事件
    "render_latex"       |
    "render_mermaid"     |
    "render_code"        |
    "render_html"        |
    // 檢索事件
    "search_text"        |
    "search_regex"       |
    "search_next"        |
    "search_prev"        |
    // 切換事件
    "switch_autosave"    |
    "switch_search"      |
    "switch_preview"     |
    // 其它事件
    "window_resize"      |
    "theme_change";

export type EventHandler = () => void;
export type PluginEventDefinition = {
    type: PluginEvent,
    desc: string | undefined,
    callback: EventHandler,
};
export type PluginEventConverter = {
    source: string,
    callback: EventHandler,
}

// ------ 插件组件类型

export interface PluginRenderer {
    desc: string,
    name: string,
    components: PluginComponents,
}
export type PluginRenderers = PluginRenderer[];

export type PluginComponent = {
    desc?: string,    // 描述
    showInComponents?: boolean | undefined, // 是否在组件中启用自动插入，默认为true
    allowContent?: boolean | undefined;
    allowContentHTML?: boolean | undefined;
    attributes?: Record<string, any> | undefined,
    render: (context: RendererContext) => DocumentFragment;
};
export type PluginComponents = Record<string, PluginComponent>;
