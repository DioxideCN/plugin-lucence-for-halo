package run.halo.lucence.util;

/**
 * @author Dioxide.CN
 * @date 2023/10/25
 * @since 1.0
 */
public class KatexInjector {

    public static String get() {
        // language=html
        return """
            <link rel="stylesheet" href="/plugins/plugin-lucence-for-halo/assets/static/katex/katex.min.css">
            <script defer src="/plugins/plugin-lucence-for-halo/assets/static/katex/katex.min.js"></script>
            """;
    }

}
