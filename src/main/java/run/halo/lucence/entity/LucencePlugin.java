package run.halo.lucence.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import run.halo.app.extension.AbstractExtension;
import run.halo.app.extension.GVK;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * @author Dioxide.CN
 * @date 2024/2/8
 * @since 1.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@GVK(kind = "LucencePlugin", group = "lucence.plugin.halo.run",
    version = "v1alpha1", singular = "lucencePlugin", plural = "lucencePlugins")
public class LucencePlugin extends AbstractExtension {

    @Schema(requiredMode = REQUIRED)
    private LucencePluginDetail detail;

    @Data
    public static class LucencePluginDetail {
        // Lucence插件的名称
        @Schema(requiredMode = REQUIRED, minLength = 1)
        private String name;

        // Lucence插件指向的绝对地址
        @Schema(requiredMode = REQUIRED, minLength = 1)
        private String source;

        // Lucence插件的启用状态
        @Schema(defaultValue = "true")
        private Boolean enable;
    }

}
