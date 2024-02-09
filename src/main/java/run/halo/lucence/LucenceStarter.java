package run.halo.lucence;

import lombok.Getter;
import org.pf4j.PluginWrapper;
import org.springframework.stereotype.Component;
import run.halo.app.extension.Scheme;
import run.halo.app.extension.SchemeManager;
import run.halo.app.plugin.BasePlugin;
import run.halo.lucence.entity.LucencePlugin;
import run.halo.lucence.processor.LucencePluginProcessor;

@Component
public class LucenceStarter extends BasePlugin {

    private final SchemeManager schemeManager;

    @Getter
    private final LucencePluginProcessor processor;

    public LucenceStarter(PluginWrapper wrapper,
                          SchemeManager schemeManager,
                          LucencePluginProcessor processor) {
        super(wrapper);
        this.schemeManager = schemeManager;
        this.processor = processor;
    }

    @Override
    public void start() {
        // 注入Lucence Editor Plugin模型
        this.schemeManager.register(LucencePlugin.class);
        // 初始化配置目录
        this.processor.init(LucenceStarter.class);
        System.out.println("Lucence-for-halo has been started.");
    }

    @Override
    public void stop() {
        // 注销Lucence Editor Plugin模型
        Scheme lucencePluginScheme = this.schemeManager.get(LucencePlugin.class);
        this.schemeManager.unregister(lucencePluginScheme);
        System.out.println("Lucence-for-halo has been disabled.");
    }

}
