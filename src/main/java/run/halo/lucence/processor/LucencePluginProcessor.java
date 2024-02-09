package run.halo.lucence.processor;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.BasePlugin;

/**
 *
 *
 * @author Dioxide.CN
 * @date 2024/2/8
 * @since 1.0
 */
@Slf4j
@Configuration
public class LucencePluginProcessor {

    private Class<? extends BasePlugin> clazz;

    @Getter
    private String CONFIG_HOME;

    public void init(Class<? extends BasePlugin> clazz) {
        this.clazz = clazz;
        homeDirBuilder();
    }

    private void homeDirBuilder() {
        // 生成插件的配置目录
        URL url = this.clazz.getProtectionDomain().getCodeSource().getLocation();
        String filePath = URLDecoder.decode(url.getPath(), StandardCharsets.UTF_8);
        this.CONFIG_HOME = new File(filePath).getParent() + File.separator + "lucence";
        log.info("detected config directory " + this.CONFIG_HOME);
        Path path = Paths.get(this.CONFIG_HOME);
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            log.error(e.toString());
        }
    }

    /**
     * 根据插件名获取插件js文件
     * @param pluginName 插件名
     * @return 插件文件
     */
    public String getPluginJS(String pluginName) {
        Path pluginPath = Paths.get(this.CONFIG_HOME, pluginName + ".js");
        return getFileContent(pluginPath);
    }

    public Path getScriptJS(String pluginName) {
        return Paths.get(this.CONFIG_HOME, pluginName + ".js");
    }

    public Mono<String> savePluginJS(FilePart pluginFilePart) {
        String fileName = pluginFilePart.filename();
        String absoluteFilePath = this.CONFIG_HOME + File.separator + fileName;
        return pluginFilePart
            .transferTo(new File(absoluteFilePath))
            .then(Mono.just("Upload plugin success"));
    }

    public void deletePluginJS(String pluginName) {
        Path pluginPath = Paths.get(this.CONFIG_HOME, pluginName + ".js");
        File fileToDelete = pluginPath.toFile();
        try {
            Files.deleteIfExists(pluginPath);
        } catch (IOException e) {
            log.error("Error occurred while deleting lucence editor plugin: {}", e.getMessage());
        }
    }

    public static String getFileContent(Path filePath) {
        StringBuilder variablesBuilder = new StringBuilder();
        try (Stream<String> stream = Files.lines(filePath)) {
            stream.forEach(s -> variablesBuilder.append(s).append("\n"));
        } catch (IOException e) {
            log.error(e.getMessage());
        }
        return variablesBuilder.toString();
    }

}
