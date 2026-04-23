package tn.esprit.spring.msenseignant4twin6;

import feign.FeignException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.spring.msenseignant4twin6.feign.EtudiantFeignClient;
import tn.esprit.spring.msenseignant4twin6.keycloak.KeycloakUserProvisioningService;
import tn.esprit.spring.msenseignant4twin6.feign.EtudiantSummary;
import tn.esprit.spring.msenseignant4twin6.feign.MatiereFeignClient;
import tn.esprit.spring.msenseignant4twin6.feign.MatiereRef;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class EnseignantService implements IEnseignantService {

    private final EnseignantRepository repository;
    private final EtudiantFeignClient etudiantFeignClient;
    private final MatiereFeignClient matiereFeignClient;
    private final ObjectProvider<KeycloakUserProvisioningService> keycloakProvisioning;

    public EnseignantService(
            EnseignantRepository repository,
            EtudiantFeignClient etudiantFeignClient,
            MatiereFeignClient matiereFeignClient,
            ObjectProvider<KeycloakUserProvisioningService> keycloakProvisioning) {
        this.repository = repository;
        this.etudiantFeignClient = etudiantFeignClient;
        this.matiereFeignClient = matiereFeignClient;
        this.keycloakProvisioning = keycloakProvisioning;
    }

    @Override
    public List<Enseignant> getAll() {
        return repository.findAll();
    }

    @Override
    public List<Enseignant> findProfesseursPourEtudiantConnecte() {
        try {
            EtudiantSummary me = etudiantFeignClient.getMe();
            if (me == null || me.getClasseId() == null) {
                return List.of();
            }
            List<MatiereRef> matieres = matiereFeignClient.getByClasseId(me.getClasseId());
            Set<Long> ids = new LinkedHashSet<>();
            for (MatiereRef m : matieres) {
                if (m.getEnseignantId() != null) {
                    ids.add(m.getEnseignantId());
                }
            }
            List<Enseignant> out = new ArrayList<>();
            for (Long id : ids) {
                getById(id).ifPresent(out::add);
            }
            return out;
        } catch (FeignException e) {
            return List.of();
        }
    }

    @Override
    public Optional<Enseignant> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Optional<Enseignant> findByMatriculeIgnoreCase(String matricule) {
        if (matricule == null || matricule.isBlank()) {
            return Optional.empty();
        }
        return repository.findByMatriculeIgnoreCase(matricule.trim());
    }

    @Override
    @Transactional
    public Enseignant create(Enseignant entity) {
        entity.setId(null);
        Enseignant saved = repository.save(entity);
        keycloakProvisioning.ifAvailable(
                kc ->
                        kc.syncEnseignant(
                                saved.getMatricule(),
                                saved.getPassword(),
                                saved.getId(),
                                saved.getRole() != null ? saved.getRole() : RoleEnseignant.ENSEIGNANT,
                                true));
        return saved;
    }

    @Override
    @Transactional
    public Optional<Enseignant> update(Long id, Enseignant entity) {
        return repository
                .findById(id)
                .map(
                        existing -> {
                            String oldMatricule = existing.getMatricule();
                            existing.setNom(entity.getNom());
                            existing.setDescription(entity.getDescription());
                            existing.setMatricule(entity.getMatricule());
                            if (entity.getPassword() != null && !entity.getPassword().isEmpty()) {
                                existing.setPassword(entity.getPassword());
                            }
                            existing.setRole(
                                    entity.getRole() != null ? entity.getRole() : RoleEnseignant.ENSEIGNANT);
                            Enseignant saved = repository.save(existing);
                            keycloakProvisioning.ifAvailable(
                                    kc -> {
                                        if (oldMatricule != null
                                                && saved.getMatricule() != null
                                                && !oldMatricule.equalsIgnoreCase(saved.getMatricule().trim())) {
                                            kc.deleteByMatricule(oldMatricule);
                                        }
                                        kc.syncEnseignant(
                                                saved.getMatricule(),
                                                entity.getPassword(),
                                                saved.getId(),
                                                saved.getRole(),
                                                false);
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
}
