package tn.esprit.spring.msmatiere4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

/** Profil étudiant connecté (JWT relay). */
@FeignClient(name = "MSEtudiant4twin6", contextId = "etudiantFeignMatiere", path = "/etudiants")
public interface EtudiantFeignClient {

    @GetMapping("/me")
    EtudiantSummary getMe();
}
