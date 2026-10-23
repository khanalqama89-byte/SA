package com.sa.converter;

import com.sa.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ConverterRegistry {

    private static final Logger log = LoggerFactory.getLogger(ConverterRegistry.class);
    private final Map<String, Converter> converterMap = new ConcurrentHashMap<>();

    public ConverterRegistry(List<Converter> converters) {
        for (Converter converter : converters) {
            String slug = converter.getToolSlug().toLowerCase().trim();
            converterMap.put(slug, converter);
            log.info("Registered converter for tool slug: [{}] -> {}", slug, converter.getClass().getSimpleName());
        }
    }

    public Converter getConverter(String slug) {
        if (slug == null) {
            throw new ResourceNotFoundException("Tool slug cannot be null");
        }
        Converter converter = converterMap.get(slug.toLowerCase().trim());
        if (converter == null) {
            throw new ResourceNotFoundException("No converter engine found for tool slug: " + slug);
        }
        return converter;
    }

    public boolean hasConverter(String slug) {
        return slug != null && converterMap.containsKey(slug.toLowerCase().trim());
    }

    public List<Converter> getAllConverters() {
        return new ArrayList<>(converterMap.values());
    }
}
