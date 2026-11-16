package com.firetree.heritage.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Iterator;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import com.firetree.heritage.features.system.service.EmailDeliveryService;

class EmailDeliveryServiceTest {

    @Test
    void sendsReadableChineseVerificationEmailWhenMailIsEnabled() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        SimpleMailMessage[] sent = new SimpleMailMessage[1];
        doAnswer(invocation -> {
            sent[0] = invocation.getArgument(0, SimpleMailMessage.class);
            return null;
        }).when(mailSender).send(any(SimpleMailMessage.class));

        EmailDeliveryService service = new EmailDeliveryService(
            objectProvider(mailSender),
            true,
            "firetree@qq.com"
        );

        service.sendVerificationCode("reader@example.test", "REGISTER", "123456", 600);

        assertThat(sent[0]).isNotNull();
        assertThat(sent[0].getFrom()).isEqualTo("firetree@qq.com");
        assertThat(sent[0].getTo()).containsExactly("reader@example.test");
        assertThat(sent[0].getSubject()).isEqualTo("火树非遗文化账号验证码");
        assertThat(sent[0].getText()).contains("注册", "123456", "10 分钟");
    }

    @Test
    void skipsJavaMailWhenMailIsDisabled() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        EmailDeliveryService service = new EmailDeliveryService(
            objectProvider(mailSender),
            false,
            ""
        );

        service.sendVerificationCode("reader@example.test", "RESET_PASSWORD", "654321", 300);

        verifyNoInteractions(mailSender);
    }

    private ObjectProvider<JavaMailSender> objectProvider(JavaMailSender mailSender) {
        return new ObjectProvider<>() {
            @Override
            public JavaMailSender getObject(Object... args) {
                return mailSender;
            }

            @Override
            public JavaMailSender getIfAvailable() {
                return mailSender;
            }

            @Override
            public JavaMailSender getIfUnique() {
                return mailSender;
            }

            @Override
            public JavaMailSender getObject() {
                return mailSender;
            }

            @Override
            public Iterator<JavaMailSender> iterator() {
                return List.of(mailSender).iterator();
            }
        };
    }
}
