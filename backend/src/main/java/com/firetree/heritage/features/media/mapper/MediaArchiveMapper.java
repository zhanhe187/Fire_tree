package com.firetree.heritage.features.media.mapper;

import com.firetree.heritage.features.media.dto.MediaFileRequest;
import com.firetree.heritage.features.media.dto.MediaLinkRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import com.firetree.heritage.features.system.mapper.MybatisSqlExecutor;

@Component
public class MediaArchiveMapper {

    private static final List<String> VALID_FILE_TYPES = List.of("IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "OTHER");
    private static final List<String> VALID_VISIBILITY = List.of("PUBLIC", "PRIVATE");
    private static final List<String> VALID_AUDIT_STATUS = List.of("PENDING", "APPROVED", "REJECTED");

    private final MybatisSqlExecutor sqlExecutor;
    private final Path uploadRoot;

    public MediaArchiveMapper(
        MybatisSqlExecutor sqlExecutor,
        @Value("${heritage.media.upload-dir:uploads/media}") String uploadDir
    ) {
        this.sqlExecutor = sqlExecutor;
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public Map<String, Object> searchFiles(String keyword, String fileType, String auditStatus, Long nodeId, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        List<Object> params = new ArrayList<>();
        String where = buildWhere(keyword, fileType, auditStatus, nodeId, params);

        Integer total = sqlExecutor.queryForObject("""
            select count(distinct f.id)
            from media_files f
            left join graph_node_media nm on nm.file_id = f.id
            left join graph_nodes n on n.id = nm.node_id
            where %s
            """.formatted(where), Integer.class, params.toArray());

        params.add((safePage - 1) * safeSize);
        params.add(safeSize);
        List<Map<String, Object>> items = sqlExecutor.queryForList("""
            select
              f.id,
              f.bucket_name as bucketName,
              f.object_key as objectKey,
              f.original_name as originalName,
              f.file_type as fileType,
              f.content_type as contentType,
              f.file_size as fileSize,
              f.preview_url as previewUrl,
              f.visibility,
              f.audit_status as auditStatus,
              f.created_at as createdAt,
              f.updated_at as updatedAt,
              count(nm.id) as linkedNodeCount,
              group_concat(distinct n.name order by n.name separator ', ') as linkedNodeNames,
              group_concat(distinct nm.caption order by nm.sort_order separator ', ') as captions
            from media_files f
            left join graph_node_media nm on nm.file_id = f.id
            left join graph_nodes n on n.id = nm.node_id and n.deleted = 0
            where %s
            group by f.id
            order by f.updated_at desc, f.id desc
            limit ?, ?
            """.formatted(where), params.toArray());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("total", total);
        result.put("items", items);
        return result;
    }

    public Map<String, Object> getFile(long id) {
        Map<String, Object> file;
        try {
            file = new LinkedHashMap<>(sqlExecutor.queryForMap("""
                select
                  id,
                  bucket_name as bucketName,
                  object_key as objectKey,
                  original_name as originalName,
                  file_type as fileType,
                  content_type as contentType,
                  file_size as fileSize,
                  checksum,
                  preview_url as previewUrl,
                  visibility,
                  audit_status as auditStatus,
                  created_at as createdAt,
                  updated_at as updatedAt
                from media_files
                where id = ? and deleted = 0
                """, id));
        } catch (EmptyResultDataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media file not found");
        }

        file.put("linkedNodes", linkedNodes(id));
        return file;
    }

    @Transactional
    public Map<String, Object> createFile(MediaFileRequest request) {
        requireText(request.originalName(), "originalName is required");
        String fileType = normalizeFileType(request.fileType());
        String visibility = normalizeVisibility(request.visibility());
        String auditStatus = normalizeAuditStatus(request.auditStatus());
        long fileSize = request.fileSize() == null ? 0L : request.fileSize();
        String bucketName = request.bucketName() == null || request.bucketName().isBlank()
            ? "local-archive"
            : request.bucketName().trim();
        String objectKey = request.objectKey() == null || request.objectKey().isBlank()
            ? generatedArchiveKey(request.originalName(), request.contentType())
            : request.objectKey().trim();

        long id;
        try {
            id = sqlExecutor.insertAndReturnKey("""
                insert into media_files (
                  bucket_name, object_key, original_name, file_type, content_type,
                  file_size, checksum, preview_url, visibility, audit_status
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                bucketName,
                objectKey,
                request.originalName(),
                fileType,
                blankToNull(request.contentType()),
                fileSize,
                blankToNull(request.checksum()),
                blankToNull(request.previewUrl()),
                visibility,
                auditStatus
            );
        } catch (DataIntegrityViolationException exception) {
            // Purge ghost soft-deleted row that may still occupy the unique key, then retry once
            sqlExecutor.update("delete from media_files where bucket_name = ? and object_key = ? and deleted = 1", bucketName, objectKey);
            try {
                id = sqlExecutor.insertAndReturnKey("""
                    insert into media_files (
                      bucket_name, object_key, original_name, file_type, content_type,
                      file_size, checksum, preview_url, visibility, audit_status
                    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    bucketName,
                    objectKey,
                    request.originalName(),
                    fileType,
                    blankToNull(request.contentType()),
                    fileSize,
                    blankToNull(request.checksum()),
                    blankToNull(request.previewUrl()),
                    visibility,
                    auditStatus
                );
            } catch (DataIntegrityViolationException retryException) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Media object already exists");
            }
        }

        return getFile(id);
    }

    @Transactional
    public Map<String, Object> submitImageMaterial(long nodeId, String caption, MultipartFile file, boolean directApprove) {
        ensureNodeExists(nodeId);
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "image file is required");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "only image upload is supported");
        }

        String originalName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
            ? "material-image"
            : Path.of(file.getOriginalFilename()).getFileName().toString();
        String extension = extensionFrom(originalName, contentType);
        LocalDate today = LocalDate.now();
        String relativeKey = "submissions/%d/%04d/%02d/%s%s".formatted(
            nodeId,
            today.getYear(),
            today.getMonthValue(),
            UUID.randomUUID(),
            extension
        );
        Path target = uploadRoot.resolve(relativeKey).normalize();
        if (!target.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid upload path");
        }

        try {
            Files.createDirectories(target.getParent());
            try (InputStream stream = file.getInputStream()) {
                Files.copy(stream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "image file save failed");
        }

        String auditStatus = directApprove ? "APPROVED" : "PENDING";
        String visibility = directApprove ? "PUBLIC" : "PRIVATE";
        MediaFileRequest request = new MediaFileRequest(
            "local-submission",
            relativeKey,
            originalName,
            "IMAGE",
            contentType,
            file.getSize(),
            checksum(target),
            "/uploads/media/" + relativeKey.replace('\\', '/'),
            visibility,
            auditStatus
        );
        Map<String, Object> media = createFile(request);
        Number fileId = (Number) media.get("id");
        // 封面取 order by sort_order, id 的第一条；固定写 0 会让新图永远输给历史 -100 封面。
        linkNode(fileId.longValue(), new MediaLinkRequest(nodeId, caption, nextCoverSortOrder(nodeId)));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("media", getFile(fileId.longValue()));
        result.put("directApproved", directApprove);
        result.put("auditStatus", auditStatus);
        result.put("visibility", visibility);
        return result;
    }

    @Transactional
    public Map<String, Object> uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "media file is required");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();

        String originalName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
            ? "media-file"
            : Path.of(file.getOriginalFilename()).getFileName().toString();
        String extension = extensionFrom(originalName, contentType);
        LocalDate today = LocalDate.now();
        String relativeKey = "uploads/%04d/%02d/%s%s".formatted(
            today.getYear(),
            today.getMonthValue(),
            UUID.randomUUID(),
            extension
        );
        Path target = uploadRoot.resolve(relativeKey).normalize();
        if (!target.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid upload path");
        }

        try {
            Files.createDirectories(target.getParent());
            try (InputStream stream = file.getInputStream()) {
                Files.copy(stream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "image file save failed");
        }

        MediaFileRequest request = new MediaFileRequest(
            "local-upload",
            relativeKey,
            originalName,
            fileTypeFrom(contentType, originalName),
            contentType,
            file.getSize(),
            checksum(target),
            "/uploads/media/" + relativeKey.replace('\\', '/'),
            "PUBLIC",
            "APPROVED"
        );
        return createFile(request);
    }

    @Transactional
    public Map<String, Object> uploadImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "image file is required");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "only image upload is supported");
        }
        return uploadFile(file);
    }

    @Transactional
    public Map<String, Object> updateFile(long id, MediaFileRequest request) {
        ensureFileExists(id);
        String fileType = request.fileType() == null || request.fileType().isBlank() ? null : normalizeFileType(request.fileType());
        String visibility = request.visibility() == null || request.visibility().isBlank() ? null : normalizeVisibility(request.visibility());
        String auditStatus = request.auditStatus() == null || request.auditStatus().isBlank() ? null : normalizeAuditStatus(request.auditStatus());

        try {
            sqlExecutor.update("""
                update media_files
                set
                  bucket_name = coalesce(?, bucket_name),
                  object_key = coalesce(?, object_key),
                  original_name = coalesce(?, original_name),
                  file_type = coalesce(?, file_type),
                  content_type = ?,
                  file_size = coalesce(?, file_size),
                  checksum = ?,
                  preview_url = ?,
                  visibility = coalesce(?, visibility),
                  audit_status = coalesce(?, audit_status)
                where id = ? and deleted = 0
                """,
                blankToNull(request.bucketName()),
                blankToNull(request.objectKey()),
                blankToNull(request.originalName()),
                fileType,
                request.contentType(),
                request.fileSize(),
                request.checksum(),
                request.previewUrl(),
                visibility,
                auditStatus,
                id
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Media object already exists");
        }

        return getFile(id);
    }

    @Transactional
    public void deleteFile(long id) {
        ensureFileExists(id);
        // Physical delete to prevent ghost rows from blocking unique-key re-creation
        sqlExecutor.update("delete from media_files where id = ?", id);
    }

    /**
     * Replace the binary content of an existing media record in place: writes the new file to a
     * fresh object key, updates the original record's storage metadata (object key, checksum,
     * preview url, size, content type), and keeps the record id / node links intact. No new row
     * is created, so it never collides with the (bucket_name, object_key) unique constraint.
     */
    @Transactional
    public Map<String, Object> replaceFileContent(long id, MultipartFile file) {
        ensureFileExists(id);
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "media file is required");
        }
        Map<String, Object> existing = getFile(id);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String originalName = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
            ? String.valueOf(existing.getOrDefault("originalName", "media-file"))
            : Path.of(file.getOriginalFilename()).getFileName().toString();
        String extension = extensionFrom(originalName, contentType);
        LocalDate today = LocalDate.now();
        String relativeKey = "uploads/%04d/%02d/%s%s".formatted(
            today.getYear(),
            today.getMonthValue(),
            UUID.randomUUID(),
            extension
        );
        Path target = uploadRoot.resolve(relativeKey).normalize();
        if (!target.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid upload path");
        }
        try {
            Files.createDirectories(target.getParent());
            try (InputStream stream = file.getInputStream()) {
                Files.copy(stream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "media file save failed");
        }
        sqlExecutor.update("""
            update media_files
            set object_key = ?,
                original_name = ?,
                file_type = ?,
                content_type = ?,
                file_size = ?,
                checksum = ?,
                preview_url = ?
            where id = ? and deleted = 0
            """,
            relativeKey,
            originalName,
            fileTypeFrom(contentType, originalName),
            contentType,
            file.getSize(),
            checksum(target),
            "/uploads/media/" + relativeKey.replace('\\', '/'),
            id
        );
        return getFile(id);
    }

    @Transactional
    public Map<String, Object> linkNode(long fileId, MediaLinkRequest request) {
        ensureFileExists(fileId);
        if (request.nodeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeId is required");
        }
        ensureNodeExists(request.nodeId());

        try {
            sqlExecutor.update("""
                insert into graph_node_media (node_id, file_id, caption, sort_order)
                values (?, ?, ?, ?)
                """,
                request.nodeId(),
                fileId,
                blankToNull(request.caption()),
                request.sortOrder() == null ? 0 : request.sortOrder()
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Media file is already linked to this node");
        }

        return sqlExecutor.queryForMap("""
            select
              nm.id,
              nm.node_id as nodeId,
              nm.file_id as fileId,
              nm.caption,
              nm.sort_order as sortOrder,
              n.node_code as nodeCode,
              n.name as nodeName
            from graph_node_media nm
            join graph_nodes n on n.id = nm.node_id
            where nm.node_id = ? and nm.file_id = ?
            """, request.nodeId(), fileId);
    }

    @Transactional
    public void unlinkNode(long fileId, long nodeId) {
        ensureFileExists(fileId);
        sqlExecutor.update("delete from graph_node_media where file_id = ? and node_id = ?", fileId, nodeId);
    }

    /**
     * 审核一张待审图片。通过时同时把可见性改为 PUBLIC —— 公开封面与详情图库都要求
     * visibility='PUBLIC' AND audit_status='APPROVED'，只改审核状态会让图片永久不可见。
     */
    @Transactional
    public Map<String, Object> auditFile(long id, String action) {
        ensureFileExists(id);
        String normalized = normalizeAuditAction(action);
        boolean approve = "APPROVE".equals(normalized);
        sqlExecutor.update(
            "update media_files set visibility = ?, audit_status = ? where id = ? and deleted = 0",
            approve ? "PUBLIC" : "PRIVATE",
            approve ? "APPROVED" : "REJECTED",
            id
        );
        if (approve) {
            promoteToCover(id);
        }
        Map<String, Object> result = new LinkedHashMap<>(getFile(id));
        result.put("action", normalized);
        return result;
    }

    /**
     * 只补图像说明：给当前"封面那一行"写 caption，不新增图片。
     * 多表 UPDATE 不支持 ORDER BY/LIMIT，因此先用派生表选出封面挂接行。
     */
    @Transactional
    public Map<String, Object> updateCoverCaption(long nodeId, String caption) {
        ensureNodeExists(nodeId);
        int affected = sqlExecutor.update("""
            update graph_node_media
            set caption = ?
            where id = (
              select picked.id from (
                select nm2.id
                from graph_node_media nm2
                join media_files f2 on f2.id = nm2.file_id
                where nm2.node_id = ?
                  and f2.deleted = 0
                  and f2.file_type = 'IMAGE'
                  and f2.visibility = 'PUBLIC'
                  and f2.audit_status = 'APPROVED'
                  and f2.preview_url is not null
                order by nm2.sort_order, nm2.id
                limit 1
              ) picked
            )
            """,
            blankToNull(caption),
            nodeId
        );
        if (affected == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Node cover image not found");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("nodeId", nodeId);
        result.put("caption", caption == null ? "" : caption.trim());
        return result;
    }

    /** 新挂接行取「当前最小 sort_order - 1」，保证新图排在既有图片之前。 */
    private int nextCoverSortOrder(long nodeId) {
        Integer linkCount = sqlExecutor.queryForObject(
            "select count(*) from graph_node_media where node_id = ?",
            Integer.class,
            nodeId
        );
        if (linkCount == null || linkCount == 0) {
            return 0;
        }
        Integer currentMin = sqlExecutor.queryForObject(
            "select min(sort_order) from graph_node_media where node_id = ?",
            Integer.class,
            nodeId
        );
        return (currentMin == null ? 0 : currentMin) - 1;
    }

    /** 审核通过即视为最新可用封面：把它在该节点下的挂接顺序提到最前。 */
    private void promoteToCover(long fileId) {
        List<Long> nodeIds = sqlExecutor.queryForList(
            "select node_id from graph_node_media where file_id = ?",
            Long.class,
            fileId
        );
        for (Long nodeId : nodeIds) {
            if (nodeId == null) {
                continue;
            }
            Integer current = sqlExecutor.queryForObject(
                "select sort_order from graph_node_media where node_id = ? and file_id = ?",
                Integer.class,
                nodeId,
                fileId
            );
            if (current == null) {
                continue;
            }
            Integer otherCount = sqlExecutor.queryForObject(
                "select count(*) from graph_node_media where node_id = ? and file_id <> ?",
                Integer.class,
                nodeId,
                fileId
            );
            if (otherCount == null || otherCount == 0) {
                // 该节点只有这一张图，本来就是封面
                continue;
            }
            Integer minimumOfOthers = sqlExecutor.queryForObject(
                "select min(sort_order) from graph_node_media where node_id = ? and file_id <> ?",
                Integer.class,
                nodeId,
                fileId
            );
            int target = (minimumOfOthers == null ? 0 : minimumOfOthers) - 1;
            if (current <= target) {
                continue;
            }
            sqlExecutor.update(
                "update graph_node_media set sort_order = ? where node_id = ? and file_id = ?",
                target,
                nodeId,
                fileId
            );
        }
    }

    private String normalizeAuditAction(String action) {
        if (action == null || action.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "audit action is required");
        }
        String normalized = action.trim().toUpperCase(Locale.ROOT);
        if (!List.of("APPROVE", "REJECT").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "audit action is invalid");
        }
        return normalized;
    }

    private List<Map<String, Object>> linkedNodes(long fileId) {
        return sqlExecutor.queryForList("""
            select
              nm.id as linkId,
              nm.node_id as nodeId,
              n.node_code as nodeCode,
              n.name as nodeName,
              t.type_code as nodeTypeCode,
              t.type_name as nodeTypeName,
              nm.caption,
              nm.sort_order as sortOrder
            from graph_node_media nm
            join graph_nodes n on n.id = nm.node_id and n.deleted = 0
            join graph_node_types t on t.id = n.node_type_id
            where nm.file_id = ?
            order by nm.sort_order, nm.id
            """, fileId);
    }

    private String buildWhere(String keyword, String fileType, String auditStatus, Long nodeId, List<Object> params) {
        StringBuilder where = new StringBuilder("f.deleted = 0");
        if (keyword != null && !keyword.isBlank()) {
            where.append(" and (f.original_name like ? or f.object_key like ? or f.content_type like ? or n.name like ?)");
            String like = "%" + keyword.trim() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
            params.add(like);
        }
        if (fileType != null && !fileType.isBlank()) {
            where.append(" and f.file_type = ?");
            params.add(normalizeFileType(fileType));
        }
        if (auditStatus != null && !auditStatus.isBlank()) {
            where.append(" and f.audit_status = ?");
            params.add(normalizeAuditStatus(auditStatus));
        }
        if (nodeId != null) {
            where.append(" and nm.node_id = ?");
            params.add(nodeId);
        }
        return where.toString();
    }

    private void ensureFileExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from media_files where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Media file not found");
        }
    }

    private void ensureNodeExists(long id) {
        Integer count = sqlExecutor.queryForObject(
            "select count(*) from graph_nodes where id = ? and deleted = 0",
            Integer.class,
            id
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeId is invalid");
        }
    }

    private String normalizeFileType(String value) {
        String normalized = value == null || value.isBlank() ? "OTHER" : value.trim().toUpperCase();
        if (!VALID_FILE_TYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fileType is invalid");
        }
        return normalized;
    }

    private String normalizeVisibility(String value) {
        String normalized = value == null || value.isBlank() ? "PUBLIC" : value.trim().toUpperCase();
        if (!VALID_VISIBILITY.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "visibility is invalid");
        }
        return normalized;
    }

    private String normalizeAuditStatus(String value) {
        String normalized = value == null || value.isBlank() ? "PENDING" : value.trim().toUpperCase();
        if (!VALID_AUDIT_STATUS.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "auditStatus is invalid");
        }
        return normalized;
    }

    private String extensionFrom(String originalName, String contentType) {
        String lowerName = originalName.toLowerCase();
        int dotIndex = lowerName.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < lowerName.length() - 1) {
            String extension = lowerName.substring(dotIndex);
            if (List.of(".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".mp3", ".wav", ".pdf", ".doc", ".docx").contains(extension)) {
                return extension;
            }
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "video/mp4" -> ".mp4";
            case "audio/mpeg" -> ".mp3";
            case "audio/wav" -> ".wav";
            case "application/pdf" -> ".pdf";
            default -> ".jpg";
        };
    }

    private String fileTypeFrom(String contentType, String originalName) {
        if (contentType.startsWith("image/")) return "IMAGE";
        if (contentType.startsWith("video/")) return "VIDEO";
        if (contentType.startsWith("audio/")) return "AUDIO";
        if (contentType.startsWith("text/") || contentType.contains("pdf") || contentType.contains("document")) return "DOCUMENT";
        String lowerName = originalName.toLowerCase();
        if (lowerName.endsWith(".pdf") || lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) return "DOCUMENT";
        return "OTHER";
    }

    private String generatedArchiveKey(String originalName, String contentType) {
        LocalDate today = LocalDate.now();
        return "archive/%04d/%02d/%s%s".formatted(
            today.getYear(),
            today.getMonthValue(),
            UUID.randomUUID(),
            extensionFrom(originalName, contentType == null ? "" : contentType.toLowerCase())
        );
    }

    private String checksum(Path file) {
        try (InputStream stream = Files.newInputStream(file)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = stream.read(buffer)) >= 0) {
                if (read > 0) {
                    digest.update(buffer, 0, read);
                }
            }
            return HexFormat.of().formatHex(digest.digest());
        } catch (IOException | NoSuchAlgorithmException exception) {
            return null;
        }
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
