package tn.esprit.spring.mssalle4twin6.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Propage le rôle enseignant sur les appels Feign sortants.
 */
@Configuration
public class FeignRoleRelayConfig {

    private static final String ROLE_HEADER = "X-Enseignant-Role";
    private static final String DEFAULT_ROLE = "Enseignant";

    @Bean
    public RequestInterceptor roleRelayRequestInterceptor() {
        return template -> {
            String role = resolveCurrentRole();
            template.header(ROLE_HEADER, role);
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes servletAttrs) {
                String auth = servletAttrs.getRequest().getHeader("Authorization");
                if (auth != null && !auth.isBlank()) {
                    template.header("Authorization", auth);
                }
            }
        };
    }

    private String resolveCurrentRole() {
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
