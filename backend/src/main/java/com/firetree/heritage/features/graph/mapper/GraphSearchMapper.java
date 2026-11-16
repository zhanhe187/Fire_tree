package com.firetree.heritage.features.graph.mapper;

import com.firetree.heritage.features.graph.dto.GraphAiSearchRequest;
import com.firetree.heritage.features.graph.dto.GraphPathSearchRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import com.firetree.heritage.features.ai.service.AiSearchPlan;
import com.firetree.heritage.features.ai.service.AiSearchPlannerService;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class GraphSearchMapper {

    private static final Set<String> CORE_TYPE_CODES = Set.of(
        "heritage_project",
        "inheritor",
        "craft_technique",
        "craft_process",
        "craft_material",
        "craft_tool",
        "representative_work",
        "work",
        "region",
        "organization",
        "source_document",
        "unesco_element"
    );

    private static final List<List<String>> DEFAULT_RELATION_PATHS = List.of(
        List.of("has_inheritor"),
        List.of("has_inheritor", "inherited_from"),
        List.of("uses_technique"),
        List.of("masters_technique"),
        List.of("has_process"),
        List.of("uses_material"),
        List.of("uses_tool"),
        List.of("created_work"),
        List.of("representative_work_of"),
        List.of("originated_in"),
        List.of("practiced_in")
    );

    private record SearchStep(String relationType, String direction) {
    }

    private record SearchInstruction(
        List<String> startEntityNames,
        List<String> targetTypes,
        List<List<SearchStep>> stepPaths,
        String answerLabel
    ) {
    }

    private final MybatisSqlExecutor sqlExecutor;
    private final AiSearchPlannerService aiSearchPlannerService;

    public GraphSearchMapper(MybatisSqlExecutor sqlExecutor, AiSearchPlannerService aiSearchPlannerService) {
        this.sqlExecutor = sqlExecutor;
        this.aiSearchPlannerService = aiSearchPlannerService;
    }

    public Map<String, Object> unifiedSearch(String keyword, List<String> typeCodes, boolean includeRelations, int page, int size) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<String> safeTypeCodes = sanitizeTypeCodes(typeCodes);

        List<Object> params = new ArrayList<>();
        String where = buildSearchWhere(normalizedKeyword, safeTypeCodes, params);
        Integer total = sqlExecutor.queryForObject("""
            select count(*)
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id
            where %s
            """.formatted(where), Integer.class, params.toArray());

        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add((safePage - 1) * safeSize);
        pageParams.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              n.name,
              n.alias,
              n.summary,
              n.province,
              n.city,
              n.district,
              n.project_level as projectLevel,
              n.audit_status as auditStatus,
              n.visibility,
              n.popularity_count as popularityCount,
              nt.id as nodeTypeId,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              nt.color as nodeTypeColor,
              coalesce(cast(json_unquote(json_extract(nt.default_attrs, '$.searchWeight')) as unsigned), 50) as typeWeight,
              case
                when ? <> '' and n.name = ? then 1000
                when ? <> '' and (n.name like concat('%', ?, '%') or n.alias like concat('%', ?, '%')) then 800
                when ? <> '' then 400
                else 0
              end as score
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id
            where __WHERE__
            order by score desc, typeWeight desc, n.popularity_count desc, n.updated_at desc, n.id desc
            limit ?, ?
            """.replace("__WHERE__", where), prependSearchScoreParams(normalizedKeyword, pageParams));

        List<Map<String, Object>> groups = groupByType(items);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("keyword", normalizedKeyword);
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total == null ? 0 : total);
        result.put("items", items);
        result.put("groups", groups);
        if (includeRelations) {
            result.put("relationHints", relationHints(items, 8));
        }
        return result;
    }

    public Map<String, Object> relations(long nodeId, int depth, String direction, List<String> relationTypes, int limit) {
        ensureNodeExists(nodeId);
        int safeDepth = Math.min(Math.max(depth, 1), 2);
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        List<String> safeRelationTypes = sanitizeEdgeTypes(relationTypes);
        String safeDirection = normalizeDirection(direction);

        Set<Long> seenNodeIds = new LinkedHashSet<>();
        Set<Long> frontier = new LinkedHashSet<>();
        Set<Long> edgeIds = new LinkedHashSet<>();
        seenNodeIds.add(nodeId);
        frontier.add(nodeId);

        for (int level = 1; level <= safeDepth && !frontier.isEmpty() && seenNodeIds.size() < safeLimit; level++) {
            List<Map<String, Object>> edges = relationRows(frontier, safeDirection, safeRelationTypes, safeLimit);
            Set<Long> nextFrontier = new LinkedHashSet<>();
            for (Map<String, Object> edge : edges) {
                long edgeId = ((Number) edge.get("id")).longValue();
                long sourceId = ((Number) edge.get("sourceNodeId")).longValue();
                long targetId = ((Number) edge.get("targetNodeId")).longValue();
                edgeIds.add(edgeId);
                if (seenNodeIds.add(sourceId)) {
                    nextFrontier.add(sourceId);
                }
                if (seenNodeIds.add(targetId)) {
                    nextFrontier.add(targetId);
                }
                if (seenNodeIds.size() >= safeLimit) break;
            }
            frontier = nextFrontier;
        }

        List<Map<String, Object>> nodes = nodesByIds(seenNodeIds);
        List<Map<String, Object>> edges = edgesByIds(edgeIds);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("startNodeId", nodeId);
        result.put("depth", safeDepth);
        result.put("direction", safeDirection);
        result.put("nodeCount", nodes.size());
        result.put("edgeCount", edges.size());
        result.put("nodes", nodes);
        result.put("edges", edges);
        return result;
    }

    public Map<String, Object> pathSearch(GraphPathSearchRequest request) {
        if (request == null || request.startNodeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startNodeId is required");
        }
        ensureNodeExists(request.startNodeId());
        int safeLimit = Math.min(Math.max(request.limit() == null ? 50 : request.limit(), 1), 100);
        List<List<String>> safePaths = sanitizePaths(request.paths());
        List<Map<String, Object>> chains = new ArrayList<>();
        for (List<String> path : safePaths) {
            chains.addAll(chainsForPath(request.startNodeId(), path, safeLimit - chains.size()));
            if (chains.size() >= safeLimit) break;
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("startNodeId", request.startNodeId());
        result.put("total", chains.size());
        result.put("chains", chains);
        return result;
    }

    public Map<String, Object> aiSearch(GraphAiSearchRequest request) {
        String question = request == null || request.question() == null ? "" : request.question().trim();
        if (question.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "question is required");
        }
        int topK = Math.min(Math.max(request.topK() == null ? 20 : request.topK(), 1), 50);
        Map<String, Object> search = unifiedSearch(question, List.of(), true, 1, topK);
        List<Map<String, Object>> candidates = castList(search.get("items"));
        if (candidates.isEmpty()) {
            search = fallbackTokenSearch(question, topK);
            candidates = castList(search.get("items"));
        }
        List<Map<String, Object>> entities = candidates.stream().limit(3).map(item -> {
            Map<String, Object> entity = new LinkedHashMap<>();
            entity.put("id", item.get("id"));
            entity.put("text", item.get("name"));
            entity.put("typeCode", item.get("nodeTypeCode"));
            entity.put("score", item.get("score"));
            return entity;
        }).toList();

        String mode = request.mode() == null || request.mode().isBlank() ? "RELATION_EXPLORATION" : request.mode();
        AiSearchPlan aiPlan = aiSearchPlannerService.createPlan(question, entities, mode)
            .map(plan -> normalizeAiPlan(question, plan))
            .orElseGet(() -> ruleBasedPlan(question));
        List<String> targetTypes = aiPlan.targetTypes();
        List<List<String>> relationPaths = aiPlan.relationPaths();
        SearchInstruction instruction = buildInstruction(question, aiPlan, request.currentNodeId());
        targetTypes = instruction.targetTypes();
        List<String> startEntityNames = resolveStartEntityNames(question, instruction.startEntityNames(), candidates);
        List<Map<String, Object>> startNodes = resolveStartNodes(startEntityNames, candidates, question, topK);
        Map<String, Object> plan = new LinkedHashMap<>();
        plan.put("intent", aiPlan.intent());
        plan.put("entities", entities);
        plan.put("startEntityNames", startEntityNames);
        plan.put("startNodes", startNodes);
        plan.put("targetTypes", targetTypes);
        plan.put("relationPaths", relationPaths);
        plan.put("stepPaths", instruction.stepPaths());
        plan.put("answerLabel", instruction.answerLabel());
        plan.put("constraints", Map.of("auditStatus", "APPROVED", "visibility", "PUBLIC"));
        plan.put("parser", aiPlan.parser());

        Map<String, Object> execution = Map.of("total", 0, "chains", List.of());
        if (!startNodes.isEmpty() && !instruction.stepPaths().isEmpty()) {
            execution = executeInstructionFromStartNodes(startNodes, instruction.stepPaths(), topK);
        }
        List<Map<String, Object>> results = userFacingResults(castList(execution.get("chains")), targetTypes);
        String answer = userFacingAnswer(question, startEntityNames, results, instruction.answerLabel(), targetTypes);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("question", question);
        result.put("mode", mode);
        result.put("answer", answer);
        result.put("results", results);
        result.put("plan", plan);
        result.put("search", search);
        result.put("execution", execution);
        return result;
    }

    private AiSearchPlan ruleBasedPlan(String question) {
        List<String> targetTypes = inferTargetTypes(question);
        return new AiSearchPlan(
            "RELATION_EXPLORATION",
            targetTypes,
            inferRelationPaths(question, targetTypes),
            List.of(),
            inferStartEntityNames(question),
            "",
            "RULE_BASED_FALLBACK"
        );
    }

    private AiSearchPlan normalizeAiPlan(String question, AiSearchPlan plan) {
        List<String> targetTypes = sanitizeTypeCodes(plan.targetTypes()).stream()
            .filter(code -> !"heritage_project".equals(code))
            .toList();
        if (targetTypes.isEmpty()) {
            targetTypes = inferTargetTypes(question);
        }

        List<List<String>> relationPaths = plan.relationPaths() == null || plan.relationPaths().isEmpty()
            ? List.of()
            : sanitizePaths(plan.relationPaths());
        if (relationPaths.isEmpty()) {
            relationPaths = inferRelationPaths(question, targetTypes);
        }

        String intent = plan.intent() == null || plan.intent().isBlank() ? "RELATION_EXPLORATION" : plan.intent();
        List<String> startEntityNames = plan.startEntityNames() == null || plan.startEntityNames().isEmpty()
            ? inferStartEntityNames(question)
            : plan.startEntityNames().stream()
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .distinct()
                .limit(5)
                .toList();
        return new AiSearchPlan(intent, targetTypes, relationPaths, plan.stepPaths(), startEntityNames, plan.answerLabel(), plan.parser());
    }

    private SearchInstruction buildInstruction(String question, AiSearchPlan plan, Long currentNodeId) {
        String normalized = question == null ? "" : question.toLowerCase(Locale.ROOT);
        List<String> startEntityNames = new ArrayList<>(plan.startEntityNames() == null ? List.of() : plan.startEntityNames());
        if (currentNodeId != null && referencesCurrentNode(normalized)) {
            findNodeById(currentNodeId).ifPresent(node -> startEntityNames.add(0, String.valueOf(node.get("name"))));
        }

        List<String> targetTypes = new ArrayList<>(plan.targetTypes() == null ? List.of() : plan.targetTypes());
        List<List<SearchStep>> stepPaths = new ArrayList<>(toSearchStepsFromAi(plan.stepPaths()));
        String answerLabel = plan.answerLabel() == null || plan.answerLabel().isBlank()
            ? userFacingTargetLabel(question, targetTypes)
            : plan.answerLabel();

        if (containsAny(normalized, "student", "students", "\u5f92\u5f1f", "\u5f1f\u5b50", "\u4f20\u4eba")) {
            if (containsAny(normalized, "who are", "master inheritor", "his", "her", "their", "\u5f92\u5f1f", "\u5f1f\u5b50")) {
                targetTypes = List.of("inheritor");
                answerLabel = "\u5f92\u5f1f";
                addStepPath(stepPaths, List.of(new SearchStep("inherited_from", "in")));
            }
        }
        if (containsAny(normalized, "master", "teacher", "\u5e08\u7236", "\u8001\u5e08", "\u5e08\u627f")) {
            targetTypes = List.of("inheritor");
            answerLabel = "\u5e08\u7236";
            addStepPath(stepPaths, List.of(new SearchStep("has_inheritor", "out"), new SearchStep("inherited_from", "out")));
            addStepPath(stepPaths, List.of(new SearchStep("inherited_from", "out")));
        }
        if (containsAny(normalized, "who masters", "\u638c\u63e1", "\u4f1a\u54ea\u4e9b\u6280\u6cd5", "\u6280\u6cd5")) {
            if (containsAny(normalized, "who masters", "\u8c01\u638c\u63e1")) {
                targetTypes = List.of("inheritor");
                answerLabel = "\u638c\u63e1\u8005";
                addStepPath(stepPaths, List.of(new SearchStep("masters_technique", "in")));
            } else if (!targetTypes.contains("craft_technique")) {
                targetTypes = List.of("craft_technique");
                answerLabel = "\u76f8\u5173\u6280\u6cd5";
                addStepPath(stepPaths, List.of(new SearchStep("uses_technique", "out")));
                addStepPath(stepPaths, List.of(new SearchStep("has_inheritor", "out"), new SearchStep("masters_technique", "out")));
            }
        }
        if (containsAny(normalized, "which projects", "projects are in", "\u6709\u54ea\u4e9b\u9879\u76ee", "\u54ea\u4e9b\u975e\u9057")) {
            targetTypes = List.of("heritage_project");
            answerLabel = "\u76f8\u5173\u9879\u76ee";
            addStepPath(stepPaths, List.of(new SearchStep("originated_in", "in")));
            addStepPath(stepPaths, List.of(new SearchStep("practiced_in", "in")));
        }

        if (stepPaths.isEmpty()) {
            stepPaths = new ArrayList<>(toSearchSteps(plan.relationPaths()));
        }
        if (targetTypes.isEmpty()) {
            targetTypes = inferTargetTypes(question);
        }
        return new SearchInstruction(
            startEntityNames.stream().filter(name -> name != null && !name.isBlank()).distinct().limit(6).toList(),
            targetTypes.stream().distinct().toList(),
            stepPaths.stream().filter(path -> !path.isEmpty()).limit(8).toList(),
            answerLabel
        );
    }

    private List<List<SearchStep>> toSearchSteps(List<List<String>> relationPaths) {
        if (relationPaths == null || relationPaths.isEmpty()) return List.of();
        return relationPaths.stream()
            .map(path -> path.stream().map(relation -> new SearchStep(relation, "out")).toList())
            .toList();
    }

    private List<List<SearchStep>> toSearchStepsFromAi(List<List<AiSearchPlan.AiSearchStep>> stepPaths) {
        if (stepPaths == null || stepPaths.isEmpty()) return List.of();
        return stepPaths.stream()
            .map(path -> path.stream()
                .map(step -> new SearchStep(step.relationType(), "in".equals(step.direction()) ? "in" : "out"))
                .toList())
            .filter(path -> !path.isEmpty())
            .toList();
    }

    private void addStepPath(List<List<SearchStep>> paths, List<SearchStep> path) {
        if (!paths.contains(path)) {
            paths.add(path);
        }
    }

    private boolean referencesCurrentNode(String normalizedQuestion) {
        return containsAny(normalizedQuestion, "\u4ed6", "\u5979", "\u5176", "\u8fd9\u4e2a", "\u8be5\u8282\u70b9", "\u5f53\u524d", "his", "her", "their", "this");
    }

    private List<String> resolveStartEntityNames(String question, List<String> plannedNames, List<Map<String, Object>> candidates) {
        LinkedHashSet<String> names = new LinkedHashSet<>();
        if (plannedNames != null) {
            plannedNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .forEach(names::add);
        }
        inferStartEntityNames(question).forEach(names::add);
        candidates.stream()
            .map(item -> String.valueOf(item.get("name")))
            .filter(name -> name != null && !name.isBlank())
            .filter(name -> containsText(question, name) || containsText(name, question))
            .forEach(names::add);
        return names.stream().limit(8).toList();
    }

    /**
     * Start nodes come from the entity names the question actually mentions. Search candidates are
     * only a last resort — and even then a candidate must be textually related to the question.
     * Merging every candidate unconditionally is what turned one question about 苗族赶秋 into 20
     * start nodes, so the answer listed 20 inheritors of other projects under that single name.
     */
    private List<Map<String, Object>> resolveStartNodes(List<String> startEntityNames, List<Map<String, Object>> candidates, String question, int limit) {
        LinkedHashMap<Long, Map<String, Object>> nodes = new LinkedHashMap<>();
        for (String entityName : startEntityNames) {
            for (Map<String, Object> node : findStartNodesByName(entityName, limit)) {
                nodes.putIfAbsent(((Number) node.get("id")).longValue(), node);
                if (nodes.size() >= limit) return new ArrayList<>(nodes.values());
            }
        }
        if (!nodes.isEmpty()) {
            return new ArrayList<>(nodes.values());
        }
        String text = question == null ? "" : question;
        for (Map<String, Object> candidate : candidates) {
            String name = String.valueOf(candidate.get("name"));
            if (!containsText(text, name) && !containsText(name, text)) {
                continue;
            }
            nodes.putIfAbsent(((Number) candidate.get("id")).longValue(), candidate);
            if (nodes.size() >= limit) break;
        }
        return new ArrayList<>(nodes.values());
    }

    private List<Map<String, Object>> findStartNodesByName(String entityName, int limit) {
        String keyword = entityName == null ? "" : entityName.trim();
        if (keyword.isBlank()) return List.of();
        return sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              n.name,
              n.alias,
              n.summary,
              n.province,
              n.city,
              n.district,
              n.project_level as projectLevel,
              n.audit_status as auditStatus,
              n.visibility,
              n.popularity_count as popularityCount,
              nt.id as nodeTypeId,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              nt.color as nodeTypeColor,
              case
                when n.name = ? then 1000
                when n.alias = ? then 900
                when n.name like concat('%', ?, '%') then 800
                when n.alias like concat('%', ?, '%') then 700
                else 100
              end as score
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id
            where n.deleted = 0 and n.status = 1 and nt.deleted = 0 and nt.status = 1
              and nt.type_code in ('heritage_project', 'unesco_element', 'region', 'organization', 'inheritor', 'craft_technique', 'craft_process', 'craft_material', 'craft_tool', 'representative_work')
              and (
                n.name = ? or n.alias = ? or n.node_code = ? or
                n.name like concat('%', ?, '%') or n.alias like concat('%', ?, '%')
              )
            order by score desc, n.popularity_count desc, n.updated_at desc, n.id desc
            limit ?
            """,
            keyword, keyword, keyword, keyword,
            keyword, keyword, keyword, keyword, keyword,
            Math.max(1, limit)
        );
    }

    private java.util.Optional<Map<String, Object>> findNodeById(Long nodeId) {
        if (nodeId == null) return java.util.Optional.empty();
        List<Map<String, Object>> rows = sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              n.name,
              n.alias,
              n.summary,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id
            where n.id = ? and n.deleted = 0 and n.status = 1 and nt.deleted = 0 and nt.status = 1
            limit 1
            """, nodeId);
        return rows.isEmpty() ? java.util.Optional.empty() : java.util.Optional.of(rows.get(0));
    }

    private Map<String, Object> executePathsFromStartNodes(List<Map<String, Object>> startNodes, List<List<String>> relationPaths, int topK) {
        List<Map<String, Object>> chains = new ArrayList<>();
        Long firstStartNodeId = ((Number) startNodes.get(0).get("id")).longValue();
        for (Map<String, Object> startNode : startNodes) {
            Long startNodeId = ((Number) startNode.get("id")).longValue();
            Map<String, Object> execution = pathSearch(new GraphPathSearchRequest(startNodeId, relationPaths, topK - chains.size()));
            castList(execution.get("chains")).forEach(chains::add);
            if (!chains.isEmpty()) {
                firstStartNodeId = startNodeId;
            }
            if (chains.size() >= topK) break;
        }
        Map<String, Object> execution = new LinkedHashMap<>();
        execution.put("startNodeId", firstStartNodeId);
        execution.put("total", chains.size());
        execution.put("chains", chains);
        return execution;
    }

    private Map<String, Object> executeInstructionFromStartNodes(List<Map<String, Object>> startNodes, List<List<SearchStep>> stepPaths, int topK) {
        List<Map<String, Object>> chains = new ArrayList<>();
        Long firstStartNodeId = ((Number) startNodes.get(0).get("id")).longValue();
        for (Map<String, Object> startNode : startNodes) {
            Long startNodeId = ((Number) startNode.get("id")).longValue();
            for (List<SearchStep> path : stepPaths) {
                chains.addAll(chainsForSteps(startNodeId, path, topK - chains.size()));
                if (!chains.isEmpty()) {
                    firstStartNodeId = startNodeId;
                }
                if (chains.size() >= topK) break;
            }
            if (chains.size() >= topK) break;
        }
        Map<String, Object> execution = new LinkedHashMap<>();
        execution.put("startNodeId", firstStartNodeId);
        execution.put("total", chains.size());
        execution.put("chains", chains);
        return execution;
    }

    private List<Map<String, Object>> chainsForSteps(Long startNodeId, List<SearchStep> path, int limit) {
        if (limit <= 0 || path.isEmpty()) return List.of();
        List<Map<String, Object>> chains = new ArrayList<>();
        walkSteps(startNodeId, path, 0, new ArrayList<>(List.of(startNodeId)), new ArrayList<>(), chains, limit);
        return chains;
    }

    private void walkSteps(Long currentNodeId, List<SearchStep> path, int index, List<Long> nodeIds, List<Long> edgeIds, List<Map<String, Object>> chains, int limit) {
        if (chains.size() >= limit) return;
        if (index >= path.size()) {
            Map<String, Object> chain = new LinkedHashMap<>();
            chain.put("title", "AI 结果");
            chain.put("path", path.stream().map(SearchStep::relationType).toList());
            chain.put("nodes", nodesByIds(nodeIds));
            chain.put("edges", edgesByIds(edgeIds));
            chains.add(chain);
            return;
        }
        SearchStep step = path.get(index);
        String nodeColumn = "in".equals(step.direction()) ? "e.target_node_id" : "e.source_node_id";
        String nextColumn = "in".equals(step.direction()) ? "e.source_node_id" : "e.target_node_id";
        List<Map<String, Object>> nextEdges = sqlExecutor.queryForList("""
            select e.id, %s as nextNodeId
            from graph_edges e
            join graph_edge_types et on et.id = e.edge_type_id and et.type_code = ?
            join graph_nodes next_node on next_node.id = %s and next_node.deleted = 0 and next_node.status = 1
            where %s = ? and e.deleted = 0 and e.status = 1
            order by e.weight desc, e.updated_at desc
            limit 30
            """.formatted(nextColumn, nextColumn, nodeColumn), step.relationType(), currentNodeId);
        for (Map<String, Object> edge : nextEdges) {
            Long nextNodeId = ((Number) edge.get("nextNodeId")).longValue();
            if (nodeIds.contains(nextNodeId)) continue;
            List<Long> nextNodeIds = new ArrayList<>(nodeIds);
            List<Long> nextEdgeIds = new ArrayList<>(edgeIds);
            nextNodeIds.add(nextNodeId);
            nextEdgeIds.add(((Number) edge.get("id")).longValue());
            walkSteps(nextNodeId, path, index + 1, nextNodeIds, nextEdgeIds, chains, limit);
            if (chains.size() >= limit) return;
        }
    }

    private List<Map<String, Object>> userFacingResults(List<Map<String, Object>> chains, List<String> targetTypes) {
        LinkedHashMap<Long, Map<String, Object>> results = new LinkedHashMap<>();
        Set<String> preferredTypes = targetTypes == null ? Set.of() : new LinkedHashSet<>(targetTypes);
        for (Map<String, Object> chain : chains) {
            List<Map<String, Object>> nodes = castList(chain.get("nodes"));
            List<Map<String, Object>> edges = castList(chain.get("edges"));
            if (nodes.isEmpty()) continue;
            Map<String, Object> selected = nodes.get(nodes.size() - 1);
            if (!preferredTypes.isEmpty()) {
                selected = nodes.stream()
                    .filter(node -> preferredTypes.contains(String.valueOf(node.get("nodeTypeCode"))))
                    .reduce((first, second) -> second)
                    .orElse(selected);
            }
            Map<String, Object> resultNode = selected;
            Long id = ((Number) resultNode.get("id")).longValue();
            Map<String, Object> sourceNode = nodes.get(0);
            Map<String, Object> item = results.computeIfAbsent(id, ignored -> {
                Map<String, Object> next = new LinkedHashMap<>();
                next.put("id", id);
                next.put("name", resultNode.get("name"));
                next.put("nodeTypeCode", resultNode.get("nodeTypeCode"));
                next.put("nodeTypeName", resultNode.get("nodeTypeName"));
                next.put("summary", resultNode.get("summary"));
                next.put("province", resultNode.get("province"));
                next.put("city", resultNode.get("city"));
                // Which node this result was reached *from*: the answer text has to be able to say
                // whose inheritor this is, instead of attributing every hit to one subject.
                next.put("sourceNodeId", ((Number) sourceNode.get("id")).longValue());
                next.put("sourceName", sourceNode.get("name"));
                next.put("relationSummary", relationSummaryFor(edges, sourceNode));
                next.put("relations", new ArrayList<String>());
                return next;
            });
            @SuppressWarnings("unchecked")
            List<String> relations = (List<String>) item.get("relations");
            String relation = edges.stream()
                .map(edge -> String.valueOf(edge.getOrDefault("relationLabel", edge.get("edgeTypeName"))))
                .filter(label -> label != null && !label.isBlank() && !"null".equals(label))
                .collect(Collectors.joining(" -> "));
            if (!relation.isBlank() && !relations.contains(relation)) {
                relations.add(relation);
            }
        }
        return new ArrayList<>(results.values());
    }

    /**
     * Direction-aware one-liner for a result card. The raw edge label ("拥有传承人") reads backwards
     * on an inheritor card — it looks like the *person* owns an inheritor — so the common single-hop
     * relations are phrased from the result's point of view.
     */
    private String relationSummaryFor(List<Map<String, Object>> edges, Map<String, Object> sourceNode) {
        if (edges == null || edges.isEmpty() || sourceNode == null) {
            return "";
        }
        String sourceName = String.valueOf(sourceNode.get("name"));
        if (sourceName == null || sourceName.isBlank() || "null".equals(sourceName)) {
            return "";
        }
        if (edges.size() > 1) {
            return "\u7531\u300c" + sourceName + "\u300d\u7ecf " + edges.size() + " \u6b65\u5173\u7cfb\u627e\u5230";
        }
        Map<String, Object> edge = edges.get(0);
        String typeCode = String.valueOf(edge.getOrDefault("edgeTypeCode", ""));
        String label = String.valueOf(edge.getOrDefault("relationLabel", edge.getOrDefault("edgeTypeName", "")));
        return switch (typeCode) {
            case "has_inheritor" -> "\u662f\u300c" + sourceName + "\u300d\u7684\u4f20\u627f\u4eba";
            case "inherited_from" -> "\u5e08\u627f\u300c" + sourceName + "\u300d";
            case "originated_in" -> "\u300c" + sourceName + "\u300d\u53d1\u6e90\u4e8e\u6b64";
            case "listed_by" -> "\u662f\u300c" + sourceName + "\u300d\u5217\u5165\u540d\u5f55\u7684\u9879\u76ee";
            default -> label == null || label.isBlank() || "null".equals(label)
                ? "\u6765\u81ea\u300c" + sourceName + "\u300d"
                : "\u300c" + sourceName + "\u300d" + label;
        };
    }

    /**
     * An unrecognised label used to be concatenated verbatim, so a model returning the English
     * enum (`inheritors`) produced 「苗族赶秋的inheritors有：…」. A label has to be Chinese to be
     * usable in these sentences; anything else falls back to the Chinese default.
     */
    private String normalizeAnswerLabel(String question, String answerLabel, List<String> targetTypes) {
        String fallback = userFacingTargetLabel(question, targetTypes);
        if (answerLabel == null || answerLabel.isBlank()) {
            return fallback;
        }
        String trimmed = answerLabel.trim();
        return trimmed.matches(".*[\\u4e00-\\u9fa5].*") ? trimmed : fallback;
    }

    private String userFacingAnswer(String question, List<String> startEntityNames, List<Map<String, Object>> results, String answerLabel, List<String> targetTypes) {
        return composeUserFacingAnswer(
            startEntityNames,
            results,
            normalizeAnswerLabel(question, answerLabel, targetTypes)
        );
    }

    private String userFacingAnswer(String question, List<String> startEntityNames, List<Map<String, Object>> results, List<String> targetTypes) {
        return composeUserFacingAnswer(
            startEntityNames,
            results,
            userFacingTargetLabel(question, targetTypes)
        );
    }

    /**
     * Results are grouped by the node they were reached from. With one source the sentence can name
     * it; with several the hits must be reported per source — otherwise every hit gets attributed to
     * whichever entity the question happened to mention first.
     */
    private String composeUserFacingAnswer(List<String> startEntityNames, List<Map<String, Object>> results, String label) {
        LinkedHashMap<String, List<String>> bySource = new LinkedHashMap<>();
        for (Map<String, Object> item : results) {
            String sourceName = String.valueOf(item.getOrDefault("sourceName", ""));
            if (sourceName == null || sourceName.isBlank() || "null".equals(sourceName)) {
                sourceName = "";
            }
            String name = String.valueOf(item.get("name"));
            if (name == null || name.isBlank() || "null".equals(name)) {
                continue;
            }
            bySource.computeIfAbsent(sourceName, ignored -> new ArrayList<>()).add(name);
        }
        String fallbackSubject = startEntityNames == null || startEntityNames.isEmpty() ? "\u8be5\u9879\u76ee" : startEntityNames.get(0);
        if (bySource.isEmpty()) {
            return "\u6682\u672a\u5728\u56fe\u8c31\u4e2d\u627e\u5230" + fallbackSubject + "\u7684" + label + "\u3002";
        }
        if (bySource.size() == 1) {
            String subject = bySource.keySet().iterator().next();
            if (subject.isBlank()) {
                subject = fallbackSubject;
            }
            return subject + "\u7684" + label + "\u6709\uff1a" + String.join("\u3001", bySource.values().iterator().next()) + "\u3002";
        }
        List<String> segments = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : bySource.entrySet()) {
            String sourceName = entry.getKey().isBlank() ? "\u672a\u77e5\u6765\u6e90" : entry.getKey();
            segments.add(sourceName + "\uff1a" + String.join("\u3001", entry.getValue()));
        }
        return "\u627e\u5230\u7684" + label + "\u6765\u81ea " + bySource.size() + " \u4e2a\u8282\u70b9\u2014\u2014" + String.join("\uff1b", segments) + "\u3002";
    }

    private String userFacingTargetLabel(String question, List<String> targetTypes) {
        List<String> types = targetTypes == null ? List.of() : targetTypes;
        if (types.contains("inheritor")) return "\u4f20\u627f\u4eba";
        if (types.contains("craft_technique")) return "\u76f8\u5173\u6280\u6cd5";
        if (types.contains("craft_process")) return "\u5de5\u827a\u6d41\u7a0b";
        if (types.contains("craft_material")) return "\u76f8\u5173\u6750\u6599";
        if (types.contains("craft_tool")) return "\u76f8\u5173\u5de5\u5177";
        if (types.contains("representative_work")) return "\u4ee3\u8868\u4f5c\u54c1";
        if (types.contains("region")) return "\u76f8\u5173\u5730\u533a";
        return containsAny(question, "\u4f20\u627f\u4eba", "\u4f20\u4eba") ? "\u4f20\u627f\u4eba" : "\u76f8\u5173\u7ed3\u679c";
    }

    private String buildSearchWhere(String keyword, List<String> typeCodes, List<Object> params) {
        StringBuilder where = new StringBuilder("n.deleted = 0 and n.status = 1 and nt.deleted = 0 and nt.status = 1");
        if (!keyword.isBlank()) {
            where.append("""
                 and (
                  n.name like ? or n.alias like ? or n.summary like ? or n.content like ? or n.node_code like ? or
                  nt.type_name like ? or n.province like ? or n.city like ? or cast(n.extra_attrs as char) like ?
                )
                """);
            String like = "%" + keyword + "%";
            for (int i = 0; i < 9; i++) params.add(like);
        }
        if (!typeCodes.isEmpty()) {
            where.append(" and nt.type_code in (").append(placeholders(typeCodes.size())).append(")");
            params.addAll(typeCodes);
        }
        return where.toString();
    }

    private Object[] prependSearchScoreParams(String keyword, List<Object> params) {
        List<Object> all = new ArrayList<>();
        all.add(keyword);
        all.add(keyword);
        all.add(keyword);
        all.add(keyword);
        all.add(keyword);
        all.add(keyword);
        all.addAll(params);
        return all.toArray();
    }

    private List<Map<String, Object>> groupByType(List<Map<String, Object>> items) {
        Map<String, Map<String, Object>> groups = new LinkedHashMap<>();
        for (Map<String, Object> item : items) {
            String typeCode = String.valueOf(item.get("nodeTypeCode"));
            Map<String, Object> group = groups.computeIfAbsent(typeCode, ignored -> {
                Map<String, Object> next = new LinkedHashMap<>();
                next.put("typeCode", typeCode);
                next.put("typeName", item.get("nodeTypeName"));
                next.put("count", 0);
                next.put("items", new ArrayList<Map<String, Object>>());
                return next;
            });
            group.put("count", ((Number) group.get("count")).intValue() + 1);
            castList(group.get("items")).add(item);
        }
        return new ArrayList<>(groups.values());
    }

    private List<Map<String, Object>> relationHints(List<Map<String, Object>> items, int limit) {
        if (items.isEmpty()) return List.of();
        List<Long> ids = items.stream().limit(limit).map(item -> ((Number) item.get("id")).longValue()).toList();
        return sqlExecutor.queryForList("""
            select
              e.id,
              e.source_node_id as sourceNodeId,
              s.name as sourceNodeName,
              st.type_code as sourceTypeCode,
              e.target_node_id as targetNodeId,
              t.name as targetNodeName,
              tt.type_code as targetTypeCode,
              et.type_code as edgeTypeCode,
              et.type_name as edgeTypeName,
              coalesce(e.relation_label, et.type_name) as relationLabel
            from graph_edges e
            join graph_nodes s on s.id = e.source_node_id and s.deleted = 0 and s.status = 1
            join graph_nodes t on t.id = e.target_node_id and t.deleted = 0 and t.status = 1
            join graph_node_types st on st.id = s.node_type_id
            join graph_node_types tt on tt.id = t.node_type_id
            join graph_edge_types et on et.id = e.edge_type_id
            where e.deleted = 0 and e.status = 1
              and (e.source_node_id in (%s) or e.target_node_id in (%s))
            order by e.weight desc, e.updated_at desc
            limit 24
            """.formatted(placeholders(ids.size()), placeholders(ids.size())), concat(ids, ids).toArray());
    }

    private List<Map<String, Object>> relationRows(Collection<Long> frontier, String direction, List<String> relationTypes, int limit) {
        if (frontier.isEmpty()) return List.of();
        List<Object> params = new ArrayList<>();
        params.addAll(frontier);
        String nodeFilter = switch (direction) {
            case "out" -> "e.source_node_id in (" + placeholders(frontier.size()) + ")";
            case "in" -> "e.target_node_id in (" + placeholders(frontier.size()) + ")";
            default -> "(e.source_node_id in (" + placeholders(frontier.size()) + ") or e.target_node_id in (" + placeholders(frontier.size()) + "))";
        };
        if ("both".equals(direction)) {
            params.addAll(frontier);
        }
        String typeFilter = "";
        if (!relationTypes.isEmpty()) {
            typeFilter = " and et.type_code in (" + placeholders(relationTypes.size()) + ")";
            params.addAll(relationTypes);
        }
        params.add(limit);
        return sqlExecutor.queryForList("""
            select e.id, e.source_node_id as sourceNodeId, e.target_node_id as targetNodeId
            from graph_edges e
            join graph_edge_types et on et.id = e.edge_type_id
            join graph_nodes s on s.id = e.source_node_id and s.deleted = 0 and s.status = 1
            join graph_nodes t on t.id = e.target_node_id and t.deleted = 0 and t.status = 1
            where e.deleted = 0 and e.status = 1 and %s %s
            order by e.weight desc, e.updated_at desc
            limit ?
            """.formatted(nodeFilter, typeFilter), params.toArray());
    }

    private List<Map<String, Object>> nodesByIds(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return sqlExecutor.queryForList("""
            select
              n.id,
              n.node_code as nodeCode,
              n.name,
              n.summary,
              n.province,
              n.city,
              n.audit_status as auditStatus,
              nt.type_code as nodeTypeCode,
              nt.type_name as nodeTypeName,
              nt.color as nodeTypeColor
            from graph_nodes n
            join graph_node_types nt on nt.id = n.node_type_id
            where n.id in (%s) and n.deleted = 0
            order by field(n.id, %s)
            """.formatted(placeholders(ids.size()), ids.stream().map(String::valueOf).collect(Collectors.joining(", "))), ids.toArray());
    }

    private List<Map<String, Object>> edgesByIds(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return sqlExecutor.queryForList("""
            select
              e.id,
              e.source_node_id as sourceNodeId,
              s.node_code as sourceNodeCode,
              s.name as sourceNodeName,
              e.target_node_id as targetNodeId,
              t.node_code as targetNodeCode,
              t.name as targetNodeName,
              et.type_code as edgeTypeCode,
              et.type_name as edgeTypeName,
              e.directed,
              e.weight,
              e.relation_label as relationLabel,
              e.audit_status as auditStatus
            from graph_edges e
            join graph_nodes s on s.id = e.source_node_id
            join graph_nodes t on t.id = e.target_node_id
            join graph_edge_types et on et.id = e.edge_type_id
            where e.id in (%s) and e.deleted = 0
            order by field(e.id, %s)
            """.formatted(placeholders(ids.size()), ids.stream().map(String::valueOf).collect(Collectors.joining(", "))), ids.toArray());
    }

    private List<Map<String, Object>> chainsForPath(Long startNodeId, List<String> path, int limit) {
        if (limit <= 0 || path.isEmpty()) return List.of();
        List<Map<String, Object>> chains = new ArrayList<>();
        walkPath(startNodeId, path, 0, new ArrayList<>(List.of(startNodeId)), new ArrayList<>(), chains, limit);
        return chains;
    }

    private void walkPath(Long currentNodeId, List<String> path, int index, List<Long> nodeIds, List<Long> edgeIds, List<Map<String, Object>> chains, int limit) {
        if (chains.size() >= limit) return;
        if (index >= path.size()) {
            Map<String, Object> chain = new LinkedHashMap<>();
            chain.put("title", "Path: " + String.join(" -> ", path));
            chain.put("path", path);
            chain.put("nodes", nodesByIds(nodeIds));
            chain.put("edges", edgesByIds(edgeIds));
            chains.add(chain);
            return;
        }
        String edgeType = path.get(index);
        List<Map<String, Object>> nextEdges = sqlExecutor.queryForList("""
            select e.id, e.target_node_id as targetNodeId
            from graph_edges e
            join graph_edge_types et on et.id = e.edge_type_id and et.type_code = ?
            join graph_nodes t on t.id = e.target_node_id and t.deleted = 0 and t.status = 1
            where e.source_node_id = ? and e.deleted = 0 and e.status = 1
            order by e.weight desc, e.updated_at desc
            limit 20
            """, edgeType, currentNodeId);
        for (Map<String, Object> edge : nextEdges) {
            Long targetNodeId = ((Number) edge.get("targetNodeId")).longValue();
            if (nodeIds.contains(targetNodeId)) continue;
            List<Long> nextNodeIds = new ArrayList<>(nodeIds);
            List<Long> nextEdgeIds = new ArrayList<>(edgeIds);
            nextNodeIds.add(targetNodeId);
            nextEdgeIds.add(((Number) edge.get("id")).longValue());
            walkPath(targetNodeId, path, index + 1, nextNodeIds, nextEdgeIds, chains, limit);
            if (chains.size() >= limit) return;
        }
    }

    private Map<String, Object> fallbackTokenSearch(String question, int topK) {
        String[] tokens = question.split("[^\\p{IsAlphabetic}\\p{IsDigit}_\\u4e00-\\u9fa5]+");
        for (String token : tokens) {
            if (token.length() >= 3) {
                Map<String, Object> search = unifiedSearch(token, List.of(), true, 1, topK);
                if (!castList(search.get("items")).isEmpty()) {
                    return search;
                }
            }
        }
        // Every token missed: report "no candidates" instead of falling back to `unifiedSearch("")`,
        // which is the whole table ordered by popularity. Those nodes have nothing to do with the
        // question, yet resolveStartNodes used to treat them as start nodes — that is how
        // 「苗族赶秋有没有传承人」 came back with 20 inheritors of unrelated projects.
        return emptySearchResult(topK);
    }

    private Map<String, Object> emptySearchResult(int size) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("keyword", "");
        result.put("page", 1);
        result.put("size", Math.min(Math.max(size, 1), 100));
        result.put("total", 0);
        result.put("items", List.of());
        result.put("groups", List.of());
        result.put("relationHints", List.of());
        return result;
    }

    private List<String> inferTargetTypes(String question) {
        List<String> targetTypes = new ArrayList<>();
        if (containsAny(question, "\u4f20\u627f\u4eba", "\u4f20\u4eba", "\u5e08\u7236", "\u5e08\u627f", "inheritor", "master", "teacher")) targetTypes.add("inheritor");
        if (containsAny(question, "\u6280\u6cd5", "\u9488\u6cd5", "\u5531\u8154", "\u624b\u6cd5", "technique", "stitch")) targetTypes.add("craft_technique");
        if (containsAny(question, "\u5de5\u5e8f", "\u6d41\u7a0b", "\u6b65\u9aa4", "process", "step")) targetTypes.add("craft_process");
        if (containsAny(question, "\u6750\u6599", "\u539f\u6599", "\u7ee3\u7ebf", "material")) targetTypes.add("craft_material");
        if (containsAny(question, "\u5de5\u5177", "\u5668\u5177", "\u7ee3\u7ef7", "\u523b\u5200", "tool", "frame")) targetTypes.add("craft_tool");
        if (containsAny(question, "\u4f5c\u54c1", "\u5668\u7269", "\u5267\u76ee", "\u66f2\u76ee", "work")) targetTypes.add("representative_work");
        if (containsAny(question, "\u5730\u533a", "\u53d1\u6e90", "\u6d41\u5e03", "\u54ea\u91cc", "region", "place")) targetTypes.add("region");
        if (targetTypes.isEmpty()) targetTypes.addAll(List.of("inheritor", "craft_technique", "representative_work"));
        return targetTypes.stream().distinct().toList();
    }

    private List<List<String>> inferRelationPaths(String question, List<String> targetTypes) {
        List<List<String>> paths = new ArrayList<>();
        if (targetTypes.contains("inheritor")) paths.add(List.of("has_inheritor"));
        if (containsAny(question, "\u5e08\u7236", "\u5e08\u627f", "\u8001\u5e08", "master", "teacher")) paths.add(List.of("has_inheritor", "inherited_from"));
        if (targetTypes.contains("craft_technique")) {
            paths.add(List.of("uses_technique"));
            paths.add(List.of("has_inheritor", "masters_technique"));
        }
        if (targetTypes.contains("craft_process")) paths.add(List.of("has_process"));
        if (targetTypes.contains("craft_material")) paths.add(List.of("uses_material"));
        if (targetTypes.contains("craft_tool")) paths.add(List.of("uses_tool"));
        if (targetTypes.contains("representative_work")) {
            paths.add(List.of("has_inheritor", "created_work"));
        }
        if (targetTypes.contains("region")) paths.add(List.of("originated_in"));
        return paths.isEmpty() ? DEFAULT_RELATION_PATHS.subList(0, 3) : paths.stream().distinct().toList();
    }

    private List<String> inferStartEntityNames(String question) {
        String normalized = question == null ? "" : question.trim();
        if (normalized.isBlank()) return List.of();
        String withoutRelationWords = normalized
            .replaceAll("(\u6709\u6ca1\u6709|\u662f\u5426\u6709|\u6709\u65e0|\u6709\u54ea\u4e9b|\u6709\u8c01|\u8c01\u662f|\u8c01\u4f1a|\u54ea\u91cc|\u5728\u54ea|\u4ecb\u7ecd|\u67e5\u8be2|\u68c0\u7d22|\u76f8\u5173|\u7684)", " ")
            .replaceAll("(\u4f20\u627f\u4eba|\u4f20\u4eba|\u4f20\u627f\u8005|\u4ee3\u8868\u6027\u4f20\u627f\u4eba|\u6280\u6cd5|\u5de5\u827a|\u6d41\u7a0b|\u6b65\u9aa4|\u6750\u6599|\u5de5\u5177|\u4f5c\u54c1|\u5730\u533a|\u53d1\u6e90\u5730)", " ")
            .replaceAll("[?\uFF1F!\uFF01,\uFF0C\u3002\uFF1B;\uFF1A:\\s]+", " ")
            .trim();
        LinkedHashSet<String> names = new LinkedHashSet<>();
        if (!withoutRelationWords.isBlank()) {
            for (String token : withoutRelationWords.split("\\s+")) {
                if (token.length() >= 2) {
                    names.add(token);
                }
            }
        }
        if (names.isEmpty()) {
            for (String token : normalized.split("[^\\p{IsAlphabetic}\\p{IsDigit}_\\u4e00-\\u9fa5]+")) {
                if (token.length() >= 2 && !isRelationWord(token)) {
                    names.add(token);
                }
            }
        }
        return names.stream().limit(5).toList();
    }

    private boolean isRelationWord(String token) {
        return containsAny(token, "\u4f20\u627f\u4eba", "\u4f20\u4eba", "\u6280\u6cd5", "\u5de5\u827a", "\u6d41\u7a0b", "\u6b65\u9aa4", "\u6750\u6599", "\u5de5\u5177", "\u4f5c\u54c1", "\u5730\u533a", "\u53d1\u6e90\u5730", "\u6709\u6ca1\u6709", "\u6709\u54ea\u4e9b");
    }

    private boolean containsText(String container, String value) {
        if (container == null || value == null) return false;
        String normalizedContainer = container.toLowerCase(Locale.ROOT);
        String normalizedValue = value.toLowerCase(Locale.ROOT);
        return !normalizedValue.isBlank() && normalizedContainer.contains(normalizedValue);
    }

    private boolean containsAny(String text, String... tokens) {
        String normalized = text.toLowerCase(Locale.ROOT);
        return Arrays.stream(tokens).anyMatch(token -> normalized.contains(token.toLowerCase(Locale.ROOT)));
    }

    private void ensureNodeExists(long nodeId) {
        Integer count = sqlExecutor.queryForObject("select count(*) from graph_nodes where id = ? and deleted = 0 and status = 1", Integer.class, nodeId);
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Node not found");
        }
    }

    private List<String> sanitizeTypeCodes(List<String> typeCodes) {
        if (typeCodes == null) return List.of();
        return typeCodes.stream().filter(code -> code != null && CORE_TYPE_CODES.contains(code)).distinct().toList();
    }

    private List<String> sanitizeEdgeTypes(List<String> edgeTypes) {
        if (edgeTypes == null) return List.of();
        Set<String> valid = validEdgeTypes();
        return edgeTypes.stream().filter(code -> code != null && valid.contains(code)).distinct().toList();
    }

    private List<List<String>> sanitizePaths(List<List<String>> paths) {
        if (paths == null || paths.isEmpty()) return DEFAULT_RELATION_PATHS;
        Set<String> valid = validEdgeTypes();
        return paths.stream()
            .filter(path -> path != null && !path.isEmpty() && path.size() <= 3)
            .map(path -> path.stream().filter(valid::contains).toList())
            .filter(path -> !path.isEmpty())
            .limit(8)
            .toList();
    }

    private Set<String> validEdgeTypes() {
        return new LinkedHashSet<>(sqlExecutor.queryForList("select type_code from graph_edge_types where deleted = 0 and status = 1", String.class));
    }

    private String normalizeDirection(String direction) {
        if (direction == null) return "both";
        String normalized = direction.toLowerCase(Locale.ROOT);
        return List.of("in", "out", "both").contains(normalized) ? normalized : "both";
    }

    private String placeholders(int count) {
        return java.util.stream.IntStream.range(0, count).mapToObj(i -> "?").collect(Collectors.joining(", "));
    }

    private List<Object> concat(Collection<?> first, Collection<?> second) {
        List<Object> result = new ArrayList<>();
        result.addAll(first);
        result.addAll(second);
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castList(Object value) {
        return (List<Map<String, Object>>) value;
    }
}
