# SA — Online Document Converter Architecture

## 1. System Overview

**SA** is an enterprise-grade document conversion platform designed with strict separation of concerns, high-concurrency asynchronous job workers, and bank-grade document security with automated 24-hour physical file shredding.

```text
React Web Client (sa-web)
        │
        │ REST API (JSON / Multipart)
        ▼
Spring Boot Server (sa-server)
        │
        ├── Authentication & Security (JWT + Spring Security)
        │
        ├── File Validation (Extension, MIME, Size, Path Traversal)
        │
        ├── Storage Service (UUID on-disk mapping, zero raw paths)
        │
        ├── Conversion Engine (Strategy Pattern with ConverterRegistry)
        │     ├── Apache PDFBox (Native PDF processing & rasterization)
        │     ├── Apache POI (DOCX layout parsing & construction)
        │     └── LibreOffice Headless (Isolated Office-to-PDF conversion)
        │
        ├── Asynchronous Job Dispatcher (ThreadPoolTaskExecutor)
        │
        └── Scheduled Purge Daemon (Hourly Cron File Shredder)
```

---

## 2. Layered Architecture

```text
React UI
    ↓
REST Controller (AuthController, FileController, ConversionController, ToolController, HistoryController, AdminController)
    ↓
Service Layer (AuthService, FileService, ConversionService, ToolService, HistoryService, FileCleanupService)
    ↓
Converter Engine (ConverterRegistry → Converter Implementations)
    ↓
Repository Layer (Spring Data JPA)
    ↓
MySQL / Database (Metadata only — binary files are stored on secure disk)
```

### Separation of Concerns:
- **Controllers** never contain conversion or business logic. They strictly handle HTTP transport, validation, and DTO marshalling.
- **Repositories** never contain business logic; they perform type-safe JPA database interactions with indexes.
- **Converters** encapsulate tool-specific transformation algorithms using dedicated libraries.
- **Storage** isolates all physical file manipulation, ensuring user inputs never control filesystem paths.

---

## 3. Asynchronous Conversion Lifecycle

```text
1. Client calls POST /api/files/upload
   ↳ FileValidator checks MIME, extension, size (<50MB), path traversal
   ↳ File stored at storage/uploads/{uuid}.{ext}
   ↳ FileRecord metadata saved in database

2. Client calls POST /api/conversions { toolSlug, sourceFileId, options }
   ↳ ConversionJob created with status "QUEUED"
   ↳ Async task queued into ThreadPoolTaskExecutor
   ↳ Returns 202 ACCEPTED with jobId

3. Worker Thread executes processJobAsync(jobId)
   ↳ Status updated to "PROCESSING" (progress: 20%)
   ↳ Converter resolved from ConverterRegistry by slug
   ↳ Output generated in storage/temp/
   ↳ Output validated (exists, length > 0, expected format)
   ↳ Output moved to storage/processed/{uuid}.{ext}
   ↳ Output FileRecord saved with 24-hour expiry
   ↳ Status updated to "COMPLETED" (progress: 100%)
   ↳ ConversionHistory record inserted for authenticated users

4. Client polls GET /api/conversions/{id}/status every 1000ms
   ↳ When status === 'COMPLETED', download button is enabled

5. Client downloads file via GET /api/conversions/{id}/download
   ↳ Secure stream with Content-Disposition header
   ↳ Server paths are never exposed to browser
```

---

## 4. How to Add a New Converter

Thanks to the Strategy Pattern and Spring component discovery, adding a new conversion tool requires zero modifications to existing converters:

1. **Create the Converter class** in `com.sa.converter.impl`:
   ```java
   @Component
   public class PdfToExcelConverter implements Converter {
       @Override public String getToolSlug() { return "pdf-to-excel"; }
       @Override public String getSourceFormat() { return "pdf"; }
       @Override public String getTargetFormat() { return "xlsx"; }
       @Override
       public ConversionResult convert(File input, File output, Map<String, String> options) throws Exception {
           // Conversion logic
           validateOutput(output, "xlsx");
           return ConversionResult.success(output, "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
       }
   }
   ```
2. **Register the Tool Record**:
   Insert the tool into the `tools` table or it will be registered via `ToolService`:
   ```sql
   INSERT INTO tools (name, slug, description, source_format, target_format, enabled)
   VALUES ('PDF to Excel', 'pdf-to-excel', 'Convert PDF tables into Microsoft Excel spreadsheets', 'pdf', 'xlsx', TRUE);
   ```
3. **Frontend automatically supports it**:
   Because `ToolDetailPage.jsx` is dynamic based on `:slug`, navigating to `/pdf-to-excel` immediately presents the upload zone, settings drawer, progress polling, and download button.
