package tn.esprit.spring.demoapigatewayapplication;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Import(GatewayTestSecurityConfig.class)
class DemoApiGatewayApplicationTests {

    @Test
    void contextLoads() {
    }

}
