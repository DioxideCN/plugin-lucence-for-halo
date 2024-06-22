document.addEventListener("DOMContentLoaded", function() {
    renderMermaid('default');
});

const renderMermaid = (theme = 'default') => {
    mermaid.initialize({
        startOnLoad: true,
        theme: theme,
    });
    const mermaidContainers = document.querySelectorAll('.mermaid-box');
    mermaidContainers.forEach((container, index) => {
        const syntaxContainer = container.querySelector('.mermaid-syntax');
        if (syntaxContainer) {
            const mermaidSyntax = syntaxContainer.textContent.trim() || "";
            if (mermaidSyntax.length > 0) {
                try {
                    mermaid.render(`mermaidGraph_${index}`, mermaidSyntax, (svgCode) => {
                        const renderContainer = container.querySelector('.mermaid-output');
                        if (renderContainer) {
                            renderContainer.innerHTML = svgCode;
                        } else {
                            console.error("No .mermaid-to-render element found in container");
                        }
                    });
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
}