package tn.esprit.spring.msmatiere4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Client OpenFeign vers MSEnseignant4twin6 (lookup enseignant par id).
 */
@FeignClient(name = "MSEnseignant4twin6", contextId = "enseignantFeignClient", path = "/enseignants")
public interface EnseignantFeignClient {

    @GetMapping("/{id}")
    EnseignantInfo getById(@PathVariable("id") Long id);
}
