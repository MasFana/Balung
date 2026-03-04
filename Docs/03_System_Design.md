# System Design Document: Sistem Informasi Manajemen Logistik Gizi & SPK RSD Balung

## 1. Executive Summary
The **Sistem Informasi Manajemen Logistik Gizi & SPK (Sistem Pendukung Keputusan)** for RSD Balung is an integrated enterprise application designed to manage the hospital's nutritional logistics supply chain while providing a Decision Support System (SPK) for optimal procurement and menu planning. The system ensures accurate inventory tracking, minimizes waste, and supports data-driven decision-making for patient nutrition management.

## 2. High-Level Architecture
The system adopts a **Multi-Tiered MVC (Model-View-Controller) Architecture** enhanced with a **Service and Repository Layer** to decouple complex business logic (specifically the SPK algorithms) from the request lifecycle.

### 2.1. Architecture Layers
*   **Presentation Layer (View):** Server-rendered Blade templates enhanced with minimal JavaScript (Alpine.js/Vue.js) for reactive components (e.g., dynamic inventory grids, SPK result charts).
*   **Transport Layer (Controller):** Handles HTTP requests, input validation, and HTTP response formatting. Delegates core logic to the Service Layer.
*   **Business Logic Layer (Service):** Contains the core domain logic. 
    *   *Logistics Service:* Manages stock-in, stock-out, expiry tracking (FIFO/FEFO).
    *   *SPK Service:* Implements the Decision Support algorithms (e.g., Simple Additive Weighting or Analytical Hierarchy Process) for vendor selection and optimal ingredient procurement.
*   **Data Access Layer (Repository):** Abstracts database queries, ensuring the Service Layer is agnostic of the underlying Eloquent ORM implementation.
*   **Data Layer (Model):** Eloquent models representing database tables with strictly defined relationships.

## 3. Technology Stack
The stack is selected for high reliability, robust relational data handling, and long-term maintainability within a healthcare IT environment.

*   **Backend Framework:** Laravel (PHP 8.2+)
*   **Database:** PostgreSQL 15+ (Chosen for robust ACID compliance, JSONB support for dynamic SPK criteria, and complex analytical query performance).
*   **Frontend:** HTML5, TailwindCSS, Alpine.js / Vue.js (for SPK dashboard interactivity).
*   **Caching & Queue:** Redis (Used for caching SPK computation results, session management, and background job processing for large report generation).
*   **Web Server:** Nginx.
*   **OS:** Ubuntu Server 22.04 LTS.

## 4. Deployment Architecture (On-Premise)
Given healthcare data privacy regulations and hospital infrastructure, the system utilizes a High-Availability On-Premise Deployment strategy.

### 4.1. Infrastructure Layout
*   **Hypervisor / Virtualization:** Proxmox VE or VMware vSphere hosted on hospital data center servers.
*   **Load Balancer / Reverse Proxy (VM 1):** Nginx functioning as a reverse proxy, handling SSL termination and routing internal intranet traffic.
*   **Application Servers (VM 2 & VM 3):** Two horizontally scaled Ubuntu VMs running PHP-FPM and the Laravel application.
*   **Database Server (VM 4):** PostgreSQL database optimized for read/write performance with automated daily backups to a secure NAS.
*   **In-Memory Store (VM 5):** Redis instance for distributed session sharing between App Servers and caching SPK matrix calculations.

### 4.2. Network Security Context
*   The application sits behind the hospital's internal firewall.
*   Accessible only via the hospital's Intranet / VPN.
*   TLS 1.3 enforced for all internal transit.

## 5. CI/CD Pipeline
Continuous Integration and Continuous Deployment are implemented to ensure zero-downtime updates and automated testing of critical logistical and SPK algorithms.

### 5.1. Pipeline Stages (GitLab CI / GitHub Actions)
1.  **Commit & Push:** Developer pushes code to the repository.
2.  **Build Phase:**
    *   Install Composer and NPM dependencies.
    *   Compile frontend assets (Vite).
3.  **Test Phase:**
    *   Run PHPUnit tests (Unit tests for SPK algorithm accuracy, Feature tests for logistics endpoints).
    *   Run static analysis (PHPStan/Laravel Pint).
4.  **Artifact Generation:** Create a compressed build artifact excluding development dependencies.
5.  **Deploy Phase (Automated to Staging, Manual to Production):**
    *   Execute deployment script via SSH (`Envoy` or `Deployer`).
    *   Put application in maintenance mode (if schema changes exist).
    *   Run database migrations (`php artisan migrate --force`).
    *   Clear and rebuild application caches (`php artisan optimize`).
    *   Restart PHP-FPM queues.
    *   Bring application live.

## 6. Security & SSO Design

### 6.1. Authentication & Single Sign-On (SSO)
To streamline user access across hospital systems, the application integrates with the hospital's existing identity provider.
*   **Protocol:** OAuth2.0 / OpenID Connect or LDAP/Active Directory integration.
*   **Mechanism:** Laravel Socialite (for OAuth) or Adldap2-Laravel (for LDAP).
*   **Flow:** User attempts to log in -> Redirected to Hospital Identity Provider -> Authenticates -> Returns to Logistics System with identity token -> System maps user to local roles.

### 6.2. Authorization & RBAC
Strict Role-Based Access Control (RBAC) powered by `spatie/laravel-permission`.
*   **Roles:** 
    *   `Super_Admin`: Full system configuration.
    *   `Kepala_Instalasi_Gizi`: Access to SPK dashboards, approval of procurement, and aggregate reporting.
    *   `Petugas_Gudang`: Access to logistics, stock opname, incoming/outgoing entry.
    *   `Ahli_Gizi`: Access to menu planning and ingredient requests.
*   **Granular Policies:** Laravel Policies ensure users can only modify data within their authorized scope (e.g., a warehouse worker cannot alter SPK criteria weights).

### 6.3. Data Protection
*   **Encryption at Rest:** Sensitive parameters encrypted using Laravel's AES-256-CBC encryption.
*   **Audit Logging:** All critical actions (stock adjustments, SPK execution, role changes) are logged using an activity log package (`spatie/laravel-activitylog`) capturing User ID, IP address, timestamp, and old/new payload.
*   **Input Sanitization:** Strict request validation to prevent SQL Injection, XSS, and CSRF attacks.