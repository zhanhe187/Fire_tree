package com.firetree.heritage.features.media.controller;

import com.firetree.heritage.features.media.dto.MediaFileRequest;
import com.firetree.heritage.features.media.dto.MediaLinkRequest;
import com.firetree.heritage.features.system.service.AccessControlService;
import com.firetree.heritage.features.media.service.MediaArchiveService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaArchiveService mediaArchiveService;
    private final AccessControlService accessControlService;

    public MediaController(MediaArchiveService mediaArchiveService, AccessControlService accessControlService) {
        this.mediaArchiveService = mediaArchiveService;
        this.accessControlService = accessControlService;
    }

    @GetMapping("/files")
    public Map<String, Object> files(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String fileType,
        @RequestParam(required = false) String auditStatus,
        @RequestParam(required = false) Long nodeId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return mediaArchiveService.searchFiles(keyword, fileType, auditStatus, nodeId, page, size);
    }

    @GetMapping("/files/{id}")
    public Map<String, Object> file(@PathVariable long id) {
        return mediaArchiveService.getFile(id);
    }

    @PostMapping("/files")
    public Map<String, Object> createFile(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody MediaFileRequest request
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return mediaArchiveService.createFile(request);
    }

    @PostMapping("/submissions")
    public Map<String, Object> submitImageMaterial(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam long nodeId,
        @RequestParam(required = false) String caption,
        @RequestParam("file") MultipartFile file
    ) {
        AccessControlService.AuthContext context = accessControlService.requireUser(authorization);
        return mediaArchiveService.submitImageMaterial(nodeId, caption, file, context.isSuperAdmin());
    }

    @PostMapping("/uploads/images")
    public Map<String, Object> uploadImageFile(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam("file") MultipartFile file
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return mediaArchiveService.uploadImageFile(file);
    }

    @PostMapping("/uploads")
    public Map<String, Object> uploadFile(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam("file") MultipartFile file
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return mediaArchiveService.uploadFile(file);
    }

    @PutMapping("/files/{id}")
    public Map<String, Object> updateFile(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody MediaFileRequest request
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return mediaArchiveService.updateFile(id, request);
    }

    @PostMapping("/files/{id}/content")
    public Map<String, Object> replaceFileContent(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @RequestParam("file") MultipartFile file
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return mediaArchiveService.replaceFileContent(id, file);
    }

    @DeleteMapping("/files/{id}")
    public void deleteFile(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id
    ) {
        accessControlService.requireSuperAdmin(authorization);
        mediaArchiveService.deleteFile(id);
    }

    @PostMapping("/files/{id}/links")
    public Map<String, Object> linkNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @Valid @RequestBody MediaLinkRequest request
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return mediaArchiveService.linkNode(id, request);
    }

    @DeleteMapping("/files/{id}/links/{nodeId}")
    public void unlinkNode(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @PathVariable long nodeId
    ) {
        accessControlService.requireSuperAdmin(authorization);
        mediaArchiveService.unlinkNode(id, nodeId);
    }

    /** 一键审核：通过即置为 PUBLIC + APPROVED，驳回则置为 PRIVATE + REJECTED。 */
    @PutMapping("/files/{id}/audit")
    public Map<String, Object> auditFile(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return mediaArchiveService.auditFile(id, body == null ? null : body.get("action"));
    }

    /** 只补图像说明：给节点当前封面挂接行写 caption，不新增图片。 */
    @PutMapping("/nodes/{nodeId}/cover-caption")
    public Map<String, Object> updateCoverCaption(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable long nodeId,
        @RequestBody(required = false) Map<String, String> body
    ) {
        accessControlService.requireSuperAdmin(authorization);
        return mediaArchiveService.updateCoverCaption(nodeId, body == null ? null : body.get("caption"));
    }
}
