package tn.esprit.spring.mssalle4twin6;

import feign.FeignException;
import org.springframework.stereotype.Service;
import tn.esprit.spring.mssalle4twin6.dto.SalleAvecClasseDto;
import tn.esprit.spring.mssalle4twin6.dto.SalleAvecMatieresDto;
import tn.esprit.spring.mssalle4twin6.feign.ClasseFeignClient;
import tn.esprit.spring.mssalle4twin6.feign.ClasseInfo;
import tn.esprit.spring.mssalle4twin6.feign.MatiereFeignClient;
import tn.esprit.spring.mssalle4twin6.feign.MatiereSessionInfo;

import java.util.List;
import java.util.Optional;

@Service
public class SalleService implements ISalleService {

    private final SalleRepository repository;
    private final ClasseFeignClient classeFeignClient;
    private final MatiereFeignClient matiereFeignClient;

    public SalleService(
            SalleRepository repository,
            ClasseFeignClient classeFeignClient,
            MatiereFeignClient matiereFeignClient
    ) {
        this.repository = repository;
        this.classeFeignClient = classeFeignClient;
        this.matiereFeignClient = matiereFeignClient;
    }

    @Override
    public List<Salle> getAll() {
        return repository.findAll();
    }

    @Override
    public Optional<Salle> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Salle create(Salle entity) {
        entity.setId(null);
        return repository.save(entity);
    }

    @Override
    public Optional<Salle> update(Long id, Salle entity) {
        return repository.findById(id).map(existing -> {
            existing.setNom(entity.getNom());
            existing.setDescription(entity.getDescription());
            return repository.save(existing);
        });
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Override
    public Optional<SalleAvecClasseDto> getAvecLibelleClasse(Long salleId, Long classeId) {
        Optional<Salle> salleOpt = repository.findById(salleId);
        if (salleOpt.isEmpty()) {
            return Optional.empty();
        }
        Salle salle = salleOpt.get();
        try {
            ClasseInfo classe = classeFeignClient.getById(classeId);
            SalleAvecClasseDto dto = new SalleAvecClasseDto();
            dto.setSalleId(salle.getId());
            dto.setSalleNom(salle.getNom());
            dto.setSalleDescription(salle.getDescription());
            dto.setClasseId(classe.getId());
            dto.setClasseNom(classe.getNom());
            dto.setClasseDescription(classe.getDescription());
            return Optional.of(dto);
        } catch (FeignException e) {
            if (e.status() == 404) {
                return Optional.empty();
            }
            throw e;
        }
    }

    @Override
    public Optional<SalleAvecMatieresDto> getSalleAvecMatieres(Long salleId) {
        Optional<Salle> salleOpt = repository.findById(salleId);
        if (salleOpt.isEmpty()) {
            return Optional.empty();
        }

        Salle salle = salleOpt.get();
        List<MatiereSessionInfo> matieres = matiereFeignClient.getBySalleId(salleId);

        SalleAvecMatieresDto dto = new SalleAvecMatieresDto();
        dto.setSalleId(salle.getId());
        dto.setSalleNom(salle.getNom());
        dto.setSalleDescription(salle.getDescription());
        dto.setMatieres(matieres);
        return Optional.of(dto);
    }
}
