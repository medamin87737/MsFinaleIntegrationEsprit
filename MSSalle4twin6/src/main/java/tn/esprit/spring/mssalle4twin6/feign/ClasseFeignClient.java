package tn.esprit.spring.mssalle4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Client OpenFeign vers MSClasse4twin6 (lookup classe par id).
 */
@FeignClient(name = "MSClasse4twin6", contextId = "classeFeignClient", path = "/classes")
public interface ClasseFeignClient {

    @GetMapping("/{id}")
    ClasseInfo getById(@PathVariable("id") Long id);
}
