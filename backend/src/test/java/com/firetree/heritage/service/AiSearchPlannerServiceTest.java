package com.firetree.heritage.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.firetree.heritage.features.ai.service.AiSearchPlan;
import com.firetree.heritage.features.ai.service.AiSearchPlannerService;

class AiSearchPlannerServiceTest {

    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void parsesOpenAiCompatibleChatCompletionPlan() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/chat/completions", exchange -> {
            String request = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            assertThat(exchange.getRequestMethod()).isEqualTo("POST");
            assertThat(exchange.getRequestHeaders().getFirst("Authorization")).isEqualTo("Bearer test-key");
            assertThat(request).contains("heritage-ai", "T17 Heritage Project");

            String response = """
                {
                  "choices": [
                    {
                      "message": {
                        "content": "{\\"intent\\":\\"RELATION_EXPLORATION\\",\\"targetTypes\\":[\\"inheritor\\",\\"craft_technique\\"],\\"relationPaths\\":[[\\"has_inheritor\\"],[\\"has_inheritor\\",\\"masters_technique\\"]],\\"stepPaths\\":[[{\\"relationType\\":\\"has_inheritor\\",\\"direction\\":\\"out\\"},{\\"relationType\\":\\"inherited_from\\",\\"direction\\":\\"out\\"}]],\\"startEntityNames\\":[\\"T17 Heritage Project\\"],\\"answerLabel\\":\\"master\\"}"
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

        AiSearchPlannerService service = new AiSearchPlannerService(
            new ObjectMapper(),
            "test-key",
            "http://127.0.0.1:" + server.getAddress().getPort(),
            "heritage-ai",
            5
        );

        AiSearchPlan plan = service.createPlan(
            "T17 项目的传承人和技法",
            List.of(Map.of("id", 17, "name", "T17 Heritage Project", "typeCode", "heritage_project")),
            "RELATION_EXPLORATION"
        ).orElseThrow();

        assertThat(plan.intent()).isEqualTo("RELATION_EXPLORATION");
        assertThat(plan.targetTypes()).containsExactly("inheritor", "craft_technique");
        assertThat(plan.relationPaths()).containsExactly(
            List.of("has_inheritor"),
            List.of("has_inheritor", "masters_technique")
        );
        assertThat(plan.stepPaths()).hasSize(1);
        assertThat(plan.stepPaths().get(0).get(0).relationType()).isEqualTo("has_inheritor");
        assertThat(plan.stepPaths().get(0).get(1).direction()).isEqualTo("out");
        assertThat(plan.startEntityNames()).containsExactly("T17 Heritage Project");
        assertThat(plan.answerLabel()).isEqualTo("master");
        assertThat(plan.parser()).isEqualTo("AI_CHAT_COMPLETIONS");
    }

    @Test
    void returnsEmptyWhenAiConfigurationIsMissing() {
        AiSearchPlannerService service = new AiSearchPlannerService(
            new ObjectMapper(),
            "",
            "",
            "",
            5
        );

        assertThat(service.createPlan("question", List.of(), "RELATION_EXPLORATION")).isEmpty();
    }
}
