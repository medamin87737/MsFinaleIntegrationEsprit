package tn.esprit.spring.msclasse4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Client OpenFeign vers MSMatiere4twin6 pour récupérer les matières dédiées à une classe.
 */
@FeignClient(name = "MSMatiere4twin6", contextId = "matiereFeignClientClasse", path = "/matieres")
public interface MatiereFeignClient {

    @GetMapping("/classe/{classeId}")
    List<MatiereClasseInfo> getByClasseId(@PathVariable("classeId") Long classeId);

    @GetMapping("/enseignant/{enseignantId}")
    List<MatiereClasseInfo> getByEnseignantId(@PathVariable("enseignantId") Long enseignantId);
}
