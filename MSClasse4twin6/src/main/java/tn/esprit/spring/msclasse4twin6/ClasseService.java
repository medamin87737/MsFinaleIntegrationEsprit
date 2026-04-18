package tn.esprit.spring.msclasse4twin6;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import tn.esprit.spring.msclasse4twin6.dto.ClasseAvecMatieresDto;
import tn.esprit.spring.msclasse4twin6.dto.ClasseSearchCriteria;
import tn.esprit.spring.msclasse4twin6.dto.ClasseStatsDto;
import tn.esprit.spring.msclasse4twin6.dto.EmploiDuTempsDto;
import tn.esprit.spring.msclasse4twin6.dto.PresenceDto;
import tn.esprit.spring.msclasse4twin6.feign.EtudiantFeignClient;
import tn.esprit.spring.msclasse4twin6.feign.EtudiantSummary;
import tn.esprit.spring.msclasse4twin6.feign.MatiereClasseInfo;
import tn.esprit.spring.msclasse4twin6.feign.MatiereFeignClient;

import feign.FeignException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ClasseService implements IClasseService {

    private final ClasseRepository repository;
    private final MatiereFeignClient matiereFeignClient;
    private final EtudiantFeignClient etudiantFeignClient;

    public ClasseService(
            ClasseRepository repository,
            MatiereFeignClient matiereFeignClient,
            EtudiantFeignClient etudiantFeignClient) {
        this.repository = repository;
        this.matiereFeignClient = matiereFeignClient;
        this.etudiantFeignClient = etudiantFeignClient;
    }

    @Override
    public List<Classe> getAll() {
        return repository.findAll();
    }

    @Override
    public Optional<Classe> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Classe create(Classe entity) {
        entity.setId(null);
        return repository.save(entity);
    }

    @Override
    public Optional<Classe> update(Long id, Classe entity) {
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
    public Optional<ClasseAvecMatieresDto> getClasseAvecMatieres(Long classeId) {
        return repository.findById(classeId).map(this::toAvecMatieres);
    }

    @Override
    public Optional<Classe> findMyClasseForCurrentEtudiant() {
        try {
            EtudiantSummary me = etudiantFeignClient.getMe();
            if (me == null || me.getClasseId() == null) {
                return Optional.empty();
            }
            return repository.findById(me.getClasseId());
        } catch (FeignException e) {
            if (e.status() == 404) {
                return Optional.empty();
            }
            throw e;
        }
    }

    @Override
    public List<ClasseAvecMatieresDto> findAllAvecEmploi() {
        return repository.findAll().stream().map(this::toAvecMatieres).collect(Collectors.toList());
    }

    @Override
    public List<ClasseAvecMatieresDto> findByEnseignantId(Long enseignantId) {
        if (enseignantId == null) {
            return List.of();
        }
        Set<Long> ids = matiereFeignClient.getByEnseignantId(enseignantId).stream()
                .map(MatiereClasseInfo::getClasseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<ClasseAvecMatieresDto> out = new ArrayList<>();
        for (Long cid : ids) {
            repository.findById(cid).map(this::toAvecMatieres).ifPresent(out::add);
        }
        return out;
    }

    @Override
    public Page<Classe> searchDynamic(ClasseSearchCriteria criteria, Pageable pageable) {
        Specification<Classe> spec = Specification.where(null);
        if (StringUtils.hasText(criteria.getNom())) {
            String pat = "%" + criteria.getNom().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("nom")), pat));
        }
        if (StringUtils.hasText(criteria.getFiliere())) {
            String pat = "%" + criteria.getFiliere().toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("description")), pat));
        }
        if (criteria.getEnseignantId() != null) {
            List<Long> allowed = matiereFeignClient.getByEnseignantId(criteria.getEnseignantId()).stream()
                    .map(MatiereClasseInfo::getClasseId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
            if (allowed.isEmpty()) {
                return Page.empty(pageable);
            }
            spec = spec.and((root, q, cb) -> root.get("id").in(allowed));
        }
        return repository.findAll(spec, pageable);
    }

    @Override
    public List<EmploiDuTempsDto> getEmploiDuTemps(Long classeId) {
        List<MatiereClasseInfo> matieres = matiereFeignClient.getByClasseId(classeId);
        List<EmploiDuTempsDto> rows = new ArrayList<>();
        for (MatiereClasseInfo m : matieres) {
            EmploiDuTempsDto row = new EmploiDuTempsDto();
            row.setJour("—");
            row.setHeureDebut(m.getHeureDebutSeance());
            row.setHeureFin(m.getHeureFinSeance());
            row.setMatiereNom(m.getNom());
            row.setSalleId(m.getSalleId());
            row.setEnseignantLabel(m.getEnseignantId() != null ? "enseignantId=" + m.getEnseignantId() : null);
            rows.add(row);
        }
        return rows;
    }

    @Override
    public List<EtudiantSummary> getEtudiants(Long classeId) {
        return etudiantFeignClient.getByClasse(classeId);
    }

    @Override
    public ClasseStatsDto getStats(Long classeId) {
        ClasseStatsDto dto = new ClasseStatsDto();
        List<EtudiantSummary> etu = getEtudiants(classeId);
        dto.setNbEtudiants(etu != null ? etu.size() : 0);
        List<MatiereClasseInfo> mat = matiereFeignClient.getByClasseId(classeId);
        dto.setNbMatieres(mat.size());
        double heures = 0;
        for (MatiereClasseInfo m : mat) {
            if (m.getHeureDebutSeance() != null && m.getHeureFinSeance() != null) {
                heures += 1.5;
            }
        }
        dto.setNbHeuresParSemaine(heures);
        dto.setMoyenneGenerale(null);
        return dto;
    }

    @Override
    public PresenceDto getPresenceSheet(Long classeId) {
        PresenceDto p = new PresenceDto();
        p.setClasseId(classeId);
        repository.findById(classeId).ifPresent(c -> p.setClasseNom(c.getNom()));
        p.setEtudiants(getEtudiants(classeId));
        return p;
    }

    @Override
    public boolean classeAppartientEnseignant(Long classeId, Long enseignantId) {
        if (classeId == null || enseignantId == null) {
            return false;
        }
        return matiereFeignClient.getByClasseId(classeId).stream()
                .anyMatch(m -> enseignantId.equals(m.getEnseignantId()));
    }

    private ClasseAvecMatieresDto toAvecMatieres(Classe classe) {
        List<MatiereClasseInfo> matieres = matiereFeignClient.getByClasseId(classe.getId());
        ClasseAvecMatieresDto dto = new ClasseAvecMatieresDto();
        dto.setClasseId(classe.getId());
        dto.setClasseNom(classe.getNom());
        dto.setClasseDescription(classe.getDescription());
        dto.setMatieres(matieres);
        return dto;
    }
}
