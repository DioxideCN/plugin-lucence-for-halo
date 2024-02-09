import mermaid from 'mermaid';
import hljs from 'highlight.js';

import type {Ref} from "vue";
import {ref} from "vue";
import {Editor} from "@toast-ui/editor";
import {ContextUtil} from "@/util/ContextUtil";
import {SearchUtil} from "@/util/SearchUtil";
import type {AreaType, CacheType} from "@/core/TypeDefinition";
import type {SelectionPos} from "@toast-ui/editor/types/editor";
import type {
    EventHandler,
    PluginEvent,
    PluginHolder,
    PluginRenderer,
    PluginComponent
} from "@/extension/ArgumentPlugin";
import {PluginEventHolder} from "@/core/BasicStructure";
import type {AbstractPlugin} from "@/extension/BasePlugin";
import {PluginResolver, RendererContext} from "@/core/PluginResolver";
import {LineWalker} from "@/kernel/LineWalker";
import type {LucencePlugin} from "@/extension/ExtentedPluginType";
import axios, {type AxiosInstance} from "axios";

export class LucenceCore {
    
    // define cache in core
    private static _cache: Ref<CacheType> = ref({
        line: {
            oldLineCount: 1,
            prevIndexMap: new Map<number, number>(),
        },
        feature: {
            preview: true,                   // 启用预览
            autoSave: true,                  // 自动保存
            search: {
                enable: false,               // 开启查找
                replace: false,              // 开启替换
                condition: {
                    capitalization: false,   // 大小写敏感
                    regular: false,          // 正则查找
                    keepCap: false,          // 保留大小写
                },
                result: {
                    total: 0,                // 结果总数
                    hoverOn: 0,              // 正在聚焦
                    list: [],                // 搜索结果集
                },
            },
            count: {
                words: 0,                    // 总计词数
                characters: 0,               // 总计字符数
                selected: 0,                 // 已选择字符数
            },
            focus: {
                row: 1,                      // 聚焦的行
                col: 1,                      // 聚焦的列
            },
        },
        theme: LucenceCore.getTheme(),       // 深浅色模式
        plugin: {
            loaded: false,                   // 挂载状态
            enable: false,                   // 开启插件菜单
        },
        components: {
            loaded: false,                   // 挂载状态
            enable: false,                   // 开启组件库
        },
    });

    // define editor instance
    private instance: Editor | undefined;
    
    // area 依赖于 afterMounted
    private area: AreaType | undefined;

    // event holder
    private eventHolder: PluginEventHolder | undefined;
    
    // plugin resolver --- 前置构造先完成renderer注入
    private resolver: PluginResolver = new PluginResolver();
    
    // line walker
    private lineWalker: LineWalker | undefined;

    // 搜索节流器
    private searchThrottleTimer: number | undefined;

    /**
     * 构造器内完成对ToastUIEditor的定义
     * 这包括toolbar、自定义的渲染规则和命令注册
     */
    public async postConstructor(rawContent: string) {
        await this.resolver.postConstructor();
        const editorOuter: HTMLElement =
            document.querySelector('#toast-editor') as HTMLElement;
        if (!editorOuter) {
            throw new Error('Cannot find element from id \'#toast-editor\'!');
        }
        this.instance = new Editor({
            el: editorOuter,
            previewStyle: 'vertical',
            height: 'calc(100% - 30px)',
            placeholder: '请输入内容...',
            hideModeSwitch: true,
            previewHighlight: false,
            toolbarItems: [[]],
            initialValue: rawContent,
            // 定义Markdown到HTML的渲染规则
            customHTMLRenderer: this.resolver.rendererSource,
        });
        this.area = {
            // 预览区
            preview: document.getElementsByClassName('toastui-editor-md-preview')[0]! as HTMLElement,
            // 编辑区包括行容器和markdown编辑器
            editor: document.getElementsByClassName('toastui-editor md-mode')[0]! as HTMLElement,
            // 编辑区与预览区之间的分割线
            split: document.getElementsByClassName('toastui-editor-md-splitter')[0]! as HTMLElement,
            // markdown编辑器
            mdEditor: document.getElementsByClassName('toastui-editor md-mode')[0].getElementsByClassName('ProseMirror')[0]! as HTMLElement,
        }
        this.resolver.build(this); // 装配core到resolver形成完整的resolver
        this.eventHolder = new PluginEventHolder(this.resolver);
        // 初始化行数容器对象
        this.lineWalker = LineWalker.init(this.instance);
    }

    /**
     * 在构造器中初始化instance后需要通过{@link #build()}
     * 方法对instance对象进行完善和补偿。并在完成构造后将该
     * 核心实例暴露到外部。
     */
    public build(emitter: EventHandler): LucenceCore {
        // 定义编辑器实例的command
        this.instance!.addCommand(
            'markdown', 
            'switchTheme', 
            () => this.toggle.theme());
        this.instance!.addCommand(
            'markdown',
            'switchShowComponents',
            () => this.toggle.components());
        // Plugin 自动挂载所有插件
        this.resolver.autoload();
        // 嵌入添加渲染器按钮
        this.instance!.insertToolbarItem({
            groupIndex: 0,
            itemIndex: 0,
        }, {
            name: 'tool-components',
            tooltip: '组件',
            command: 'switchShowComponents',
            className: 'fa-solid fa-puzzle-piece editor-insert',
        });
        // 嵌入主题切换按钮
        const theme: 'light' | 'night' = LucenceCore.getTheme();
        this.updateToolbarItem(theme);
        const that = this;
        // 重写Ctrl+F方法来调用doSearch()
        document.addEventListener('keydown', function(event: KeyboardEvent): void {
            if (event.ctrlKey && event.key === 'f') {
                event.preventDefault();
                LucenceCore._cache.value.feature.search.enable = true;
                let value: string =
                    (document.getElementById("amber-search--input") as HTMLInputElement).value!;
                // 快速复制选中内容到查询框
                if (value.length === 0) {
                    value = window.getSelection()!.toString();
                    (document.getElementById("amber-search--input") as HTMLInputElement).value = value;
                }
                that.doSearch();
            }
        });
        // 事件更新驱动
        this.instance!.on('caretChange', (): void => {
            this.useUpdate();
        });
        this.instance!.on('updatePreview', (): void => { 
            LucenceCore.renderCodeBlock(); 
        });
        this.instance!.on('afterPreviewRender', (): void => {
            LucenceCore.renderMermaid();
        });
        // 预热
        const mdEditor: Element = 
            this.area!.editor.getElementsByClassName('ProseMirror')[0];
        this.useUpdate();
        ContextUtil.onResize(
            mdEditor, 
            this.useUpdate.bind(this), 
            this.doSearch.bind(this));
        LucenceCore.renderCodeBlock();
        this.syncScroll();
        LucenceCore.renderMermaid();
        // 事件提交器
        this.eventHolder!.register(
            "default_extension",
            {
                type: "content_change",
                desc: "内容自动保存",
                callback: emitter,
            });
        this.eventHolder!.register(
            "default_extension",
            {
                type: "content_change",
                desc: "动态更新搜索结果",
                callback: (): void => {
                    // 更新搜索内容
                    this.doSearch();
                },
            });
        // 文本内容观察者
        const observer = new MutationObserver((mutationsList: MutationRecord[], observer: MutationObserver): void => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    // 调用内容变化的所有事件栈
                    this.eventHolder!.callSeries("content_change");
                    break;
                }
            }
        });
        // 开始观察内容变化
        observer.observe(this.area!.mdEditor, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true,
        });
        // 完成构造
        this.postConstruct();
        // 在构建成功后将instance实例暴露到全局
        return this;
    }

    /**
     * 完成构造
     */
    private postConstruct() {
        LucenceCore._cache.value.plugin.loaded = true;
        LucenceCore._cache.value.components.loaded = true;
    }

    /**
     * 定义同步滚动
     */
    private syncScroll(): void {
        const previewElem: HTMLDivElement = document.querySelectorAll(".toastui-editor-md-preview .toastui-editor-contents")[0] as HTMLDivElement;
        let isProgrammaticScroll = false;
        const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
            const scale = target.scrollHeight / source.scrollHeight;
            const newScrollTop = source.scrollTop * scale;
            isProgrammaticScroll = true;
            target.scrollTop = newScrollTop;
        }
        this.area!.editor.addEventListener('scroll', () => {
            if (isProgrammaticScroll) return;
            syncScroll(this.area!.editor as HTMLDivElement, previewElem);
            setTimeout(() => { isProgrammaticScroll = false; }, 0);
        });
        previewElem.addEventListener('scroll', () => {
            if (isProgrammaticScroll) return;
            syncScroll(previewElem, this.area!.editor as HTMLDivElement);
            setTimeout(() => { isProgrammaticScroll = false; }, 0);
        });
    }

    /**
     * 更新所有缓存
     */
    private useUpdate(): void {
        const mdContent: string = this.instance!.getMarkdown();
        // 更新统计
        const { _wordCount, _characterCount } = 
            ContextUtil.countWord(mdContent);
        // 从栈帧中唤醒所有文本变更事件
        this.tryCallContentEvent(
            LucenceCore._cache.value.feature.count.characters,
            _characterCount);
        const {row, col, characters}: any = this.lineWalker!.getFocusInfo();
        // 更新统计的字数、词数、选中数、聚焦行、聚焦列
        LucenceCore._cache.value.feature.count = {
            words: _wordCount,
            characters: _characterCount,
            selected: characters,
        }
        LucenceCore._cache.value.feature.focus = {
            row: row,
            col: col,
        }
    }

    /**
     * 根据原始字数和更新后的字数来决定需要调用那些文本变更事件，
     * 这个过程由{@link #useUpdate}方法通过{@link this.eventHolder}自动唤起
     * 
     * @param rawCount 原始字数
     * @param nowCount 更新后的字数
     */
    private tryCallContentEvent(rawCount: number, 
                                nowCount: number): void {
        if (rawCount < nowCount) {
            this.eventHolder!.callSeries("content_input");
        } else if (rawCount > nowCount) {
            this.eventHolder!.callSeries("content_delete");
        }
        if (rawCount === nowCount) {
            this.eventHolder!.callSeries("content_select");
        }
    }

    /**
     * 模式切换组
     */
    public toggle: any = {
        // 切换深浅色模式
        theme: (): boolean => {
            const editorDiv: HTMLElement | null = 
                document.getElementById('toast-editor');
            if (editorDiv) {
                const newTheme: "light" | "night" = 
                    LucenceCore.getTheme() === 'light' ? 'night' : 'light';
                LucenceCore._cache.value.theme = newTheme;
                localStorage.setItem('editor-theme', newTheme);
                this.updateToolbarItem(newTheme);
                // 通知主题变更观察者
                this.eventHolder!.callSeries("theme_change");
                return true;
            }
            return false;
        },
        // 切换组件库是否打开
        components: (): boolean => {
            LucenceCore._cache.value.components.enable = 
                !LucenceCore._cache.value.components.enable;
            return true;
        },
        // 切换预览模式
        preview: (): void => {
            LucenceCore._cache.value.feature.preview = 
                !LucenceCore._cache.value.feature.preview;
            const displayWhat: string =
                LucenceCore._cache.value.feature.preview ? '' : 'none';
            this.area!.preview.style.display = displayWhat;
            this.area!.split.style.display = displayWhat;
            this.area!.editor.style.width =
                LucenceCore._cache.value.feature.preview ? '50%' : '100%';
            // 通知预览变更观察者
            this.eventHolder!.callSeries("switch_preview");
        },
        // 切换自动保存模式
        autoSave: (): void => {
            LucenceCore._cache.value.feature.autoSave = 
                !LucenceCore._cache.value.feature.autoSave;
            // 通知自动保存变更观察者
            this.eventHolder!.callSeries("switch_autosave");
        },
        // 切换是否打开查询框
        search: (): void => {
            LucenceCore._cache.value.feature.search.enable = 
                !LucenceCore._cache.value.feature.search.enable;
            this.doSearch();
            // 通知搜索启用变更观察者
            this.eventHolder!.callSeries("switch_search");
            // 关闭替换框
            if (!LucenceCore._cache.value.feature.search.enable) {
                LucenceCore._cache.value.feature.search.replace = false;
            }
        },
        // 切换是否打开搜索的替换模式
        replacing: () => {
            LucenceCore._cache.value.feature.search.replace = 
                !LucenceCore._cache.value.feature.search.replace;
        },
        // 切换正则规则搜索
        regular: ():void => {
            LucenceCore._cache.value.feature.search.condition.regular = 
                !LucenceCore._cache.value.feature.search.condition.regular;
            this.doSearch();
        },
        // 切换大小写敏感搜索
        capitalization: ():void => {
            LucenceCore._cache.value.feature.search.condition.capitalization = 
                !LucenceCore._cache.value.feature.search.condition.capitalization;
            this.doSearch();
        },
        // 切换保留大小写
        keepCap: ():void => {
            LucenceCore._cache.value.feature.search.condition.keepCap = 
                !LucenceCore._cache.value.feature.search.condition.keepCap;
        },
        // 切换插件菜单页的显示
        plugin: {
            open: (): void => {
                LucenceCore._cache.value.plugin.enable = true;
                if (!LucenceCore.buildDraggableOnce) {
                    LucenceCore.buildDraggable();
                }
            },
            close: (): void => {
                LucenceCore._cache.value.plugin.enable = false;
            }
        },
    }
    
    private static buildDraggableOnce: boolean = false;
    private static buildDraggable() {
        const draggableInstall = document.getElementById('draggable-install')!;
        // 拖拽上传
        draggableInstall.addEventListener("dragenter", handleEvent);
        draggableInstall.addEventListener("dragover", handleEvent);
        draggableInstall.addEventListener("drop", handleEvent);
        draggableInstall.addEventListener("dragleave", handleEvent);
        function handleEvent(event: any) {
            event.preventDefault();
            if (event.type === 'drop') {
                draggableInstall.classList.remove('draggable');
                if (event.dataTransfer.files.length === 0) return;
                const file = event.dataTransfer.files[0];
                LucenceCore.uploadPlugin(file);
            } else if (event.type === 'dragleave') {
                draggableInstall.classList.remove('draggable');
            } else {
                draggableInstall.classList.add('draggable');
            }
        }
    }

    private isReplacing: boolean = false;

    /**
     * 对文本内容进行逐个替换和全局替换。值得第三方开发者注意的是{@link SearchUtil#highlightSelection}方法和{@link SearchUtil#onlyGetHighlightRange}方法的差异，前者会更新Selection选区的同时返回Range对象，后者只会返回Range对象。
     * <p>
     * 这两个方法在调用时需要明确一点，前端对Selection的渲染是被调度到最后执行的，所以循环体系中调用{@link SearchUtil#highlightSelection}不会发生选区的持续变更，这会导致非常严重的错误，所以在全局替换中应该使用更抽象的{@link SearchUtil#onlyGetHighlightRange}方法来获取Range。
     * @param isGlobal 是否为全局替换
     */
    public doReplacing(isGlobal: boolean): void {
        if (!LucenceCore._cache.value.feature.search.replace ||
            LucenceCore._cache.value.feature.search.result.total === 0) {
            return;
        }
        const regexFlags: "gm" | "gmi" = LucenceCore._cache.value.feature.search.condition.capitalization ? 'gm' : 'gmi';
        let regex: RegExp | null = null;
        if (LucenceCore._cache.value.feature.search.condition.regular) {
            const _value_: string = (document.getElementById("amber-search--input") as HTMLInputElement).value;
            regex = new RegExp(_value_, regexFlags);
        }
        const value: string =
            (document.getElementById("amber-search--replacing") as HTMLInputElement).value!;
        if (isGlobal) {
            // 全局替换需要全局标记
            this.isReplacing = true; // 更新状态
            this.doSearch(); // 调用doSearch()更新一次Highlight容器
            const markList: number[][] = 
                LucenceCore._cache.value.feature.search.result.list as number[][];
            // 进行批量替换操作
            let range: Range | null = this.getSearchRangeAt(true);
            // 全局替换的逻辑较为复杂，需要对SearchUtil#highlightSelection进行单独分离重构
            for (let i = markList.length - 1; i >= 0; i--) {
                const marker: number[] = markList[i];
                range = SearchUtil.onlyGetHighlightRange(
                    marker[0],
                    marker[1],
                    LucenceCore._cache.value.feature.search.condition.regular ? marker[2] : marker[0],
                    LucenceCore._cache.value.feature.search.condition.regular ? marker[3] : marker[1] + (document.getElementById("amber-search--input") as HTMLInputElement).value!.length);
                if (!range) break;
                this.replaceRangeContent(range, regex, value);
            }
            this.isReplacing = false; // 结束状态
        } else {
            // 单次替换直接向下深度搜索
            const range: Range | null = this.locateSearchResultAt(true);
            this.replaceRangeContent(range, regex, value);
        }
        this.eventHolder!.callSeries("content_change");
    }
    
    private replaceRangeContent(range: Range | null, 
                                regex: RegExp | null,
                                value: string): void {
        if (!range) return;
        let replacedContent: string;
        if (regex) {
            replacedContent = LucenceCore.replaceContentInRange(range!, regex!, value);
        } else {
            replacedContent = value;
            range.deleteContents();
        }
        range.insertNode(document.createTextNode(replacedContent));
    }

    /**
     * 对Range区域内的文本进行正则替换
     * @param range 选区
     * @param regex 正则表达式
     * @param value 替换值
     */
    private static replaceContentInRange(range: Range,
                                         regex: RegExp,
                                         value: string): string {
        const flag: boolean = range.startContainer !== range.endContainer;
        let fragment: DocumentFragment = range.cloneContents();
        let content: string;
        // 发生了跨DOM的替换 同时处理删除
        if (flag) {
            content = LucenceCore.getTextFromDiffNode(fragment).replace(/\n$/, "");
            LucenceCore.deleteRangeContentsAndEmptyTags(range);
        } else {
            let tempDiv: HTMLDivElement = document.createElement("div");
            tempDiv.appendChild(fragment);
            content = tempDiv.innerText;
            range.deleteContents();
        }
        // 生成替换后的文本内容
        return content.replace(regex, value);
    }

    /**
     * 执行一次查找，如果查找处于关闭状态那么清空结果和缓存，不进行查找。
     * 如果查找框内为空则从选择区域直接拷贝到查询框中作为条件进行查询。同
     * 时根据 {@link LucenceCore._cache.value.feature.search.condition} 和 
     * {@link LucenceCore._cache.value.feature.search.result} 将条件委派给 
     * {@link SearchUtil#updateHighlight} 方法进行指定条件查找
     */
    public doSearch(): void {
        if (this.searchThrottleTimer) {
            clearTimeout(this.searchThrottleTimer);
        }
        this.searchThrottleTimer = window.setTimeout(() => {
            const value: string =
                (document.getElementById("amber-search--input") as HTMLInputElement).value!;
            // 未启用搜索或正在进行替换操作那么需要清空容器
            if (!LucenceCore._cache.value.feature.search.enable ||
                value.length === 0 ||
                this.isReplacing) {
                const amberContainer: HTMLElement | null =
                    document.getElementById("amber-highlight--group");
                if (amberContainer) {
                    amberContainer.innerHTML = "";
                }
                LucenceCore._cache.value.feature.search.result.total = 0;
                LucenceCore._cache.value.feature.search.result.hoverOn = 0;
                return;
            }
            if (!LucenceCore._cache.value.feature.search.condition.regular) {
                // 纯文本内容查询
                const { total, markList }: any = SearchUtil.text(
                    this.instance!.getMarkdown(),
                    value,
                    LucenceCore._cache.value.feature.search.condition.capitalization);
                SearchUtil.updateHighlight(
                    LucenceCore._cache.value.feature.search.result,
                    LucenceCore._cache.value.feature.search.condition,
                    total,
                    markList,
                    value);
            } else {
                const { total, markList }: any = SearchUtil.regex(
                    this.instance!.getMarkdown(),
                    value,
                    LucenceCore._cache.value.feature.search.condition.capitalization);
                SearchUtil.updateHighlight(
                    LucenceCore._cache.value.feature.search.result,
                    LucenceCore._cache.value.feature.search.condition,
                    total,
                    markList,
                    value);
            }
        }, 50);
    }

    /**
     * 返回编辑器渲染后的HTML内容
     */
    public getHTML(): string {
        let newHtml: string = '';
        const childNodes: NodeListOf<ChildNode> = 
            document.querySelectorAll(".toastui-editor-md-preview .toastui-editor-contents")[0].childNodes;
        for (let i: number = 0; i < childNodes.length; i++) {
            const node: ChildNode = childNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
                let clone: Element = node.cloneNode(true) as Element;
                // 检查并处理mermaid类型
                if (clone.classList.contains('show-mermaid')) {
                    let mermaidElement: Element = 
                        clone.querySelectorAll('.hide-mermaid')[0];
                    mermaidElement.classList.remove('hide-mermaid');
                    mermaidElement.classList.add('mermaid-box');
                    newHtml += mermaidElement.outerHTML;
                    continue;
                }
                clone.removeAttribute('data-nodeid');
                newHtml += clone.outerHTML;
            }
        }
        return newHtml;
    }

    /**
     * 返回编辑器的原始的Markdown内容
     */
    public getMarkdown(): string {
        return this.instance!.getMarkdown();
    }

    /**
     * 当向下或向上查找时调用该方法来定位到高亮的搜索内容上。
     * @param isDown 是否是向下查找
     */
    public locateSearchResultAt(isDown: boolean): Range | null {
        const result = this.locateNearestOne(isDown);
        if (!result) return null;
        const { awaitArr, selectIndex } = result;
        LucenceCore._cache.value.feature.search.result.hoverOn = selectIndex;
        // 处理跟随滚动
        const halfHeight: number = this.area!.editor.clientHeight / 2;
        const maxScroll: number = this.area!.editor.scrollHeight - this.area!.editor.clientHeight;
        const topDistance: number = parseInt((document.getElementById("amber-highlight--group")!.childNodes[selectIndex - 1] as HTMLElement).style.top);
        const newScrollTop: number = topDistance - halfHeight;
        if (newScrollTop < 0) {
            // 不在半屏以内
            this.area!.editor.scrollTop = 0;
        } else if (newScrollTop > maxScroll) {
            // 超过最大滚动
            this.area!.editor.scrollTop = maxScroll;
        } else if (newScrollTop >= 0 && newScrollTop <= maxScroll) {
            // 合法的滚动范围内
            this.area!.editor.scrollTop = newScrollTop;
        }
        return this.highlightResult(awaitArr);
    }
    
    private getSearchRangeAt(isDown: boolean): Range | null {
        const result = this.locateNearestOne(isDown);
        if (!result) return null;
        const { awaitArr } = result;
        return SearchUtil.onlyGetHighlightRange(
            awaitArr[0],
            awaitArr[1],
            LucenceCore._cache.value.feature.search.condition.regular ?
                awaitArr[2] : awaitArr[0],
            LucenceCore._cache.value.feature.search.condition.regular ?
                awaitArr[3] : awaitArr[1] + (document.getElementById("amber-search--input") as HTMLInputElement).value!.length);
    }

    /**
     * 将position位置的字段渲染为搜索结果的高亮区
     * @param position 起始位置的一个4元素长度的数字型数组
     */
    public highlightResult(position: number[]): Range | null {
        return SearchUtil.highlightSelection(
            position[0],
            position[1],
            LucenceCore._cache.value.feature.search.condition.regular ?
                position[2] : position[0],
            LucenceCore._cache.value.feature.search.condition.regular ?
                position[3] : position[1] + (document.getElementById("amber-search--input") as HTMLInputElement).value!.length);
    }

    /**
     * 为查找和替换分理出一个统一的向下查找最近的结果的方法，
     * 并将最近的一个结果的定位点以数组的形式暴露到外部
     * @param isDown 是否为向下查找
     */
    private locateNearestOne(isDown: boolean): { awaitArr: number[], selectIndex: number, } | null {
        if (LucenceCore._cache.value.feature.search.result.total === 0) return null;
        const length: number =
            LucenceCore._cache.value.feature.search.result.list.length;
        const fixLength: number =
            (document.getElementById("amber-search--input") as HTMLInputElement).value!.length;
        let awaitArr: number[] = [], 
            selectedIndex: number = isDown ? length - 1 : 0;
        for (let index: number = 0; index < length; index++) {
            const selection: SelectionPos = this.instance!.getSelection(), 
                  searchLength: number = 
                      LucenceCore._cache.value.feature.search.condition.regular ? 
                          (LucenceCore._cache.value.feature.search.result.list[index] as number[])[3] - (LucenceCore._cache.value.feature.search.result.list[index] as number[])[1] :
                          fixLength, 
                  row: number[] =
                      LucenceCore._cache.value.feature.search.result.list[index] as number[];
            let diffRow: number = row[0], diffCol: number = row[1]; // 行间距 列间距
            // 正则回溯查找且row[0]和row[2]不相同，focusRow和focusCol需要重新定位起始位置
            let rowToSubtract: number = 
                    LucenceCore._cache.value.feature.focus.row,
                colToSubtract: number = 
                    LucenceCore._cache.value.feature.focus.col;
            if (!isDown && (row[0] !== row[2]) &&
                LucenceCore._cache.value.feature.search.condition.regular) {
                rowToSubtract = (selection as [number[], number[]])[0][0];
                colToSubtract = (selection as [number[], number[]])[0][1];
            }
            diffRow -= rowToSubtract;
            diffCol -= colToSubtract;
            // 将第一次遍历到的行差>=0的元素作为候选
            if (diffRow >= 0) {
                // 如果行差为0选择第一个遍历到的列差>0的元素作为候选
                if (diffRow === 0) {
                    if ((!isDown && diffCol < 0 && 
                            Math.abs(diffCol) > searchLength) ||
                        (isDown && diffCol < 0 && 
                            Math.abs(diffCol) >= searchLength)) {
                        continue;
                    }
                    let target: number = index;
                    if (!isDown) target--;
                    if (target < 0) target = length - 1;
                    awaitArr =
                        LucenceCore._cache.value.feature.search.result.list[target] as number[];
                    selectedIndex = target;
                    break;
                } else {
                    // 候选必然是下一个，那么候选的前驱节点必然是上一个结果
                    let target: number = index;
                    if (!isDown) target--;
                    if (target < 0) target = length - 1;
                    selectedIndex = target;
                    awaitArr =
                        LucenceCore._cache.value.feature.search.result.list[target] as number[];
                    break;
                }
            }
        }
        if (awaitArr.length === 0) {
            if (isDown) {
                selectedIndex = 0;
            } else {
                selectedIndex = length - 1;
            }
            awaitArr =
                LucenceCore._cache.value.feature.search.result.list[selectedIndex] as number[];
        }
        return {
            awaitArr: awaitArr,
            selectIndex: selectedIndex + 1,
        };
    }
    
    /**
     * 更新Toolbar第一个位置的主题模式切换按钮
     * @param theme 主题色，一般通过{@link #getTheme()}方法来获取
     */
    private updateToolbarItem(theme: string): void {
        this.instance!.removeToolbarItem(`tool-theme-${theme === 'light' ? 'moon' : 'day'}`);
        this.instance!.insertToolbarItem({ groupIndex: 0, itemIndex: 0 }, {
            name: `tool-theme-${theme === 'light' ? 'day' : 'moon'}`,
            tooltip: `切换至${theme === 'light' ? '夜间' : '白天'}`,
            command: 'switchTheme',
            className: `fa-solid fa-${theme === 'light' ? 'sun' : 'moon'}`,
        });
    }

    /**
     * 富文本编辑器的事件调用和唤起
     */
    public on(plugin: AbstractPlugin,
              event: PluginEvent,
              desc: string,
              callback: EventHandler): void {
        // 事件类型和回调器压栈
        this.eventHolder!.register(
            plugin.detail.name,
            {
                type: event,
                desc: desc,
                callback: callback,
            });
    }
    
    public insertComponent(renderer: string, data: Record<string, string>) {
        const [start]: number[][] = this.instance!.getSelection() as [number[], number[]];
        // @ts-ignore
        const mapped = Object.entries(data)
            .map(([key, value]: string[]): string => {
                if (key === 'slots') return '';
                if (key === 'content') return value + '\n';
                return `${key}: ${value}\n`;
            }).join('');
        const result = 
            `${start[1] === 1 ? '' : '\n'}$$${renderer}\n${mapped}$$`;
        this.instance!.replaceSelection(result);
    }

    /**
     * 预览渲染器
     */
    public previewComponent(component: PluginComponent,
                            data: Record<string, string>): string {
        const { slots, content, ...mappedData } = data;
        const context = new RendererContext(mappedData, data.content);
        // get component from plugin's renderers
        const fragment = component.render(context);
        const outerDiv: HTMLDivElement = document.createElement('div');
        outerDiv.appendChild(fragment);
        return outerDiv.innerHTML;
    }

    /**
     * 销毁Editor实例
     */
    public destroy(): void {
        LucenceCore._cache.value.components.loaded = false;
        LucenceCore._cache.value.components.enable = false;
        LucenceCore._cache.value.plugin.loaded = false;
        LucenceCore._cache.value.plugin.enable = false;
    }
    
    // 返回缓存
    static get cache(): Ref<CacheType> {
        return LucenceCore._cache;
    }
    // 编辑器实例
    get editor(): Editor {
        return this.instance!;
    }
    // 插件列表
    get plugins(): Ref<PluginHolder[]> {
        return ref(this.resolver.pluginList);
    }

    /* 静态方法区 */
    
    static {
        // 静态初始化mermaid语法
        mermaid.initialize({ 
            startOnLoad: true,
        });
        // 静态初始化highlight.js
        hljs.configure({
            ignoreUnescapedHTML: true,
            throwUnescapedHTML: false,
        });
    }

    public static uploadPlugin(file: File): void {
        const formData = new FormData();
        formData.append('pluginFilePart', file);
        PluginResolver.HTTP.post("/apis/api.plugin.halo.run/v1alpha1/plugins/plugin-lucence-for-halo/plugin/upload", formData).then((response): void => {
            const pluginName: string = file.name.split('.').slice(0, -1).join('.');
            this.installPlugin(pluginName, `/apis/api.plugin.halo.run/v1alpha1/plugins/plugin-lucence-for-halo/plugin/get?pluginName=${pluginName}`);
        })
    }

    /**
     * 安装LucencePlugin插件，由{@link #uploadPlugin}方法先确认插件是否完整，
     * 后将插件所在URL传递给该方法，该方法将插件信息注入到后端数据库中
     */
    private static installPlugin(name: string, source: string) {
        PluginResolver.HTTP
            .post<LucencePlugin>("/apis/lucence.plugin.halo.run/v1alpha1/lucencePlugins", {
                "apiVersion": "lucence.plugin.halo.run/v1alpha1",
                "detail": {
                    "name": name,
                    "source": source,
                    "enable": true,
                },
                "kind": "LucencePlugin",
                "metadata": {
                    "generateName": "lucence-plugin-"
                }
            })
            .then((response): void => {
                console.log(`插件 ${name} 安装完成`)
            })
    }

    /**
     * 返回当前编辑器的主题色
     * @return string 'light' 浅色模式或 'dark' 深色模式
     */
    private static getTheme(): 'light' | 'night' {
        let theme: string | null = localStorage.getItem('editor-theme');
        if (theme !== 'light' && theme !== 'night') {
            theme = 'light';
            localStorage.setItem('editor-theme', theme);
        }
        // @ts-ignore
        return theme;
    }

    /**
     * 为所有class为".hljs"的容器渲染代码块
     */
    private static renderCodeBlock(): void {
        const elements: HTMLCollectionOf<Element> = 
            document.getElementsByClassName('hljs');
        for (let element of elements) {
            hljs.highlightElement(element as HTMLElement);
        }
    }

    /**
     * 删除{@code range}内的所有文本和Dom节点，再将{@code range}重新定位到
     * 删除后文本的开头，方便{@code range}后续的添加操作能从删除后文本的开头开始
     * @param range 待处理的range对象
     */
    private static deleteRangeContentsAndEmptyTags(range: Range): void {
        const nodesToCheck: any[] = [];
        const treeWalker: TreeWalker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_ELEMENT,
        {
                acceptNode: function(node: Node): number {
                    if (range.intersectsNode(node)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            });
        const endContainer: Node = range.endContainer;
        let currentNode: Node | null = treeWalker.nextNode();
        while (currentNode) {
            nodesToCheck.push(currentNode);
            currentNode = treeWalker.nextNode();
        }
        range.deleteContents();
        const startNode: Node = range.startContainer;
        if (startNode.nodeType === Node.TEXT_NODE && 
            startNode.nextSibling && 
            startNode.nextSibling.nodeType === Node.TEXT_NODE) {
            // @ts-ignore
            startNode.appendData(startNode.nextSibling.data);
            startNode.nextSibling.remove();
        }
        for (let i = nodesToCheck.length - 1; i >= 0; i--) {
            const node = nodesToCheck[i];
            if (node && node.nodeType === Node.ELEMENT_NODE) {
                const text = node.textContent || "";
                if (!text.trim()) {
                    node.remove();
                }
            }
        }
        // 进行内容删除后的range需要重新设置start将其与end位置进行对齐
        range.setStart(endContainer, 0);
        range.setEnd(endContainer, 0);
    }

    private static getTextFromDiffNode(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.nodeValue || '';
        }
        if (node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName === 'BR') {
            return '\n';
        }
        const isBlockElement: boolean = 
            node.nodeType === Node.ELEMENT_NODE && 
            (['DIV', 'P'].includes((node as Element).tagName));
        let text: string = '';
        let child: ChildNode | null = node.firstChild;
        while (child) {
            text += this.getTextFromDiffNode(child);
            child = child.nextSibling;
        }
        return isBlockElement ? text + '\n' : text;
    }

    /**
     * 为所有class为".mermaid.mermaid-box"的容器渲染mermaid语法
     */
    private static renderMermaid(): void {
        mermaid.init(
            undefined,
            document.querySelectorAll('.mermaid-to-render'))
            .catch(e => {
                console.error(e);
            });
    }
    
}
