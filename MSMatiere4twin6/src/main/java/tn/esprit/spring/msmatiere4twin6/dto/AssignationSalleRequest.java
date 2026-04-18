package tn.esprit.spring.msmatiere4twin6.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;

public class AssignationSalleRequest {

    private Long salleId;
    private Long classeId;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime heureDebutSeance;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime heureFinSeance;

    public Long getSalleId() {
        return salleId;
    }

    public void setSalleId(Long salleId) {
        this.salleId = salleId;
    }

    public Long getClasseId() {
        return classeId;
    }

    public void setClasseId(Long classeId) {
        this.classeId = classeId;
    }

    public LocalTime getHeureDebutSeance() {
        return heureDebutSeance;
    }

    public void setHeureDebutSeance(LocalTime heureDebutSeance) {
        this.heureDebutSeance = heureDebutSeance;
    }

    public LocalTime getHeureFinSeance() {
        return heureFinSeance;
    }

    public void setHeureFinSeance(LocalTime heureFinSeance) {
        this.heureFinSeance = heureFinSeance;
    }
}
