import type {PluginCommand, PluginDetail, PluginRenderer, PluginToolbar} from "@/extension/ArgumentPlugin";
import type {LucenceCore} from "@/core/LucenceCore";
import type {PluginContext} from "@toast-ui/editor";
import type {PluginOptions} from "@toast-ui/editor-plugin-code-syntax-highlight";

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
     * 生命周期：插件挂载并启用时
     * 必要时三方开发者需要对基类进行覆写
     */
    onEnable(): void {
    };

    /**
     * 生命周期：插件禁用并卸载时
     * 必要时三方开发者需要对基类进行覆写
     */
    onDisable(): void {
    };

    /**
     * 创建：插件的Toolbar项目
     * 必要时三方开发者需要对基类进行覆写
     */
    createToolbar(): PluginToolbar | null {
        return null;
    };

    /**
     * 创建：插件需要使用到的commands
     * 必要时三方开发者需要对基类进行覆写
     */
    createCommands(): PluginCommand[] | null {
        return null;
    };

    /**
     * 创建：前置类型的渲染器构造方法
     * 必要时三方开发者需要对基类进行覆写
     */
    createRenderer(): PluginRenderer | null {
        return null;
    };
    
}
