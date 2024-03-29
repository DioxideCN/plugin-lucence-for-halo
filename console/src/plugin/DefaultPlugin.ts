import { PopupBuilder } from "@/util/PopupBuilder";
import { ContextUtil } from "@/util/ContextUtil";
import { AbstractPlugin } from "@/extension/AbstractPlugin";
import type {PluginToolbar, PluginCommand, PluginDetail, PluginRenderers} from "@/extension/ArgumentPlugin";
import type {RendererContext} from "@/core/PluginResolver";
// @ts-ignore
import katex from 'katex';

/**
 * 这是一个最基本的Lucence的插件
 */
export class DefaultPlugin extends AbstractPlugin {

    public readonly detail: PluginDetail = {
        icon: "https://dioxide-cn.ink/upload/logo-lucence.png",
        name: "内置扩展",
        author: "DioxideCN",
        version: "1.0.0",
        description: "Lucence Editor自带的基础扩展，不可卸载或禁用，该扩展为Lucence Editor编辑器提供基本的运行负载，包括：Toolbar选项、HTML渲染器、事件触发器、基本指令扩展等。",
        github: "https://github.com/DioxideCN/plugin-lucence-for-halo",
    };
    
    onEnable() {
        console.log("Default extension has been loaded successfully...");
    }

    onDisable() {
        super.onDisable();
    }

    /**
     * 定义插件的Toolbar工具栏
     */
    public createToolbar(): PluginToolbar {
        return {
            append: 'start',
            items: [
                {
                    name: 'tool-head',
                    tooltip: '标题',
                    className: 'fa-solid fa-heading',
                    state: 'heading',
                    popup: {
                        body: (() => {
                            const callback = (level: number): void => {
                                this.closePopup();
                                this.core!.editor.eventEmitter.emit('command', 'heading', { level });
                            }
                            const headings = [
                                { level: 1, text: '# 一级标题' },
                                { level: 2, text: '## 二级标题' },
                                { level: 3, text: '### 三级标题' },
                                { level: 4, text: '#### 四级标题' },
                                { level: 5, text: '##### 五级标题' },
                                { level: 6, text: '###### 六级标题' },
                            ];
                            const headingElements = headings.map(({ level, text }) =>
                                PopupBuilder.UseRegular.heading(level, text, callback)
                            );
                            return PopupBuilder.build('标题', this.core!.editor, ...headingElements,);
                        })(),
                        className: 'popup-tool-heading',
                        style: {},
                    }
                },
                {
                    name: 'tool-bold',
                    tooltip: '加粗',
                    command: 'bold',
                    className: 'fa-solid fa-bold',
                    state: 'strong',
                },
                {
                    name: 'tool-italic',
                    tooltip: '斜体',
                    command: 'italic',
                    className: 'fa-solid fa-italic',
                    state: 'emph',
                },
                {
                    name: 'tool-strike',
                    tooltip: '删除线',
                    command: 'strike',
                    className: 'fa-solid fa-strikethrough',
                    state: 'strike',
                },
                {
                    name: 'tool-li',
                    tooltip: '无序列表',
                    command: 'bulletList',
                    className: 'fa-solid fa-list-ul',
                    state: 'bulletList',
                },
                {
                    name: 'tool-ol',
                    tooltip: '有序列表',
                    command: 'orderedList',
                    className: 'fa-solid fa-list-ol',
                    state: 'orderedList',
                },
                {
                    name: 'tool-task',
                    tooltip: '任务列表',
                    command: 'taskList',
                    className: 'fa-solid fa-list-check',
                    state: 'taskList',
                },
                {
                    name: 'tool-quote',
                    tooltip: '引用',
                    command: 'blockQuote',
                    className: 'fa-solid fa-quote-left',
                    state: 'blockQuote',
                },
                {
                    name: 'tool-code',
                    tooltip: '行内代码',
                    command: 'code',
                    className: 'fa-solid fa-code',
                    state: 'code',
                },
                {
                    name: 'tool-codeBlock',
                    tooltip: '代码块',
                    command: 'codeBlock',
                    className: 'fa-solid fa-laptop-code',
                    state: 'codeBlock',
                },
                {
                    name: 'tool-table',
                    tooltip: '表格',
                    className: 'fa-solid fa-table',
                    state: 'table',
                    popup: {
                        body: (() => {
                            const callback = (x: number, y: number) => {
                                this.closePopup();
                                this.insertTable(x, y);
                            }
                            const tableDom = PopupBuilder.UseRegular.table(callback);
                            return PopupBuilder.build('表格', this.core!.editor, tableDom);
                        })(),
                        className: 'popup-tool-table',
                        style: { width: '240px' },
                    }
                },
                {
                    name: 'tool-link',
                    tooltip: '链接',
                    className: 'fa-solid fa-link',
                    popup: {
                        body: (() => {
                            const callback = (alt: string, url: string) => {
                                this.closePopup();
                                this.insertLink(alt, url);
                            }
                            const linkDom = PopupBuilder.UseRegular.link(callback);
                            return PopupBuilder.build('链接', this.core!.editor, linkDom);
                        })(),
                        className: 'popup-tool-link',
                        style: { width: '300px' },
                    }
                },
                {
                    name: 'tool-image',
                    tooltip: '图片',
                    className: 'fa-solid fa-image',
                    popup: {
                        body: (() => {
                            const callback = (alt: string, url: string) => {
                                this.closePopup();
                                this.insertImage(alt, url);
                            }
                            const linkDom = PopupBuilder.UseRegular.image(callback);
                            return PopupBuilder.build('图片', this.core!.editor, linkDom);
                        })(),
                        className: 'popup-tool-image',
                        style: { width: '300px' },
                    }
                },
                {
                    name: 'tool-emoji',
                    tooltip: '表情',
                    className: 'fa-solid fa-face-laugh-wink',
                    popup: {
                        body: (() => {
                            const emojiElement = PopupBuilder.UseRegular.emoji(
                                (emoji: string) => {
                                    this.closePopup();
                                    this.insertEmoji(emoji);
                                },
                                ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','😘','😗','😙','😚','😋','😛','😝','😜','🤓','😎','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','😢','😭','😤','😠','😡','😳','😱','😨','🤗','🤔','😶','😑','😬','🙄','😯','😴','😷','🤑','😈','🤡','💩','👻','💀','👀','👣','👐','🙌','👏','🤝','👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤘','👌','👈','👉','👆','👇','☝️','✋','🤚','🖐','🖖','👋','🤙','💪','🖕','✍️','🙏']
                            );
                            return PopupBuilder.build('表情', this.core!.editor, emojiElement);
                        })(),
                        className: 'popup-tool-emoji',
                        style: {},
                    },
                },
            ]
        }
    }

    /**
     * 定义插件的commands
     */
    public createCommands(): PluginCommand[] {
        return [
            {
                name: 'latexBlock',
                command: (): boolean => {
                    return ContextUtil.UseRegular.createLatex(this.core!.editor);
                }
            }
        ]
    }

    createRenderer(): PluginRenderers | null {
        return [
            {
                name: 'latex',
                desc: "插入多行Latex公式",
                components: {
                    latex: {
                        allowContent: true,
                        desc: '插入多行Latex公式',
                        icon: 'fa-solid fa-square-root-variable',
                        render: function (context: RendererContext): HTMLElement {
                            const latexParagraph: HTMLParagraphElement = document.createElement('p');
                            latexParagraph.classList.add('lucence-block-latex')
                            // 渲染块状latex
                            const raw: string = context.getContent();
                            const span: HTMLSpanElement = document.createElement('span');
                            try {
                                katex.render(raw, span);
                            } catch (e) {
                                span.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Wrong Latex syntax!'
                                span.style.color = 'rgb(228, 105, 98)';
                                span.style.fontStyle = 'italic';
                            }
                            latexParagraph.innerHTML = span.outerHTML;
                            return latexParagraph;
                        }
                    }
                }
            }
        ];
    }

    private closePopup(): void {
        PopupBuilder.closePopup(this.core!.editor);
    }

    // 插入表情
    private insertEmoji(emoji: string): boolean {
        return ContextUtil.UseRegular.createEmoji(emoji, this.core!.editor);
    }
    
    // 插入表格
    private insertTable(x: number, y: number): boolean {
        return ContextUtil.UseRegular.createTable(x, y, this.core!.editor);
    }
    
    // 插入超链接
    private insertLink(alt: string, url: string): boolean {
        return ContextUtil.UseRegular.createLink(alt, url, this.core!.editor);
    }
    
    // 插入图片
    private insertImage(alt: string, url: string): boolean {
        return ContextUtil.UseRegular.createImage(alt, url, this.core!.editor);
    }
    
}


