package run.halo.lucence;

import org.pf4j.PluginWrapper;
import org.springframework.stereotype.Component;
import run.halo.app.plugin.BasePlugin;

@Component
public class LucenceStarter extends BasePlugin {

    public LucenceStarter(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Override
    public void start() {
        System.out.println("Lucence-for-halo has been started.");
    }

    @Override
    public void stop() {
        System.out.println("Lucence-for-halo has been disabled.");
    }
}
