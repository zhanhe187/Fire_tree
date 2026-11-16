package com.firetree.heritage.features.system.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmailDeliveryService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailDeliveryService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final boolean mailEnabled;
    private final String fromAddress;

    public EmailDeliveryService(
        ObjectProvider<JavaMailSender> mailSenderProvider,
        @Value("${heritage.mail.enabled:false}") boolean mailEnabled,
        @Value("${heritage.mail.from:}") String fromAddress
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.mailEnabled = mailEnabled;
        this.fromAddress = fromAddress;
    }

    public void sendVerificationCode(String to, String purpose, String code, long expiresInSeconds) {
        if (!mailEnabled) {
            LOGGER.info("Mail disabled. Verification code for {} [{}] is {}", to, purpose, code);
            return;
        }
        if (fromAddress == null || fromAddress.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Mail sender is not configured");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Mail sender is not available");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject("火树非遗文化账号验证码");
        message.setText("""
            您正在进行%s操作。
            验证码：%s
            有效期：%d 分钟

            如非本人操作，请忽略本邮件。
            """.formatted(purposeLabel(purpose), code, Math.max(1, expiresInSeconds / 60)));
        mailSender.send(message);
    }

    private String purposeLabel(String purpose) {
        return switch (purpose) {
            case "REGISTER" -> "注册";
            case "RESET_PASSWORD" -> "重置密码";
            default -> "账号验证";
        };
    }
}
