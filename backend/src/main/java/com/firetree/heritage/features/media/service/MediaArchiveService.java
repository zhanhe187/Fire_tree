package com.firetree.heritage.features.media.service;

import com.firetree.heritage.features.media.dto.MediaFileRequest;
import com.firetree.heritage.features.media.dto.MediaLinkRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
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
import java.util.Map;
import java.util.UUID;
import com.firetree.heritage.features.media.mapper.MediaArchiveMapper;
import org.springframework.stereotype.Service;

@Service
public class MediaArchiveService {

    private final MediaArchiveMapper mapper;

    public MediaArchiveService(MediaArchiveMapper mapper) {
        this.mapper = mapper;
    }

    public Map<String, Object> searchFiles(String keyword, String fileType, String auditStatus, Long nodeId, int page, int size) {
        return mapper.searchFiles(keyword, fileType, auditStatus, nodeId, page, size);
    }

    public Map<String, Object> getFile(long id) {
        return mapper.getFile(id);
    }

    public Map<String, Object> createFile(MediaFileRequest request) {
        return mapper.createFile(request);
    }

    public Map<String, Object> submitImageMaterial(long nodeId, String caption, MultipartFile file, boolean directApprove) {
        return mapper.submitImageMaterial(nodeId, caption, file, directApprove);
    }

    public Map<String, Object> uploadImageFile(MultipartFile file) {
        return mapper.uploadImageFile(file);
    }

    public Map<String, Object> uploadFile(MultipartFile file) {
        return mapper.uploadFile(file);
    }

    public Map<String, Object> updateFile(long id, MediaFileRequest request) {
        return mapper.updateFile(id, request);
    }

    public Map<String, Object> replaceFileContent(long id, MultipartFile file) {
        return mapper.replaceFileContent(id, file);
    }

    public void deleteFile(long id) {
        mapper.deleteFile(id);
    }

    public Map<String, Object> linkNode(long fileId, MediaLinkRequest request) {
        return mapper.linkNode(fileId, request);
    }

    public void unlinkNode(long fileId, long nodeId) {
        mapper.unlinkNode(fileId, nodeId);
    }

    public Map<String, Object> auditFile(long id, String action) {
        return mapper.auditFile(id, action);
    }

    public Map<String, Object> updateCoverCaption(long nodeId, String caption) {
        return mapper.updateCoverCaption(nodeId, caption);
    }
}
