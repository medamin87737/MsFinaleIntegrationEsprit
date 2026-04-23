package tn.esprit.spring.msetudiant4twin6;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import tn.esprit.spring.msetudiant4twin6.dto.ClassePortailDto;
import tn.esprit.spring.msetudiant4twin6.dto.EtudiantPortailDto;
import tn.esprit.spring.msetudiant4twin6.dto.MatierePortailDto;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Agrège classe (si {@link Etudiant#getClasseId()}), matières et parcours notes via la gateway.
 * Les appels vers MSNotes / MSMatiere utilisent l’en-tête enseignant côté serveur (appel de confiance).
 */
@Service
public class EtudiantPortailService {

    private static final String HEADER_ROLE = "X-Enseignant-Role";
    private static final String ROLE_ENSEIGNANT = "Enseignant";

    private final RestTemplate restTemplate;

    @Value("${app.gateway.base-url:http://api-gateway:8080}")
    private String gatewayBase;

    public EtudiantPortailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public EtudiantPortailDto buildPortail(Etudiant e) {
        EtudiantPortailDto dto = new EtudiantPortailDto();
        Long etudiantId = e.getId();
        HttpHeaders headers = new HttpHeaders();
        headers.set(HEADER_ROLE, ROLE_ENSEIGNANT);
        HttpEntity<Void> avecRole = new HttpEntity<>(headers);

        JsonNode notesRoot = fetchNotesEtudiant(etudiantId, avecRole);
        dto.setNotesInscriptions(notesRoot);

        Set<Long> matiereIds = new LinkedHashSet<>();
        if (notesRoot != null && notesRoot.isArray()) {
            for (JsonNode n : notesRoot) {
                if (n.hasNonNull("matiereId")) {
                    matiereIds.add(n.get("matiereId").asLong());
                }
            }
        }

        List<MatierePortailDto> matieres = new ArrayList<>();
        for (Long mid : matiereIds) {
            MatierePortailDto m = fetchMatiere(mid, avecRole);
            if (m != null) {
                matieres.add(m);
            }
        }
        dto.setMatieres(matieres);

        if (e.getClasseId() != null) {
            dto.setClasse(fetchClasse(e.getClasseId()));
        }
        return dto;
    }

    private JsonNode fetchNotesEtudiant(Long etudiantId, HttpEntity<Void> avecRole) {
        try {
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    gatewayBase + "/notes/etudiants/" + etudiantId,
                    HttpMethod.GET,
                    avecRole,
                    JsonNode.class);
            return resp.getBody();
        } catch (RestClientException ex) {
            return null;
        }
    }

    private MatierePortailDto fetchMatiere(Long id, HttpEntity<Void> avecRole) {
        try {
            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    gatewayBase + "/matieres/" + id,
                    HttpMethod.GET,
                    avecRole,
                    JsonNode.class);
            JsonNode b = resp.getBody();
            if (b == null) {
                return null;
            }
            MatierePortailDto m = new MatierePortailDto();
            m.setId(id);
            m.setNom(b.has("nom") && !b.get("nom").isNull() ? b.get("nom").asText() : null);
            m.setDescription(b.has("description") && !b.get("description").isNull() ? b.get("description").asText() : null);
            return m;
        } catch (RestClientException ex) {
            return null;
        }
    }

    private ClassePortailDto fetchClasse(Long id) {
        try {
            ResponseEntity<JsonNode> resp = restTemplate.getForEntity(
                    gatewayBase + "/classes/" + id,
                    JsonNode.class);
            JsonNode b = resp.getBody();
            if (b == null) {
                return null;
            }
            ClassePortailDto c = new ClassePortailDto();
            c.setId(id);
            c.setNom(b.has("nom") && !b.get("nom").isNull() ? b.get("nom").asText() : null);
            c.setDescription(b.has("description") && !b.get("description").isNull() ? b.get("description").asText() : null);
            return c;
        } catch (RestClientException ex) {
            return null;
        }
    }
}
