package tn.esprit.spring.demoapigatewayapplication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableDiscoveryClient
public class DemoApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator gatwayroutes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("central-docs-MSEtudiant4twin6", r -> r.path("/central-docs/MSEtudiant4twin6/**")
                        .filters(f -> f.rewritePath("/central-docs/MSEtudiant4twin6/(?<path>.*)", "/${path}"))
                        .uri("lb://MSEtudiant4twin6"))
                .route("central-docs-MSClasse4twin6", r -> r.path("/central-docs/MSClasse4twin6/**")
                        .filters(f -> f.rewritePath("/central-docs/MSClasse4twin6/(?<path>.*)", "/${path}"))
                        .uri("lb://MSClasse4twin6"))
                .route("central-docs-MSMatiere4twin6", r -> r.path("/central-docs/MSMatiere4twin6/**")
                        .filters(f -> f.rewritePath("/central-docs/MSMatiere4twin6/(?<path>.*)", "/${path}"))
                        .uri("lb://MSMatiere4twin6"))
                .route("central-docs-MSSalle4twin6", r -> r.path("/central-docs/MSSalle4twin6/**")
                        .filters(f -> f.rewritePath("/central-docs/MSSalle4twin6/(?<path>.*)", "/${path}"))
                        .uri("lb://MSSalle4twin6"))
                .route("central-docs-MSEnseignant4twin6", r -> r.path("/central-docs/MSEnseignant4twin6/**")
                        .filters(f -> f.rewritePath("/central-docs/MSEnseignant4twin6/(?<path>.*)", "/${path}"))
                        .uri("lb://MSEnseignant4twin6"))
                .route("etudiants_route", r -> r.path("/etudiants/**")
                        .uri("lb://MSEtudiant4twin6"))
                .route("enseignants_route", r -> r.path("/enseignants/**")
                        .uri("lb://MSEnseignant4twin6"))
                .route("classes_route", r -> r.path("/classes/**")
                        .uri("lb://MSClasse4twin6"))
                .route("matieres_route", r -> r.path("/matieres/**")
                        .uri("lb://MSMatiere4twin6"))
                .route("salles_route", r -> r.path("/salles/**")
                        .uri("lb://MSSalle4twin6"))
                .route("notes_route", r -> r.path("/notes/**")
                        .uri("lb://MSNotes4twin6"))
        .build();
    }
}
