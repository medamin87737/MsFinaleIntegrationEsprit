package tn.esprit.spring.msenseignant4twin6.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Propage le JWT (et l'en-tête enseignant) vers les appels Feign. */
@Configuration
public class FeignRoleRelayConfig {

    private static final String ROLE_HEADER = "X-Enseignant-Role";
    private static final String DEFAULT_ROLE = "Enseignant";

    @Bean
    public RequestInterceptor roleRelayRequestInterceptor() {
        return template -> {
            template.header(ROLE_HEADER, resolveCurrentRole());
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes servletAttrs) {
                String auth = servletAttrs.getRequest().getHeader("Authorization");
                if (auth != null && !auth.isBlank()) {
                    template.header("Authorization", auth);
                }
            }
        };
    }

    private static String resolveCurrentRole() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            String incomingRole = servletAttrs.getRequest().getHeader(ROLE_HEADER);
            if (incomingRole != null && !incomingRole.isBlank()) {
                return incomingRole.trim();
            }
        }
        return DEFAULT_ROLE;
    }
}
