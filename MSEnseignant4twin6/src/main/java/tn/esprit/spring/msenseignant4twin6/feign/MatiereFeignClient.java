package tn.esprit.spring.msenseignant4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "MSMatiere4twin6", contextId = "matiereFeignEnseignant", path = "/matieres")
public interface MatiereFeignClient {

    @GetMapping("/classe/{classeId}")
    List<MatiereRef> getByClasseId(@PathVariable("classeId") Long classeId);
}
