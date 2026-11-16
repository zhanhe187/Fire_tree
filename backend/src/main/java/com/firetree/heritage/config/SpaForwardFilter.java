package com.firetree.heritage.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * 单页应用（history 模式）回退。
 *
 * <p>后端把 frontend/dist 作为静态资源托管时，只有根路径 / 会返回 index.html，
 * 直接访问或刷新 /explore、/favorites/study/41001、/admin/graph/nodes 这类前端路由
 * 会得到 404。本过滤器把「浏览器导航且不带扩展名的 GET 请求」转发到 index.html，
 * 交给前端路由处理；后端路径（/api、/actuator、/uploads 等）与静态资源一律放行。
 */
@Component
@Order(1)
public class SpaForwardFilter extends OncePerRequestFilter {

    private static final Set<String> BACKEND_PREFIXES = Set.of("/api", "/actuator", "/uploads", "/h2-console");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (shouldForward(request)) {
            request.getRequestDispatcher("/index.html").forward(request, response);
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean shouldForward(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String path = request.getRequestURI();
        if (path == null || path.isEmpty() || "/".equals(path)) {
            return false;
        }
        String accept = request.getHeader("Accept");
        if (accept == null || !accept.contains("text/html")) {
            return false;
        }
        int lastSlash = path.lastIndexOf('/');
        if (path.lastIndexOf('.') > lastSlash) {
            return false;
        }
        for (String prefix : BACKEND_PREFIXES) {
            if (path.startsWith(prefix)) {
                return false;
            }
        }
        return true;
    }
}
