package tn.esprit.spring.mssalle4twin6;

import feign.FeignException;
import org.springframework.stereotype.Service;
import tn.esprit.spring.mssalle4twin6.dto.SalleAvecClasseDto;
import tn.esprit.spring.mssalle4twin6.dto.SalleAvecMatieresDto;
import tn.esprit.spring.mssalle4twin6.feign.ClasseFeignClient;
import tn.esprit.spring.mssalle4twin6.feign.ClasseInfo;
import tn.esprit.spring.mssalle4twin6.feign.MatiereFeignClient;
import tn.esprit.spring.mssalle4twin6.feign.MatiereSessionInfo;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

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

    private static boolean hasAuthority(String name) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        for (GrantedAuthority a : auth.getAuthorities()) {
            if (name.equals(a.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public List<Salle> findMesSallesPourUtilisateurConnecte() {
        if (hasAuthority("ROLE_CHEF_ENSEIGNANT")) {
            return repository.findAll();
        }
        List<MatiereSessionInfo> matieres;
        try {
            matieres = matiereFeignClient.getMesMatieres();
        } catch (FeignException e) {
            if (e.status() == 403 || e.status() == 401) {
                return List.of();
            }
            throw e;
        }
        if (matieres == null || matieres.isEmpty()) {
            return List.of();
        }
        Set<Long> ids = matieres.stream()
                .map(MatiereSessionInfo::getSalleId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (ids.isEmpty()) {
            return List.of();
        }
        return repository.findAllById(ids);
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
