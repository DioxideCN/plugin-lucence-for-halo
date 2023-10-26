import type {Editor} from "@toast-ui/editor";
import type {SelectionPos} from "@toast-ui/editor/types/editor";

/**
 * LineWalker是Lucence Editor内核中处理行数容器的核心类。在早期Lucence Editor对行容器的处理过程非常分散，包括在{@link LucenceCore}中初始化容器、在{@link ContextUtil#Line}中更新容器。这使得行容器的处理逻辑变得复杂而难以维护。
 * <p>
 * 在{@link ContextUtil#Line}中主要处理了对行的计算、空行的补齐、高亮聚焦行的逻辑，这些过程虽然完整但是会在每次光标移动时被调用，这导致了前端性能的大量开销。在{@link LineWalker}中，将采用局部刷新、条件中断等多种逻辑对这个算法过程进行主要优化。
 * 
 * @author DioxideCN
 * @date 2023/10/25
 * @since 1.0
 */
export class LineWalker {

    // Toast UI Editor 实例，在init()时传递并被构造
    private readonly instance: Editor;

    // 实例的左侧区域(包含可编辑区 ProseMirror)
    private readonly editorElem: HTMLElement;

    // 行标容器(用来存储每个行DOM)
    private readonly lineElem: HTMLDivElement;
    // AS高亮容器(用来存储每个高亮的搜索结果)
    private readonly highlightElem: HTMLDivElement;

    private constructor(instance: Editor) {
        this.instance = instance;
        // 初始化一些会用得到的DOM值
        this.editorElem = 
            document.getElementsByClassName('toastui-editor md-mode')[0]! as HTMLElement;
        
        // 初始化行标容器
        this.lineElem = document.createElement('div');
        this.lineElem.classList.add('editor-line-number');
        this.lineElem.classList.add('unselectable');
        // 将行标容器追加到 ProseMirror 前面
        this.editorElem.insertBefore(this.lineElem, this.editorElem.childNodes[0]);

        // 初始化Amber Search的高亮标记容器
        this.highlightElem = document.createElement('div');
        this.highlightElem.id = "amber-highlight--group";
        // 将AS高亮容器追加到 editorElem 最后面
        this.editorElem.append(this.highlightElem);
    }

    /**
     * 初始化LineWalker对象，这个过程会完成对行容器的构造以及初次泛化行容器。
     * 
     * @param instance ToastEditor编辑器实例
     * 
     * @author DioxideCN
     */
    public static init(instance: Editor, ): LineWalker {
        return new LineWalker(instance);
    }
    
    private currentFocusLine: number = -1;

    /**
     * 获取当前正在聚焦的行和列
     *
     * @return {row: number, col: number} 当前正在聚焦的行和列
     * @author DioxideCN
     */
    public getFocusInfo(): {row: number, col: number, characters: number} {
        return {
            row: this.getFocusOnWhichLine(),
            col: (this.instance.getSelection() as number[][])[1][1],
            characters: this.countCharactersFromSelection(),
        };
    }

    /**
     * 获取当前正在聚焦的行数
     *
     * @return number 当前正在聚焦的行数
     * @author DioxideCN
     */
    private getFocusOnWhichLine(): number {
        const newFocusLine: number = 
            (this.instance.getSelection() as number[][])[1][0];
        if (newFocusLine !== this.currentFocusLine) {
            this.currentFocusLine = (this.instance.getSelection() as number[][])[1][0];
            this.updateLineNumberStyle(this.currentFocusLine);
        }
        return newFocusLine;
    }
    
    private updateLineNumberStyle(lineNumber: number): void {
        let styleTag: HTMLElement | null = document.getElementById('dynamic-line-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dynamic-line-style';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = `.ProseMirror div:nth-child(${lineNumber})::before { color: var(--line-highlight); }`;
    }

    /**
     * 计算<pre>instance</pre>选中区域中的文本字符数量
     * 
     * @return number 选中区域中的文本字符数量
     * @author DioxideCN
     */
    private countCharactersFromSelection(): number {
        return this.instance
            .getSelectedText()
            .replace(/\s+/g, '')
            .length;
    }
    
}
