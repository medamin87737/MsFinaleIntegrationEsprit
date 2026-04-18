package tn.esprit.spring.mssalle4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Client OpenFeign vers MSMatiere4twin6 pour consommer les matières dédiées à une salle.
 */
@FeignClient(name = "MSMatiere4twin6", contextId = "matiereFeignClient", path = "/matieres")
public interface MatiereFeignClient {

    @GetMapping("/salle/{salleId}")
    List<MatiereSessionInfo> getBySalleId(@PathVariable("salleId") Long salleId);
}
