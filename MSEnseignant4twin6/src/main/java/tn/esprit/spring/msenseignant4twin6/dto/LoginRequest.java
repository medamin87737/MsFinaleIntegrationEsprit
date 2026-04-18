package tn.esprit.spring.msenseignant4twin6.dto;

public class LoginRequest {

    private String matricule;
    private String password;

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
