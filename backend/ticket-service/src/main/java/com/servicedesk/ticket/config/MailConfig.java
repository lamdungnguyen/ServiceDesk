package com.servicedesk.ticket.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.io.InputStream;
import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        return new JavaMailSender() {
            @Override
            public MimeMessage createMimeMessage() {
                return new MimeMessage(Session.getDefaultInstance(new Properties()));
            }

            @Override
            public MimeMessage createMimeMessage(InputStream contentStream) throws MailException {
                return createMimeMessage();
            }

            @Override
            public void send(MimeMessage mimeMessage) throws MailException {
                // Mock: do nothing
            }

            @Override
            public void send(MimeMessage... mimeMessages) throws MailException {
                // Mock: do nothing
            }

            @Override
            public void send(MimeMessagePreparator mimeMessagePreparator) throws MailException {
                // Mock: do nothing
            }

            @Override
            public void send(MimeMessagePreparator... mimeMessagePreparators) throws MailException {
                // Mock: do nothing
            }

            @Override
            public void send(SimpleMailMessage simpleMessage) throws MailException {
                // Mock: do nothing
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) throws MailException {
                // Mock: do nothing
            }
        };
    }
}
