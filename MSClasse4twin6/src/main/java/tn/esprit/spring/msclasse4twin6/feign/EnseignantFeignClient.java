package tn.esprit.spring.msclasse4twin6.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "MSEnseignant4twin6", contextId = "classeEnseignantFeign", path = "/enseignants")
public interface EnseignantFeignClient {

    @GetMapping("/me")
    List<EnseignantInfo> getMe();
}
