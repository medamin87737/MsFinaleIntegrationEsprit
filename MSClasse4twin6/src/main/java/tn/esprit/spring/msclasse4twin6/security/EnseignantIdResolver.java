package tn.esprit.spring.msclasse4twin6.security;

import feign.FeignException;
import org.springframework.stereotype.Component;
import tn.esprit.spring.msclasse4twin6.feign.EnseignantFeignClient;
import tn.esprit.spring.msclasse4twin6.feign.EnseignantInfo;

import java.util.List;

/**
 * Résout l’ID métier enseignant : claim {@code school_enseignant_id}, sinon {@code GET /enseignants/me}
 * (matricule = preferred_username), comme {@code EnseignantController#getMe}.
 */
@Component
public class EnseignantIdResolver {

    private final SecurityUtils securityUtils;
    private final EnseignantFeignClient enseignantFeignClient;

    public EnseignantIdResolver(SecurityUtils securityUtils, EnseignantFeignClient enseignantFeignClient) {
        this.securityUtils = securityUtils;
        this.enseignantFeignClient = enseignantFeignClient;
    }

    public Long resolveOrNull() {
        Long id = securityUtils.getSchoolEnseignantId();
        if (id != null) {
            return id;
        }
        try {
            List<EnseignantInfo> me = enseignantFeignClient.getMe();
            if (me != null && !me.isEmpty() && me.get(0).getId() != null) {
                return me.get(0).getId();
            }
        } catch (FeignException ignored) {
            /* indisponible */
        } catch (RuntimeException ignored) {
            /* idem */
        }
        return null;
    }
}
