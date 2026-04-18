package tn.esprit.spring.msmatiere4twin6;

import feign.FeignException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.spring.msmatiere4twin6.dto.MatiereAvecEnseignantDto;
import tn.esprit.spring.msmatiere4twin6.feign.ClasseFeignClient;
import tn.esprit.spring.msmatiere4twin6.feign.EnseignantFeignClient;
import tn.esprit.spring.msmatiere4twin6.feign.EnseignantInfo;
import tn.esprit.spring.msmatiere4twin6.feign.EtudiantFeignClient;
import tn.esprit.spring.msmatiere4twin6.feign.EtudiantSummary;
import tn.esprit.spring.msmatiere4twin6.feign.SalleFeignClient;
import tn.esprit.spring.msmatiere4twin6.security.SecurityUtils;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MatiereService implements IMatiereService {

    private final MatiereRepository repository;
    private final EnseignantFeignClient enseignantFeignClient;
    private final SalleFeignClient salleFeignClient;
    private final ClasseFeignClient classeFeignClient;
    private final EtudiantFeignClient etudiantFeignClient;
    private final SecurityUtils securityUtils;

    public MatiereService(
            MatiereRepository repository,
            EnseignantFeignClient enseignantFeignClient,
            SalleFeignClient salleFeignClient,
            ClasseFeignClient classeFeignClient,
            EtudiantFeignClient etudiantFeignClient,
            SecurityUtils securityUtils
    ) {
        this.repository = repository;
        this.enseignantFeignClient = enseignantFeignClient;
        this.salleFeignClient = salleFeignClient;
        this.classeFeignClient = classeFeignClient;
        this.etudiantFeignClient = etudiantFeignClient;
        this.securityUtils = securityUtils;
    }

    /** Feign {@code GET /etudiants/me} : 404 si pas de fiche étudiant — ne pas propager en 500. */
    private Optional<EtudiantSummary> fetchEtudiantConnecte() {
        try {
            return Optional.ofNullable(etudiantFeignClient.getMe());
        } catch (FeignException e) {
            if (e.status() == 404) {
                return Optional.empty();
            }
            throw e;
        }
    }

    @Override
    public List<Matiere> getAll() {
        return repository.findAll();
    }

    @Override
    public Optional<Matiere> getById(Long id) {
        return repository.findById(id);
    }

    @Override
    public Matiere create(Matiere entity) {
        entity.setId(null);
        validateAssignation(entity.getSalleId(), entity.getClasseId(), entity.getHeureDebutSeance(), entity.getHeureFinSeance(), false);
        return repository.save(entity);
    }

    @Override
    public Optional<Matiere> update(Long id, Matiere entity) {
        return repository.findById(id).map(existing -> {
            validateAssignation(entity.getSalleId(), entity.getClasseId(), entity.getHeureDebutSeance(), entity.getHeureFinSeance(), false);
            existing.setNom(entity.getNom());
            existing.setDescription(entity.getDescription());
            existing.setSalleId(entity.getSalleId());
            existing.setClasseId(entity.getClasseId());
            existing.setEnseignantId(entity.getEnseignantId());
            existing.setHeureDebutSeance(entity.getHeureDebutSeance());
            existing.setHeureFinSeance(entity.getHeureFinSeance());
            return repository.save(existing);
        });
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Override
    public Optional<MatiereAvecEnseignantDto> getDetailAvecEnseignant(Long matiereId, Long enseignantId) {
        Optional<Matiere> matOpt = repository.findById(matiereId);
        if (matOpt.isEmpty()) {
            return Optional.empty();
        }
        Matiere mat = matOpt.get();
        try {
            EnseignantInfo ens = enseignantFeignClient.getById(enseignantId);
            MatiereAvecEnseignantDto dto = new MatiereAvecEnseignantDto();
            dto.setMatiereId(mat.getId());
            dto.setMatiereNom(mat.getNom());
            dto.setMatiereDescription(mat.getDescription());
            dto.setEnseignantId(ens.getId());
            dto.setEnseignantNom(ens.getNom());
            dto.setEnseignantDescription(ens.getDescription());
            dto.setEnseignantMatricule(ens.getMatricule());
            dto.setEnseignantRole(ens.getRole());
            return Optional.of(dto);
        } catch (FeignException e) {
            if (e.status() == 404) {
                return Optional.empty();
            }
            throw e;
        }
    }

    @Override
    public List<Matiere> getBySalleId(Long salleId) {
        return repository.findBySalleId(salleId);
    }

    @Override
    public List<Matiere> getByClasseId(Long classeId) {
        return repository.findByClasseId(classeId);
    }

    @Override
    public List<Matiere> getByEnseignantId(Long enseignantId) {
        return repository.findByEnseignantId(enseignantId);
    }

    @Override
    public List<Matiere> findMatieresPourEtudiantConnecte() {
        EtudiantSummary me = fetchEtudiantConnecte().orElse(null);
        if (me == null || me.getClasseId() == null) {
            return List.of();
        }
        return repository.findByClasseId(me.getClasseId());
    }

    @Override
    public List<Matiere> findMatieresPourEnseignantOuChef() {
        if (securityUtils.hasAuthority("ROLE_CHEF_ENSEIGNANT")) {
            return repository.findAll();
        }
        Long ensId = securityUtils.getSchoolEnseignantId();
        if (ensId == null) {
            return List.of();
        }
        return repository.findByEnseignantId(ensId);
    }

    @Override
    public Optional<Matiere> getByIdSecured(Long id) {
        Optional<Matiere> opt = repository.findById(id);
        if (opt.isEmpty()) {
            return Optional.empty();
        }
        Matiere m = opt.get();
        assertCanReadMatiere(m);
        return opt;
    }

    @Override
    public List<Matiere> getByClasseIdSecured(Long classeId) {
        List<Matiere> all = repository.findByClasseId(classeId);
        if (securityUtils.hasAuthority("ROLE_CHEF_ENSEIGNANT")) {
            return all;
        }
        if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            Long ensId = securityUtils.getSchoolEnseignantId();
            if (ensId == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Identifiant enseignant manquant dans le token.");
            }
            boolean ok = all.stream().anyMatch(x -> ensId.equals(x.getEnseignantId()));
            if (!ok) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette classe ne vous est pas assignée.");
            }
            return all;
        }
        if (securityUtils.hasAuthority("ROLE_ETUDIANT")) {
            EtudiantSummary me = fetchEtudiantConnecte().orElse(null);
            if (me == null || me.getClasseId() == null || !me.getClasseId().equals(classeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès limité à votre classe.");
            }
            return all;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rôle non autorisé.");
    }

    @Override
    public List<Matiere> getBySalleIdSecured(Long salleId) {
        List<Matiere> all = repository.findBySalleId(salleId);
        if (securityUtils.hasAuthority("ROLE_CHEF_ENSEIGNANT")) {
            return all;
        }
        if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            Long ensId = securityUtils.getSchoolEnseignantId();
            if (ensId == null) {
                return List.of();
            }
            return all.stream().filter(m -> ensId.equals(m.getEnseignantId())).collect(Collectors.toList());
        }
        if (securityUtils.hasAuthority("ROLE_ETUDIANT")) {
            EtudiantSummary me = fetchEtudiantConnecte().orElse(null);
            Long cid = me != null ? me.getClasseId() : null;
            if (cid == null) {
                return List.of();
            }
            return all.stream().filter(m -> cid.equals(m.getClasseId())).collect(Collectors.toList());
        }
        return List.of();
    }

    private void assertCanReadMatiere(Matiere m) {
        if (securityUtils.hasAuthority("ROLE_CHEF_ENSEIGNANT")) {
            return;
        }
        if (securityUtils.hasAuthority("ROLE_ENSEIGNANT")) {
            Long ensId = securityUtils.getSchoolEnseignantId();
            if (ensId != null && ensId.equals(m.getEnseignantId())) {
                return;
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Matière hors de votre périmètre.");
        }
        if (securityUtils.hasAuthority("ROLE_ETUDIANT")) {
            EtudiantSummary me = fetchEtudiantConnecte().orElse(null);
            Long cid = me != null ? me.getClasseId() : null;
            if (cid != null && cid.equals(m.getClasseId())) {
                return;
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Matière hors de votre classe.");
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rôle non autorisé.");
    }

    @Override
    public Optional<Matiere> assignerSalle(Long matiereId, Long salleId, Long classeId, LocalTime heureDebutSeance, LocalTime heureFinSeance) {
        validateAssignation(salleId, classeId, heureDebutSeance, heureFinSeance, true);
        return repository.findById(matiereId).map(matiere -> {
            matiere.setSalleId(salleId);
            matiere.setClasseId(classeId);
            matiere.setHeureDebutSeance(heureDebutSeance);
            matiere.setHeureFinSeance(heureFinSeance);
            return repository.save(matiere);
        });
    }

    private void validateAssignation(
            Long salleId,
            Long classeId,
            LocalTime heureDebutSeance,
            LocalTime heureFinSeance,
            boolean strict
    ) {
        boolean nothingProvided =
                salleId == null && classeId == null && heureDebutSeance == null && heureFinSeance == null;
        if (!strict && nothingProvided) {
            return;
        }

        if (salleId == null || classeId == null || heureDebutSeance == null || heureFinSeance == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "L'assignation complète exige salleId, classeId, heureDebutSeance et heureFinSeance."
            );
        }
        if (!heureDebutSeance.isBefore(heureFinSeance)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'heure de début doit être strictement avant l'heure de fin.");
        }

        try {
            salleFeignClient.getById(salleId);
        } catch (FeignException e) {
            if (e.status() == 404) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La salle " + salleId + " est introuvable pour l'assignation."
                );
            }
            throw e;
        }

        try {
            classeFeignClient.getById(classeId);
        } catch (FeignException e) {
            if (e.status() == 404) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La classe " + classeId + " est introuvable pour l'assignation."
                );
            }
            throw e;
        }
    }
}
