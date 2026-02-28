---
name: "Sovereign Backend Engineer"
description: "v8.0: Senior Backend Architect & Python Expert. Lógica JIT v2, multi-tenancy y evolución idempotente."
trigger: "v8.0, backend, JIT, tenancy, idempotencia, tools"
scope: "BACKEND"
auto-invoke: true
---

# Sovereign Backend Engineer - SAAS CRM v8.0

## 1. Evolución de Datos & Idempotencia (Maintenance Robot)
**REGLA DE ORO**: Nunca proporciones o ejecutes SQL directo fuera del pipeline de migración.
- **Evolution Pipeline**: Todo cambio estructural debe implementarse como un parche en `orchestrator_service/db.py`.
- **Bloques DO $$**: Usar siempre bloques `DO $$` para garantizar que la migración sea idempotente (ej: `IF NOT EXISTS (SELECT 1 FROM information_schema.columns...)`).
- **Foundation**: Si el parche es crítico para nuevos tenants, debe replicarse en `db/init/00x_schema.sql`.

## 2. Multi-tenancy & Esquema CRM (v8.0)
Es obligatorio el aislamiento estricto de datos:
- **Tenant Isolation**: Todas las queries SQL **DEBEN** incluir el filtro `tenant_id`. El `tenant_id` debe ser manejado siempre como **entero (`int`)**.
- **The Vault**: Las claves de integración (YCloud, Meta, etc.) deben leerse de la tabla `credentials`.
- **Tablas Core**: `leads`, `clients`, `sellers`, `seller_agenda_events`, `accounting_transactions`.
- **Tipado JSONB**: Dominio de la estructura de `leads.social_links` y de `working_hours` (0-6 days) en PostgreSQL.

## 3. Sincronización JIT v2 (Google Calendar)
La lógica de sincronización híbrida debe ser robusta:
- **Mirroring en Vivo**: Consultar Google Calendar en tiempo real durante el `check_availability`.
- **Normalización**: Limpiar nombres (quitar "Dr.", "Dra.") para matching exacto con calendarios externos.
- **Deduping**: Filtrar eventos de GCal que ya existen localmente como `events` mediante el `google_calendar_event_id`.

## 4. Protocolo de Ventas de la IA (Tools)
Las herramientas del agente deben actuar como gatekeepers:
1. **check_seller_availability**: Valida primero los `working_hours` (BD) y luego GCal del vendedor.
2. **Lead-to-Client Conversion**: `convert_to_client` debe dispararse cuando el lead cumple los criterios de calificación.
3. **Calificación NLP**: Clasificación obligatoria del interés del lead antes de agendar.

## 5. Seguridad & Infraestructura (Nexus v7.6)
- **Security Layer**: Implementación obligatoria de `SecurityHeadersMiddleware` (CSP, HSTS, X-Frame-Options) en `main.py`.
- **Auth Layer**: Manejo de JWT (HS256) con **Cookies HttpOnly**. Login emite `Set-Cookie` y logout limpia la sesión.
- **Prompt Security**: Validación de mensajes entrantes mediante `core/prompt_security.py` para detectar inyecciones de prompts antes de procesar con LLM.
- **Fernet Encryption**: Uso de `core/credentials.py` para encriptación AES-256 de claves API en la tabla `credentials`.
- **RBAC**: Diferenciación estricta de roles: `ceo`, `professional`, `secretary`, `setter`, `closer`.
- **Gatekeeper Flow**: Usuarios nuevos nacen `pending`. La activación (`active`) es responsabilidad única del rol `ceo`.
- **Protocolo de Resiliencia**: Los queries a tablas de módulos (como `sellers`) deben estar protegidos con `try/except` para manejar estados de migración incompletos.

## 6. Sincronización Real-Time (WebSockets)
Garantizar que el Frontend esté siempre al día:
- **Emitir Eventos**: Emitir `NEW_LEAD` o `LEAD_UPDATED` vía Socket.IO tras cualquier mutación exitosa.

## 7. WhatsApp Service (Pipeline) v7.8
- **Transcripción**: Integración Whisper para audios.
- **Deduplicación**: Cache de 2 minutos en Redis para evitar procesar webhooks duplicados.
- **Buffering**: Agrupar mensajes en ráfaga para mejorar el contexto del LLM.
- **Protocolo HSM (v7.8)**: 
    - **Consistencia de Firma**: Todo cliente de mensajería (YCloudClient) debe mantener firmas idénticas (`tenant_id` opcional) entre servicios para evitar fallos de tipo en disparadores asíncronos.
    - **Registro Espejo**: Todo mensaje automático/saliente (HSM) debe registrarse en `chat_messages` mediante `db.append_chat_message` para garantizar visibilidad en el CRM y prevenir bucles de reintentos por falta de estado conversacional.

## 8. Hardening v7.7.1 (Rate Limiting & Auditoría Multi-tenant)
- **Rate Limiting (slowapi)**: 
    - `/auth/login`: 5/min.
    - `/auth/register`: 3/min.
    - Endpoints de listado (`leads`, `clients`, `patients`): 100/min.
- **Auditoría Multi-tenant (Parche 35)**: La tabla `system_events` DEBE incluir `tenant_id` para garantizar el aislamiento de logs.
- **Decorador `@audit_access`**: Uso obligatorio en rutas administrativas y de acceso a datos sensibles (PII) para trazabilidad en `system_events`.
- **Security Logging**: Todo fallo crítico o acceso a PII debe registrarse mediante `log_security_event` (asegurando pasar el `tenant_id`). Los logs se consultan en `/admin/core/audit/logs`.

---
*Nexus v8.0 - Senior Backend Architect & Python Expert Protocol*
