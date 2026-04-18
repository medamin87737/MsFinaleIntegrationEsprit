package tn.esprit.spring.msenseignant4twin6;

import feign.FeignException;
import org.springframework.stereotype.Service;
import tn.esprit.spring.msenseignant4twin6.feign.EtudiantFeignClient;
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

    public EnseignantService(
            EnseignantRepository repository,
            EtudiantFeignClient etudiantFeignClient,
            MatiereFeignClient matiereFeignClient) {
        this.repository = repository;
        this.etudiantFeignClient = etudiantFeignClient;
        this.matiereFeignClient = matiereFeignClient;
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
    public Enseignant create(Enseignant entity) {
        entity.setId(null);
        return repository.save(entity);
    }

    @Override
    public Optional<Enseignant> update(Long id, Enseignant entity) {
        return repository.findById(id).map(existing -> {
            existing.setNom(entity.getNom());
            existing.setDescription(entity.getDescription());
            existing.setMatricule(entity.getMatricule());
            if (entity.getPassword() != null && !entity.getPassword().isEmpty()) {
                existing.setPassword(entity.getPassword());
            }
            existing.setRole(entity.getRole() != null ? entity.getRole() : RoleEnseignant.ENSEIGNANT);
            return repository.save(existing);
        });
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
