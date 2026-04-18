package tn.esprit.spring.common.chef;

/**
 * Règles communes : tout ce qui n’est pas explicitement &quot;public&quot; exige le Chef Enseignant.
 * <ul>
 *   <li><strong>Spécial {@code /classes}</strong> : seuls POST (création), PUT et DELETE exigent le Chef. Les GET
 *       (liste, détail, welcome, pédagogie, etc.) sont accessibles sans cet en-tête.</li>
 *   <li>Autres ressources : public = {@code /{base}/welcome}, GET {@code /{base}/{id}} (id numérique), agrégats Feign ;
 *       le reste (listes, audit, mutations, …) = Chef.</li>
 * </ul>
 */
public final class ChefEnseignantPathRules {

    private ChefEnseignantPathRules() {}

    /**
     * @param path chemin sans query string (ex. {@code /etudiants} ou {@code /matieres/1/details-avec-enseignant/2})
     * @param resourceBase préfixe du contrôleur (ex. {@code /etudiants}, {@code /classes})
     */
    public static boolean requiresChef(String method, String path, String resourceBase) {
        if (method != null && "OPTIONS".equalsIgnoreCase(method)) {
            return false;
        }
        if (resourceBase == null || resourceBase.isEmpty() || !resourceBase.startsWith("/")) {
            return false;
        }
        if (!underBase(path, resourceBase)) {
            return false;
        }
        if ("/classes".equals(resourceBase)) {
            return chefOnlyForClassesMutations(method, path);
        }
        return !isPublic(method, path, resourceBase);
    }

    /** Pour les classes : uniquement création / mise à jour / suppression réservées au Chef Enseignant. */
    private static boolean chefOnlyForClassesMutations(String method, String path) {
        if ("POST".equals(method) && "/classes".equals(path)) {
            return true;
        }
        if ("PUT".equals(method) && path.matches("/classes/\\d+")) {
            return true;
        }
        return "DELETE".equals(method) && path.matches("/classes/\\d+");
    }

    private static boolean underBase(String path, String base) {
        return path.equals(base) || path.startsWith(base + "/");
    }

    private static boolean isPublic(String method, String path, String base) {
        if (path.equals(base + "/welcome")) {
            return true;
        }
        if ("GET".equals(method) && path.matches(base + "/\\d+")) {
            return true;
        }
        if ("GET".equals(method) && "/matieres".equals(base)
                && path.matches("/matieres/\\d+/details-avec-enseignant/\\d+")) {
            return true;
        }
        if ("GET".equals(method) && "/salles".equals(base)
                && path.matches("/salles/\\d+/avec-libelle-classe")) {
            return true;
        }
        return false;
    }
}
