package com.servicedesk.ticket.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.UserRole;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;

    @Value("${auth.jwt.secret}")
    private String secret;

    @Value("${auth.jwt.expiration-ms:86400000}")
    private long expirationMs;

    private byte[] secretBytes;

    public JwtService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void init() {
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(User user) {
        long now = Instant.now().getEpochSecond();
        long exp = now + (expirationMs / 1000);

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", user.getUsername());
        payload.put("userId", user.getId());
        payload.put("role", user.getRole().name());
        payload.put("name", user.getName());
        payload.put("iat", now);
        payload.put("exp", exp);

        String encodedHeader = base64UrlJson(header);
        String encodedPayload = base64UrlJson(payload);
        String unsignedToken = encodedHeader + "." + encodedPayload;
        return unsignedToken + "." + sign(unsignedToken);
    }

    public AuthenticatedUser parseToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Token is required");
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid token format");
        }

        String unsignedToken = parts[0] + "." + parts[1];
        String expectedSignature = sign(unsignedToken);
        if (!constantTimeEquals(expectedSignature, parts[2])) {
            throw new IllegalArgumentException("Invalid token signature");
        }

        Map<String, Object> payload = decodePayload(parts[1]);
        long exp = asLong(payload.get("exp"));
        if (Instant.now().getEpochSecond() >= exp) {
            throw new IllegalArgumentException("Token has expired");
        }

        Long userId = asLong(payload.get("userId"));
        UserRole role = UserRole.valueOf(String.valueOf(payload.get("role")));
        String name = payload.get("name") == null ? null : String.valueOf(payload.get("name"));
        String username = payload.get("sub") == null ? null : String.valueOf(payload.get("sub"));

        return new AuthenticatedUser(userId, role, name, username);
    }

    private String base64UrlJson(Map<String, Object> value) {
        try {
            return BASE64_URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception e) {
            throw new IllegalStateException("Could not encode JWT payload", e);
        }
    }

    private Map<String, Object> decodePayload(String encodedPayload) {
        try {
            byte[] json = BASE64_URL_DECODER.decode(encodedPayload);
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid token payload", e);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretBytes, HMAC_ALGORITHM));
            return BASE64_URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign token", e);
        }
    }

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    private boolean constantTimeEquals(String expected, String actual) {
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = actual.getBytes(StandardCharsets.UTF_8);
        if (expectedBytes.length != actualBytes.length) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < expectedBytes.length; i++) {
            result |= expectedBytes[i] ^ actualBytes[i];
        }
        return result == 0;
    }

    public record AuthenticatedUser(Long userId, UserRole role, String name, String username) {}
}
