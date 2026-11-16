package com.firetree.heritage.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.firetree.heritage.features.ai.dto.AiChatRequest;
import com.firetree.heritage.features.ai.dto.AiChatResponse;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import com.firetree.heritage.features.ai.service.AiChatService;

class AiChatServiceTest {

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void parsesOpenAiCompatibleChatResponseWithNavigationSuggestions() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/chat/completions", exchange -> {
            String request = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            assertThat(exchange.getRequestMethod()).isEqualTo("POST");
            assertThat(exchange.getRequestHeaders().getFirst("Authorization")).isEqualTo("Bearer test-key");
            assertThat(request).contains("heritage-chat", "苏绣是什么", "/graph/board");

            String response = """
                {
                  "choices": [
                    {
                      "message": {
                        "content": "{\\"answer\\":\\"苏绣是以针法、丝线和江南审美见长的传统美术。\\",\\"suggestions\\":[{\\"title\\":\\"知识图谱看板\\",\\"route\\":\\"/graph/board\\",\\"audience\\":\\"portal\\",\\"reason\\":\\"可以继续查看苏绣相关节点关系\\"}]}"
                      }
                    }
                  ]
                }
                """;
            byte[] body = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream outputStream = exchange.getResponseBody()) {
                outputStream.write(body);
            }
        });
        server.start();

        AiChatService service = new AiChatService(
            new ObjectMapper(),
            "test-key",
            "http://127.0.0.1:" + server.getAddress().getPort(),
            "heritage-chat",
            5
        );

        AiChatResponse response = service.chat(new AiChatRequest(
            "苏绣是什么",
            List.of(),
            "portal",
            "/graph/board",
            List.of("NORMAL_USER")
        ));

        assertThat(response.answer()).contains("苏绣");
        assertThat(response.source()).isEqualTo("AI_CHAT_COMPLETIONS");
        assertThat(response.suggestions()).hasSize(1);
        assertThat(response.suggestions().get(0).route()).isEqualTo("/graph/board");
        assertThat(response.suggestions().get(0).reason()).contains("节点关系");
    }

    @Test
    void fallsBackToNavigationSuggestionsWhenAiConfigurationIsMissing() {
        AiChatService service = new AiChatService(
            new ObjectMapper(),
            "",
            "",
            "",
            5
        );

        AiChatResponse response = service.chat(new AiChatRequest(
            "我要提交资料在哪里",
            List.of(),
            "portal",
            "/",
            List.of("NORMAL_USER")
        ));

        assertThat(response.source()).isEqualTo("AI_UNAVAILABLE_FALLBACK");
        assertThat(response.answer()).contains("AI 服务暂不可用");
        assertThat(response.suggestions().stream().map(item -> item.route()))
            .contains("/material-submit");
    }
}
