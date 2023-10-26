package run.halo.lucence.processor;

import org.springframework.stereotype.Component;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.IModel;
import org.thymeleaf.model.IModelFactory;
import org.thymeleaf.processor.element.IElementModelStructureHandler;
import reactor.core.publisher.Mono;
import run.halo.app.theme.dialect.TemplateHeadProcessor;
import run.halo.lucence.util.KatexInjector;
import run.halo.lucence.util.MermaidInjector;
import java.util.Map;

/**
 * @author Dioxide.CN
 * @date 2023/10/25
 * @since 1.0
 */
@Component
public class HeadProcessor implements TemplateHeadProcessor {

    private static final String TEMPLATE_ID_VARIABLE = "_templateId";

    @Override
    public Mono<Void> process(ITemplateContext context,
                              IModel model,
                              IElementModelStructureHandler structureHandler) {
        final IModelFactory modelFactory = context.getModelFactory();
        final String templateId = context.getVariable(TEMPLATE_ID_VARIABLE).toString();
        System.out.println("===[debug]===");
        System.out.println(templateId);
        System.out.println("===[debug]===");

        if ("page".equals(templateId) ||
            "post".equals(templateId)) {
            model.add(modelFactory.createText(
                KatexInjector.get() + MermaidInjector.get()
            ));
        }
        return Mono.empty();
    }

}
