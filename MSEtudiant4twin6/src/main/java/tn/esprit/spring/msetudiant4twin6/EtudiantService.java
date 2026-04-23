package tn.esprit.spring.msetudiant4twin6;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tn.esprit.spring.msetudiant4twin6.keycloak.KeycloakEtudiantProvisioningService;

import java.util.List;
import java.util.Optional;

@Service
public class EtudiantService implements IEtudiantService {

    private final EtudiantRepository repository;
    private final RestTemplate restTemplate;
    private final ObjectProvider<KeycloakEtudiantProvisioningService> keycloakProvisioning;

    @Value("${app.gateway.base-url:http://api-gateway:8080}")
    private String gatewayBase;

    public EtudiantService(
            EtudiantRepository repository,
            RestTemplate restTemplate,
            ObjectProvider<KeycloakEtudiantProvisioningService> keycloakProvisioning) {
        this.repository = repository;
        this.restTemplate = restTemplate;
        this.keycloakProvisioning = keycloakProvisioning;
    }

    @Override
    public List<Etudiant> getAll() {
        return repository.findAll();
    }

    @Override
    public Optional<Etudiant> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    @Transactional
    public Etudiant create(Etudiant entity) {
        entity.setId(null);
        Etudiant saved = repository.save(entity);
        keycloakProvisioning.ifAvailable(
                kc -> {
                    Optional<String> kid =
                            kc.syncEtudiant(saved.getMatricule(), saved.getPassword(), saved.getId(), true);
                    kid.ifPresent(
                            id -> {
                                saved.setKeycloakId(id);
                                repository.save(saved);
                            });
                });
        return saved;
    }

    @Override
    @Transactional
    public Optional<Etudiant> update(Long id, Etudiant entity) {
        return repository
                .findById(id)
                .map(
                        existing -> {
                            String oldMatricule = existing.getMatricule();
                            existing.setNom(entity.getNom());
                            existing.setDescription(entity.getDescription());
                            existing.setMatricule(entity.getMatricule());
                            existing.setClasseId(entity.getClasseId());
                            if (entity.getKeycloakId() != null) {
                                existing.setKeycloakId(entity.getKeycloakId());
                            }
                            if (entity.getPassword() != null && !entity.getPassword().isEmpty()) {
                                existing.setPassword(entity.getPassword());
                            }
                            Etudiant saved = repository.save(existing);
                            keycloakProvisioning.ifAvailable(
                                    kc -> {
                                        if (oldMatricule != null
                                                && saved.getMatricule() != null
                                                && !oldMatricule.equalsIgnoreCase(saved.getMatricule().trim())) {
                                            kc.deleteByMatricule(oldMatricule);
                                        }
                                        kc.syncEtudiant(
                                                        saved.getMatricule(),
                                                        entity.getPassword(),
                                                        saved.getId(),
                                                        false)
                                                .ifPresent(saved::setKeycloakId);
                                        repository.save(saved);
                                    });
                            return saved;
                        });
    }

    @Override
    @Transactional
    public void delete(Long id) {
        repository
                .findById(id)
                .ifPresent(
                        e -> {
                            keycloakProvisioning.ifAvailable(kc -> kc.deleteByMatricule(e.getMatricule()));
                            repository.deleteById(id);
                        });
    }

    @Override
    public Optional<Etudiant> findByKeycloakId(String keycloakId) {
        if (keycloakId == null || keycloakId.isBlank()) {
            return Optional.empty();
        }
        return repository.findByKeycloakId(keycloakId);
    }

    @Override
    public Optional<Etudiant> findByMatricule(String matricule) {
        if (matricule == null || matricule.isBlank()) {
            return Optional.empty();
        }
        return repository.findByMatricule(matricule.trim());
    }

    @Override
    public List<Etudiant> findByClasseId(Long classeId) {
        return repository.findByClasseId(classeId);
    }

    @Override
    public boolean classeAppartientEnseignant(Long classeId, Long enseignantId) {
        if (enseignantId == null || classeId == null) {
            return false;
        }
        String base = gatewayBase.endsWith("/") ? gatewayBase.substring(0, gatewayBase.length() - 1) : gatewayBase;
        HttpEntity<Void> req = new HttpEntity<>(new HttpHeaders());
        try {
            ResponseEntity<JsonNode> listResp =
                    restTemplate.exchange(base + "/matieres/classe/" + classeId, HttpMethod.GET, req, JsonNode.class);
            JsonNode body = listResp.getBody();
            if (body == null || !body.isArray()) {
                return false;
            }
            for (JsonNode m : body) {
                if (m.hasNonNull("enseignantId") && m.get("enseignantId").asLong() == enseignantId) {
                    return true;
                }
            }
        } catch (RestClientException ignored) {
            return false;
        }
        return false;
    }
}
