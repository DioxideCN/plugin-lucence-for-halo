import type {SelectionPos} from "@toast-ui/editor/types/editor";
import type {Editor} from "@toast-ui/editor";

function isMapEqual(a: Map<any, any>, b: Map<any, any>): boolean {
    if (a.size !== b.size) return false;
    for (const [key, val] of a.entries()) {
        if (b.get(key) !== val) return false;
    }
    return true;
}

export const ContextUtil = {
    countWord: (text: string) => {
        // 移除 Markdown 格式
        const plainText = text.replace(/\s+/g, '');
        const _characterCount = plainText.length;

        // 移除英文单词，剩下的字符按长度统计
        let _wordCount = (text.match(/\b[a-zA-Z]+\b/g) || []).length;
        const remainingText = text.replace(/\b[a-zA-Z]+\b/g, '');
        _wordCount += remainingText.replace(/\s+/g, '').length;

        return {
            _wordCount,
            _characterCount
        };
    },
    onResize: (mdEditor: Element,
               ...callbacks: Function[]) => {
        window.addEventListener('resize', () => {
            callbacks.forEach(callback => {
                callback();
            })
        })
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.contentRect.width !== entry.target.clientWidth) {
                    callbacks.forEach(callback => {
                        callback();
                    })
                }
            }
        });
        resizeObserver.observe(mdEditor);
    },
    
    UseRegular: {
        createTable: (x: number, y: number, instance: Editor): boolean => {
            if (x > 0 && y > 0) {
                const [start] = instance.getSelection() as [number[], number[]];
                let tableMarkdown = start[1] === 1 ? '' : '\n';
                for (let col = 0; col < y; col++) {
                    tableMarkdown += '|  ';
                }
                tableMarkdown += '|\n';
                for (let col = 0; col < y; col++) {
                    tableMarkdown += '| --- ';
                }
                tableMarkdown += '|\n';
                // 生成表格主体
                for (let row = 0; row < x - 1; row++) {
                    for (let col = 0; col < y; col++) {
                        tableMarkdown += '|  ';
                    }
                    tableMarkdown += '|\n';
                }
                instance.replaceSelection(tableMarkdown);
                return true;
            }
            return false;
        },
        createLink: (alt: string, url: string, instance: Editor): boolean => {
            instance.replaceSelection(`[${alt}](${url})`);
            return true;
        },
        createImage: (alt: string, url: string, instance: Editor): boolean => {
            instance.replaceSelection(`![${alt}](${url})`);
            return true;
        },
        createEmoji: (emoji: string, instance: Editor): boolean => {
            if (emoji) {
                instance.replaceSelection(emoji);
                return true;
            }
            return false;
        },
        createLatex: (instance: Editor): boolean => {
            const [start] = instance.getSelection() as [number[], number[]];
            let latexMarkdown = (start[1] === 1 ? '' : '\n') + '$$latex\n\n$$';
            instance.replaceSelection(latexMarkdown);
            return true;
        },
    },
}
