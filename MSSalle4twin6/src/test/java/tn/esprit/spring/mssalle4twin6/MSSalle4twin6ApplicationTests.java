package tn.esprit.spring.mssalle4twin6;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class MSSalle4twin6ApplicationTests {

    @MockBean
    JwtDecoder jwtDecoder;

    @Test
    void contextLoads() {
    }
}
