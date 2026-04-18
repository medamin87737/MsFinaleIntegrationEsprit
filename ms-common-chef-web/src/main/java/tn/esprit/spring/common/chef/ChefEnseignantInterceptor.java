package tn.esprit.spring.common.chef;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Intercepte les requêtes sous un préfixe de ressource (ex. {@code /etudiants}) et exige l’en-tête Chef si les
 * {@link ChefEnseignantPathRules} l’imposent.
 */
public class ChefEnseignantInterceptor implements HandlerInterceptor {

    private static final String MSG =
            "{\"message\":\"Réservé au Chef Enseignant. Envoyez l'en-tête "
                    + ChefEnseignantHeaders.ROLE_HEADER
                    + ": \\\"Chef Enseignant\\\" (ou CHEF_ENSEIGNANT).\"}";

    private final String resourceBase;

    public ChefEnseignantInterceptor(String resourceBase) {
        if (resourceBase == null || !resourceBase.startsWith("/")) {
            throw new IllegalArgumentException("resourceBase must start with /");
        }
        this.resourceBase = resourceBase;
    }

    @Override
    public boolean preHandle(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler)
            throws IOException {
        String path = stripContextPath(request);
        if (!ChefEnseignantPathRules.requiresChef(request.getMethod(), path, resourceBase)) {
            return true;
        }
        if (ChefEnseignantHeaders.isChefEnseignant(request)) {
            return true;
        }
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write(MSG);
        return false;
    }

    private static String stripContextPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String ctx = request.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            return uri.substring(ctx.length());
        }
        return uri;
    }
}
