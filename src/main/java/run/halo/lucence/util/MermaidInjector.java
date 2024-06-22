package run.halo.lucence.util;

/**
 * @author Dioxide.CN
 * @date 2023/10/25
 * @since 1.0
 */
public class MermaidInjector {

    public static String get() {
        // language=html
        return """
            <script defer src="/plugins/plugin-lucence-for-halo/assets/static/mermaid/mermaid.min.js"></script>
            <script id='lucence-mermaid__renderer' defer src="/plugins/plugin-lucence-for-halo/assets/static/lucence/kernel_exposer.js"></script>
            """;
    }

}
