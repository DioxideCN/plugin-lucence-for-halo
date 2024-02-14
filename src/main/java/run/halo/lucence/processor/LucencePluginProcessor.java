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
import reactor.core.scheduler.Schedulers;
import run.halo.app.plugin.BasePlugin;
import run.halo.lucence.entity.Response;

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
     * @return 插件文件路径
     */
    public Path getScriptJS(String pluginName) {
        return Paths.get(this.CONFIG_HOME, pluginName + ".js");
    }

    public Mono<Response<Object>> savePluginJS(FilePart pluginFilePart) {
        String fileName = pluginFilePart.filename();
        String absoluteFilePath = this.CONFIG_HOME + File.separator + fileName;
        File file = new File(absoluteFilePath);
        if (file.exists()) {
            return Mono.just(Response.fail("Plugin has existed."));
        }
        return pluginFilePart
            .transferTo(file)
            .then(Mono.just(
                Response.success("Plugin uploaded successfully.",
                    null))
            );
    }

    public Mono<Response<Object>> deletePluginJS(String pluginName) {
        Path pluginPath = Paths.get(this.CONFIG_HOME, pluginName + ".js");
        return Mono.fromCallable(() -> {
            try {
                // 异步执行文件删除操作
                Files.deleteIfExists(pluginPath);
                return Response.success("Delete file successfully.", null);
            } catch (Exception e) {
                // 如果删除文件时出现异常，返回异常消息
                return Response.fail("Error occurred while deleting plugin file " + pluginName + ".js: " + e.getMessage());
            }
        }).subscribeOn(Schedulers.boundedElastic());
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
