package run.halo.lucence.router;

import jakarta.annotation.Resource;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.UrlResource;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ApiVersion;
import run.halo.lucence.processor.LucencePluginProcessor;
import java.net.MalformedURLException;
import java.nio.file.Path;

/**
 * @author Dioxide.CN
 * @date 2024/2/8
 * @since 1.0
 */
@Slf4j
@ApiVersion("v1alpha1")
@RequestMapping("/plugin")
@RestController
@AllArgsConstructor
public class LucencePluginRouter {

    @Resource
    private LucencePluginProcessor processor;

    @GetMapping("/get")
    public Mono<org.springframework.core.io.Resource> getPlugin(
        @RequestParam("pluginName") String pluginName) throws MalformedURLException {
        Path scriptPath = processor.getScriptJS(pluginName);
        org.springframework.core.io.Resource resource = new UrlResource(scriptPath.toUri());
        return Mono.just(resource);
    }

    @PostMapping("/upload")
    public Mono<String> uploadPlugin(
        @RequestPart("pluginFilePart") FilePart pluginFilePart) {
        return processor.savePluginJS(pluginFilePart);
    }

}
