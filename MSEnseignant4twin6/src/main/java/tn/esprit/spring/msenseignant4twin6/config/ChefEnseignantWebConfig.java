package tn.esprit.spring.msenseignant4twin6.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;

@Configuration
public class ChefEnseignantWebConfig implements WebMvcConfigurer {

    private static final String ROLE_HEADER = "X-Enseignant-Role";
    private static final String RESOURCE_BASE = "/enseignants";

    @Bean
    public HandlerInterceptor chefEnseignantInterceptor() {
        return new HandlerInterceptor() {
            @Override
            public boolean preHandle(
                    @NonNull HttpServletRequest request,
                    @NonNull HttpServletResponse response,
                    @NonNull Object handler)
                    throws IOException {
                String path = stripContextPath(request);
                if (!requiresChef(request.getMethod(), path)) {
                    return true;
                }
                if (isChef(request)) {
                    return true;
                }
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setCharacterEncoding("UTF-8");
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"message\":\"Réservé au Chef Enseignant. Envoyez l'en-tête X-Enseignant-Role: \\\"Chef Enseignant\\\" (ou CHEF_ENSEIGNANT).\"}");
                return false;
            }
        };
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(chefEnseignantInterceptor())
                .addPathPatterns("/enseignants/**")
                .excludePathPatterns("/enseignants/auth/**");
    }

    private static boolean isChef(HttpServletRequest request) {
        if (jwtHasChef()) {
            return true;
        }
        String raw = request.getHeader(ROLE_HEADER);
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String role = raw.trim();
        return "Chef Enseignant".equals(role) || "CHEF_ENSEIGNANT".equalsIgnoreCase(role);
    }

    private static boolean jwtHasChef() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null
                && auth.getAuthorities().stream().anyMatch(a -> "ROLE_CHEF_ENSEIGNANT".equals(a.getAuthority()));
    }

    private static String stripContextPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String ctx = request.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            return uri.substring(ctx.length());
        }
        return uri;
    }

    private static boolean requiresChef(String method, String path) {
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return false;
        }
        if (!path.equals(RESOURCE_BASE) && !path.startsWith(RESOURCE_BASE + "/")) {
            return false;
        }
        if ("POST".equals(method) && RESOURCE_BASE.equals(path)) {
            return true;
        }
        if ("PUT".equals(method) && path.matches(RESOURCE_BASE + "/\\d+")) {
            return true;
        }
        return "DELETE".equals(method) && path.matches(RESOURCE_BASE + "/\\d+");
    }
}
