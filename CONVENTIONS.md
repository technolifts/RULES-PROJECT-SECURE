I'm building a document management system called DocSecure with:
- Next.js frontend (App Router) with React and TypeScript 
- Python FastAPI backend
- PostgreSQL database

Please help me implement a working system that allows:
1. User registration and login
2. Document upload, storage, and retrieval
3. Document sharing with permission controls
4. Basic document preview
5. Audit logging of user actions

Focus on getting a working implementation first. Let's follow test-driven development practices by writing tests before implementation.

# Authentication & Authorization
authentication_rules:
  - rule: "Always verify JWT tokens on protected routes"
  - rule: "Use secure HttpOnly cookies for token storage"
  - rule: "Implement proper token expiration and refresh mechanism"
  - rule: "Never store sensitive credentials in client-side code or localStorage"
  - rule: "Use bcrypt or Argon2 for password hashing with appropriate work factors"
  - rule: "Implement rate limiting on authentication endpoints"
  - rule: "Add CSRF protection for authentication flows"
  - rule: "Validate user permissions before any data access or modification"
  - rule: "Log all authentication failures and suspicious activities"

# Input Validation
input_validation_rules:
  - rule: "Validate all user inputs server-side regardless of client validation"
  - rule: "Use parameterized queries for all database operations"
  - rule: "Implement strict type checking for all API inputs"
  - rule: "Sanitize HTML/markdown content before storage and rendering"
  - rule: "Validate file types using content inspection, not just extensions"
  - rule: "Implement maximum size limits for all uploads"
  - rule: "Use allowlists for accepted file types rather than denylists"
  - rule: "Validate and sanitize URL parameters and query strings"

# Output Encoding
output_encoding_rules:
  - rule: "Use context-appropriate encoding for all dynamic data in responses"
  - rule: "Implement Content Security Policy headers"
  - rule: "Set X-Content-Type-Options: nosniff header"
  - rule: "Avoid directly inserting user data into HTML templates"
  - rule: "Use templating engines that automatically escape output"

# File Operations
file_operation_rules:
  - rule: "Store uploaded files outside of web root"
  - rule: "Generate random filenames for stored files, never use user-provided names directly"
  - rule: "Validate file content matches declared content type"
  - rule: "Scan uploaded files for malware or malicious content"
  - rule: "Implement proper file permissions on the server"
  - rule: "Use stream processing for large file operations to prevent DoS"
  - rule: "Never allow direct path traversal for file access"

# Database Security
database_rules:
  - rule: "Use ORM with parameterized queries by default"
  - rule: "Implement least privilege database users"
  - rule: "Never concatenate strings to build SQL queries"
  - rule: "Use database connection pooling with limits to prevent DoS"
  - rule: "Encrypt sensitive data at rest in the database"
  - rule: "Implement proper database backup and recovery procedures"
  - rule: "Use database migrations for schema changes"

# API Security
api_security_rules:
  - rule: "Implement proper HTTP response codes"
  - rule: "Add rate limiting on all API endpoints"
  - rule: "Use HTTPS for all communications"
  - rule: "Set appropriate CORS headers"
  - rule: "Validate all API request parameters and payloads"
  - rule: "Implement API versioning"
  - rule: "Use proper error handling that doesn't leak sensitive information"
  - rule: "Add security headers to all responses"

# Session Management
session_management_rules:
  - rule: "Generate cryptographically secure session IDs"
  - rule: "Implement session timeout and renewal"
  - rule: "Validate session origin and integrity"
  - rule: "Store session data securely server-side"
  - rule: "Properly invalidate sessions on logout"
  - rule: "Implement session rotation after privilege changes"

# Logging and Monitoring
logging_rules:
  - rule: "Log all security-relevant events"
  - rule: "Sanitize logs to prevent log injection"
  - rule: "Implement centralized log collection"
  - rule: "Never log sensitive data like passwords or full tokens"
  - rule: "Include detailed context in security logs"
  - rule: "Implement log rotation and retention policies"

# Error Handling
error_handling_rules:
  - rule: "Use generic error messages for users"
  - rule: "Log detailed errors for debugging"
  - rule: "Catch and handle all exceptions properly"
  - rule: "Never expose stack traces to end users"
  - rule: "Implement fallback mechanisms for critical functions"

# Dependency Management
dependency_rules:
  - rule: "Regularly update all dependencies"
  - rule: "Use lock files to pin dependency versions"
  - rule: "Scan dependencies for known vulnerabilities"
  - rule: "Minimize dependency usage where possible"
  - rule: "Prefer established libraries for security-critical functions"
  - rule: "Use the most recent version of dependencies"

# Infrastructure Security
infrastructure_rules:
  - rule: "Use environment variables for configuration"
  - rule: "Never hardcode secrets in source code"
  - rule: "Implement proper container security"
  - rule: "Use least privilege principles for service accounts"
  - rule: "Separate development and production environments"
  - rule: "Implement proper network security controls"

# Frontend Security
frontend_rules:
  - rule: "Implement proper state management"
  - rule: "Sanitize all rendered data"
  - rule: "Use secure form handling"
  - rule: "Implement proper client-side validation"
  - rule: "Use subresource integrity for third-party scripts"
  - rule: "Avoid client-side storage of sensitive data"
  - rule: "Follow React/Next.js security best practices"