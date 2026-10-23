package com.sa.service;

import com.sa.dto.response.ToolResponse;
import com.sa.entity.Tool;
import com.sa.exception.ResourceNotFoundException;
import com.sa.repository.ToolRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ToolService {

    private static final Logger log = LoggerFactory.getLogger(ToolService.class);
    private final ToolRepository toolRepository;

    public ToolService(ToolRepository toolRepository) {
        this.toolRepository = toolRepository;
    }

    @PostConstruct
    public void seedDefaultToolsIfEmpty() {
        if (toolRepository.count() == 0) {
            log.info("Seeding default 15 document conversion tools into database...");
            List<Tool> defaultTools = List.of(
                    Tool.builder().name("PDF to Word").slug("pdf-to-word").description("Convert PDF documents to editable Microsoft Word (DOCX) files.").sourceFormat("pdf").targetFormat("docx").enabled(true).build(),
                    Tool.builder().name("Word to PDF").slug("word-to-pdf").description("Convert Word (DOCX) documents into clean PDF files.").sourceFormat("docx").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("PDF to Text").slug("pdf-to-text").description("Extract plain text content cleanly from PDF documents.").sourceFormat("pdf").targetFormat("txt").enabled(true).build(),
                    Tool.builder().name("PDF to JPG").slug("pdf-to-jpg").description("Convert PDF pages into high-resolution JPG images.").sourceFormat("pdf").targetFormat("jpg").enabled(true).build(),
                    Tool.builder().name("JPG to PDF").slug("jpg-to-pdf").description("Convert JPG images into a formatted PDF document.").sourceFormat("jpg").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("PNG to PDF").slug("png-to-pdf").description("Convert PNG images into crisp PDF documents.").sourceFormat("png").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("PDF to PNG").slug("pdf-to-png").description("Render PDF pages into crystal clear lossless PNG images.").sourceFormat("pdf").targetFormat("png").enabled(true).build(),
                    Tool.builder().name("Merge PDF").slug("merge-pdf").description("Combine multiple PDF files into one single organized PDF.").sourceFormat("pdf").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("Split PDF").slug("split-pdf").description("Split PDF pages or extract a specific range into standalone PDFs.").sourceFormat("pdf").targetFormat("zip").enabled(true).build(),
                    Tool.builder().name("Compress PDF").slug("compress-pdf").description("Reduce PDF file size efficiently while maintaining quality.").sourceFormat("pdf").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("Rotate PDF").slug("rotate-pdf").description("Rotate PDF pages 90, 180, or 270 degrees permanently.").sourceFormat("pdf").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("Extract PDF Pages").slug("extract-pdf-pages").description("Extract selected pages from any PDF document into a new PDF.").sourceFormat("pdf").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("Delete PDF Pages").slug("delete-pdf-pages").description("Remove unwanted pages from a PDF document effortlessly.").sourceFormat("pdf").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("HTML to PDF").slug("html-to-pdf").description("Convert HTML documents or webpages into formatted PDF files.").sourceFormat("html").targetFormat("pdf").enabled(true).build(),
                    Tool.builder().name("Text to PDF").slug("text-to-pdf").description("Transform plain text files into cleanly styled PDF documents.").sourceFormat("txt").targetFormat("pdf").enabled(true).build()
            );
            toolRepository.saveAll(defaultTools);
            log.info("Successfully initialized {} tools", defaultTools.size());
        }
    }

    public List<ToolResponse> getAllTools() {
        return toolRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ToolResponse> getEnabledTools() {
        return toolRepository.findByEnabledTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ToolResponse getToolBySlug(String slug) {
        Tool tool = toolRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Tool not found with slug: " + slug));
        return mapToResponse(tool);
    }

    public Tool getToolEntityBySlug(String slug) {
        return toolRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Tool not found with slug: " + slug));
    }

    @Transactional
    public ToolResponse toggleTool(Long id, boolean enabled) {
        Tool tool = toolRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tool not found with ID: " + id));
        tool.setEnabled(enabled);
        Tool saved = toolRepository.save(tool);
        log.info("Tool [{}] enabled state updated to [{}]", tool.getName(), enabled);
        return mapToResponse(saved);
    }

    public ToolResponse mapToResponse(Tool tool) {
        return ToolResponse.builder()
                .id(tool.getId())
                .name(tool.getName())
                .slug(tool.getSlug())
                .description(tool.getDescription())
                .sourceFormat(tool.getSourceFormat())
                .targetFormat(tool.getTargetFormat())
                .enabled(tool.isEnabled())
                .build();
    }
}
