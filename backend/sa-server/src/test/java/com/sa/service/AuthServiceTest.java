package com.sa.service;

import com.sa.dto.request.LoginRequest;
import com.sa.dto.request.RegisterRequest;
import com.sa.dto.response.LoginResponse;
import com.sa.dto.response.UserResponse;
import com.sa.entity.Role;
import com.sa.entity.User;
import com.sa.repository.UserRepository;
import com.sa.security.JwtTokenProvider;
import com.sa.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, authenticationManager, tokenProvider);
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Alice")
                .email("alice@example.com")
                .password("secret123")
                .build();

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed_secret123");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(101L);
            return u;
        });

        UserResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("Alice", response.getName());
        assertEquals("alice@example.com", response.getEmail());
        assertEquals(Role.USER.name(), response.getRole());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testLoginSuccess() {
        LoginRequest request = LoginRequest.builder()
                .email("alice@example.com")
                .password("secret123")
                .build();

        User user = User.builder()
                .id(101L)
                .name("Alice")
                .email("alice@example.com")
                .password("hashed_secret123")
                .role(Role.USER)
                .enabled(true)
                .build();

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(tokenProvider.generateToken(auth)).thenReturn("jwt.token.mock");
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("jwt.token.mock", response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals("alice@example.com", response.getEmail());
    }
}
