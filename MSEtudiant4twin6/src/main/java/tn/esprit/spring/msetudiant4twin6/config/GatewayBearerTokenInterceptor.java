package tn.esprit.spring.msetudiant4twin6.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.authentication.AnonymousAuthenticationToken;

import java.io.IOException;

/**
 * Ajoute un Bearer JWT aux appels RestTemplate vers la gateway : token utilisateur si présent,
 * sinon flux client_credentials (client school-gateway).
 */
public class GatewayBearerTokenInterceptor implements ClientHttpRequestInterceptor {

    private static final String CLIENT_REGISTRATION_ID = "gateway-kc";

    private final OAuth2AuthorizedClientManager authorizedClientManager;
    private final String gatewayBase;

    public GatewayBearerTokenInterceptor(
            OAuth2AuthorizedClientManager authorizedClientManager,
            @Value("${app.gateway.base-url:http://api-gateway:8080}") String gatewayBase) {
        this.authorizedClientManager = authorizedClientManager;
        this.gatewayBase = gatewayBase.endsWith("/") ? gatewayBase.substring(0, gatewayBase.length() - 1) : gatewayBase;
    }

    @Override
    @NonNull
    public ClientHttpResponse intercept(
            @NonNull HttpRequest request,
            @NonNull byte[] body,
            @NonNull ClientHttpRequestExecution execution) throws IOException {
        String uri = request.getURI().toString();
        if (!uri.startsWith(gatewayBase)) {
            return execution.execute(request, body);
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            request.getHeaders().setBearerAuth(jwtAuth.getToken().getTokenValue());
        } else {
            Authentication principal =
                    new AnonymousAuthenticationToken("internal", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS"));
            OAuth2AuthorizeRequest authorizeRequest =
                    OAuth2AuthorizeRequest.withClientRegistrationId(CLIENT_REGISTRATION_ID).principal(principal).build();
            OAuth2AuthorizedClient client = authorizedClientManager.authorize(authorizeRequest);
            if (client != null && client.getAccessToken() != null) {
                request.getHeaders().setBearerAuth(client.getAccessToken().getTokenValue());
            }
        }
        return execution.execute(request, body);
    }
}
