package tn.esprit.spring.msclasse4twin6;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableDiscoveryClient
@EnableRabbit
@EnableFeignClients
@EnableMethodSecurity
public class MSClasse4twin6Application {

    public static void main(String[] args) {
        SpringApplication.run(MSClasse4twin6Application.class, args);
    }
}
