package tn.esprit.spring.msenseignant4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "MSEtudiant4twin6", contextId = "etudiantFeignEnseignant", path = "/etudiants")
public interface EtudiantFeignClient {

    @GetMapping("/me")
    EtudiantSummary getMe();
}
