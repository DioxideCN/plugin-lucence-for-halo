import {AbstractPlugin} from "@/extension/BasePlugin";
import type {PluginDetail, PluginRenderer} from "@/extension/ArgumentPlugin";
import type {MdNode} from "@toast-ui/editor";

export class ThemeGravityDom extends AbstractPlugin {

    public readonly detail: PluginDetail = {
        icon: "https://dioxide-cn.ink/upload/gravity-logo.png",
        name: "theme_gravity_renderer",
        display: "Gravity主题渲染",
        author: "DioxideCN",
        version: "1.0.0",
        description: "嵌入Gravity主题的自定义DOM的显示支持",
        github: "https://github.com/DioxideCN/plugin-lucence-for-halo",
    };

    onEnable() {
        console.log("'Theme Gravity Custom DOM' extension has been loaded successfully...");
    }

    onDisable() {
        super.onDisable();
    }

    createRenderer(): PluginRenderer | null {
        return [
            {
                desc: "渲染Gravity主题的自定义Dom",
                gravity(node: MdNode): any {
                    return [
                        { type: 'openTag', tagName: 'big' },
                        { type: 'html', content: node.literal! },
                        { type: 'closeTag', tagName: 'big' },
                    ];
                },
            },
        ];
    }
    
}
