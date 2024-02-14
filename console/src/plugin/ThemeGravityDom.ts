import {AbstractPlugin} from "@/extension/AbstractPlugin";
import type {PluginDetail, PluginRenderers, PluginComponents} from "@/extension/ArgumentPlugin";
import type {RendererContext} from "@/core/PluginResolver";

export class ThemeGravityDom extends AbstractPlugin {

    public readonly detail: PluginDetail = {
        icon: "https://dioxide-cn.ink/upload/gravity-logo.png",
        name: "theme_gravity_renderer",
        name: "Gravity主题渲染",
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

    createRenderer(): PluginRenderers | null {
        return [
            {
                name: 'gravity',
                desc: "渲染Gravity主题的自定义Dom",
                components: this.createRenderRule(),
            },
        ];
    }
    
    private createRenderRule(): PluginComponents {
        return {
            /*
             * $$gravity
             * name: big            // 对应rule中每个属性的key
             * owner: <string>      // 来自定义的属性，通过context.get来获取
             * repository: <string> // 来自定义的属性，通过context.get来获取
             * num: <number>        // 来自定义的属性，通过context.get来获取
             * [content]            // 自动检测，需要allowContent为true
             * $$
             */
            big: {
                desc: '测试',
                allowContent: true, // 默认为false
                allowContentHTML: true, // 默认为false，是否允许content被解析为html
                attributes: [ // 定义属性表单
                    {
                        $formkit: 'text',
                        name: 'owner',
                        label: '仓库所有者',
                        help: '填写该Github代码仓库的所有者',
                        validation: 'required',
                    },
                    {
                        $formkit: 'url',
                        name: 'repository',
                        label: '仓库名',
                        help: '填写该Github代码仓库的仓库名',
                        validation: 'required|url',
                    },
                ],
                render: function(context: RendererContext) {
                    const fragment: DocumentFragment = document.createDocumentFragment();
                    // 获取内插文本
                    const content: string = context.getContent();
                    // ------ build fragment
                    const bigDom: HTMLElement = document.createElement('big');
                    bigDom.dataset.owner = context.get('owner', 'default') as string;
                    bigDom.dataset.repository = context.get('repository', '') as string;
                    bigDom.innerHTML = content;
                    fragment.append(bigDom);
                    return fragment;
                }
            },
            demo: {
                desc: '测试2',
                render: function(context: RendererContext) {
                    const fragment: DocumentFragment = document.createDocumentFragment();
                    // 获取内插文本
                    const content: string = context.getContent();
                    // ------ build fragment
                    const bigDom: HTMLElement = document.createElement('big');
                    bigDom.dataset.owner = context.get('owner', 'default') as string;
                    bigDom.dataset.repository = context.get('repository', '') as string;
                    bigDom.innerHTML = content;
                    fragment.append(bigDom);
                    return fragment;
                }
            }
        };
    }
    
}
