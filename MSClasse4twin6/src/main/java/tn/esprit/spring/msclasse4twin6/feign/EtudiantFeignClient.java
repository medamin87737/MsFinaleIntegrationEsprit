package tn.esprit.spring.msclasse4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/** Client Feign vers MSEtudiant4twin6 (JWT relay via {@code FeignRoleRelayConfig}). */
@FeignClient(name = "MSEtudiant4twin6", contextId = "etudiantFeignClientClasse", path = "/etudiants")
public interface EtudiantFeignClient {

    @GetMapping("/me")
    EtudiantSummary getMe();

    @GetMapping("/classe/{classeId}")
    List<EtudiantSummary> getByClasse(@PathVariable("classeId") Long classeId);
}
