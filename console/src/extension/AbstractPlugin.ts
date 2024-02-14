import type {
    PluginCommand,
    PluginDetail,
    PluginEventDefinition,
    PluginRenderers,
    PluginToolbar
} from "@/extension/ArgumentPlugin";
import type {LucenceCore} from "@/core/LucenceCore";

export abstract class AbstractPlugin {
    
    protected core: LucenceCore | undefined;
    public abstract readonly detail: PluginDetail;

    constructor() {
    }
    
    build(core: LucenceCore): AbstractPlugin {
        this.core = core;
        return this;
    }

    /**
     * 生命周期：插件挂载并启用时调用该方法
     */
    onEnable(): void {
    };

    /**
     * 生命周期：插件禁用并卸载时调用该方法
     */
    onDisable(): void {
    };

    /**
     * 创建：插件的Toolbar工具
     */
    createToolbar(): PluginToolbar | null {
        return null;
    };

    /**
     * 创建：插件需要使用到的Commands
     */
    createCommands(): PluginCommand[] | null {
        return null;
    };

    /**
     * 创建：插件的渲染器与组件
     */
    createRenderer(): PluginRenderers | null {
        return null;
    };

    /**
     * 创建：插件的事件监听器
     */
    createEventListener(): PluginEventDefinition[] | null {
        return null;
    }
    
}
