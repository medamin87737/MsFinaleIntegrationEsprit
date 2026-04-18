package tn.esprit.spring.msenseignant4twin6;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableMethodSecurity
public class MSEnseignant4twin6Application {

    public static void main(String[] args) {
        SpringApplication.run(MSEnseignant4twin6Application.class, args);
    }
}
