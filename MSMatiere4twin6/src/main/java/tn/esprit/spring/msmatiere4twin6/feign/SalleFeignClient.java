package tn.esprit.spring.msmatiere4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Client OpenFeign vers MSSalle4twin6 (lookup salle par id).
 */
@FeignClient(name = "MSSalle4twin6", contextId = "salleFeignClient", path = "/salles")
public interface SalleFeignClient {

    @GetMapping("/{id}")
    SalleInfo getById(@PathVariable("id") Long id);
}
