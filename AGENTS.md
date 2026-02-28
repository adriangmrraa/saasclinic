# 🤖 AGENTS.md: La Guía Suprema para el Mantenimiento del Proyecto (SAAS CRM v8.0)

Este documento es el manual de instrucciones definitivo para cualquier IA o desarrollador que necesite modificar o extender este sistema bajo el dominio de Ventas y CRM. Sigue estas reglas para evitar regresiones.

---

## 🏗️ Arquitectura de Microservicios (v7.6 Platinum)

### 📡 Core Intelligence (Orchestrator) - `orchestrator_service`
El cerebro central. Gestiona el agente LangChain, la memoria y la base de datos de leads.
- **Seguridad de Triple Capa:** JWT para identidad, `X-Admin-Token` para infraestructura, y estado `pending` para nuevos usuarios.
- **Maintenance Robot (db.py):** Sistema de auto-curación de base de datos. Los parches PL/pgSQL se ejecutan en cada arranque para asegurar el esquema CRM.
- **WebSocket / Socket.IO:** Sincronización en tiempo real de Leads y Mensajes.

> [!IMPORTANT]
> **REGLA DE SOBERANÍA (BACKEND)**: Es obligatorio incluir el filtro `tenant_id` en todas las consultas (SELECT/INSERT/UPDATE/DELETE). El aislamiento de datos es la barrera legal y técnica inviolable del sistema.

> [!IMPORTANT]
> **REGLA DE SOBERANÍA (FRONTEND)**: Implementar siempre "Aislamiento de Scroll" para garantizar que los datos densos no rompan la experiencia de usuario.

### 📱 Percepción y Transmisión (WhatsApp Service) - `whatsapp_service`
Maneja la integración con YCloud y la IA de audio (Whisper).

### 🎨 Control (Frontend React)
- **Routing:** Usa `path="/*"` en el router raíz de `App.tsx` para permitir rutas anidadas.
- **AuthContext:** Gestiona el estado de sesión y rol del usuario (`ceo`, `seller`).
- **Registro:** LoginView pide **Nombre del Negocio** y datos del administrador; POST `/auth/register` crea fila en `sellers` pendiente de aprobación.
- **Chats por Negocio:** ChatsView usa GET `/admin/chat/tenants` y GET `/admin/chat/sessions?tenant_id=`. Selector de Sólidos/Negocios para CEO; vendedores ven una sola.
- **Idioma (i18n):** `LanguageProvider` envuelve la app; idioma por defecto **español**. Traducciones en `src/locales/{es,en,fr}.json`. Al cambiar idioma en Configuración, el efecto es inmediato en toda la plataforma.
- **Configuración:** Vista real en `/configuracion` (ConfigView) con selector de idioma; solo CEO. El agente de chat es **agnóstico**: el system prompt inyecta el nombre del negocio (`tenants.business_name`) y responde en el idioma detectado del mensaje del lead.

---

## 💾 Base de Datos y Lógica de Bloqueo

### 🚦 Mecanismo de Silencio (Human Override)
- **Duración:** 24 horas. Se guarda en `human_override_until`.
- **Por negocio:** Override y ventana de 24h son por `(tenant_id, phone_number)`.

### 🧠 Cerebro Híbrido (Calendario de Ventas)
- **`tenants.config.calendar_provider`:** `'local'` o `'google'`.
- **`check_availability` / `book_event`:** Si `calendar_provider == 'google'` → usan `gcal_service`. Siempre por `tenant_id`.
- La IA usa la API Key global (env) para razonamiento; los datos de turnos están aislados por clínica.

### 🤖 Maintenance Robot (Self-Healing)
- **Protocolo Omega Prime:** Se auto-activa al primer administrador (CEO) para evitar bloqueos en despliegues nuevos.
- **Parches de Evolución:** Añaden `tenant_id` + índices en `leads`, `sellers`, `chat_messages`. Aseguran coherencia del esquema SAAS CRM.

---

## 🛠️ Herramientas (Tools) - Nombres Exactos
- **`list_sellers`**: Lista vendedores activos.
- **`list_products`**: Lista servicios o productos disponibles para vender.
- **`check_availability`**: Consulta disponibilidad real de un vendedor o agenda.
- **`book_event`**: Registra una reunión o conversión.
- **`list_my_events`**: Lista eventos del lead.
- **`convert_to_client`**: Cambia el status del lead a cliente.
- **`derivhumano`**: Derivación a humano y bloqueo de 24h.

---

## 📜 Reglas de Oro para el Código

### 1. 🐍 Python (Backend)
- **Auth Layers**: Siempre usa `Depends(get_current_user)` para rutas protegidas.
- **Exception handling**: Usa el manejador global en `main.py` para asegurar estabilidad de CORS.

### 2. 🔄 React (Frontend)
- **Wildcard Routes**: Siempre pon `/*` en rutas que contengan `Routes` hijos.
- **Axios**: Los headers `Authorization` y `X-Admin-Token` se inyectan automáticamente en `api/axios.ts`.

---

## 📈 Observabilidad
- Los links de activación se imprimen en los logs como `WARNING` (Protocolo Omega).

---

## 🔐 Integración Auth0 / Google Calendar (connect-sovereign)
- **POST `/admin/calendar/connect-sovereign`:** Recibe el token de Auth0; se guarda **cifrado con Fernet** (clave en `CREDENTIALS_FERNET_KEY`) en la tabla `credentials` con `category = 'google_calendar'`, asociado al `tenant_id` de la clínica. Tras guardar, el sistema actualiza `tenants.config.calendar_provider` a `'google'` para esa clínica.
- La clave de cifrado debe generarse una vez (en Windows: `py -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`) y definirse en el entorno.

---

## 🛠️ Available Skills Index

| Skill Name | Trigger | Descripción |
| :--- | :--- | :--- |
| **Sovereign Backend Engineer** | *v8.0, JIT, API* | v8.0: Senior Backend Architect. CRM Pro, multi-tenancy y evolución. |
| **Nexus UI Developer** | *React, Frontend* | Especialista en interfaces SAAS CRM y real-time tracking. |
| **Nexus UI Architect** | *UX, Mobile* | Definidor del estándar visual Sovereign Dark Glass. |
| **DB Schema Surgeon** | *v8.0, SQL* | Database Master. CRM Pipeline y parches idempotentes. |
| **CRM Sales Module** | *Leads, Pipeline* | Módulo core de gestión comercial y marketing. |

---
*Actualizado: 2026-02-28 - Evolución SAAS CRM v8.0 (Leads, Sellers, Pipeline, Marketing Hub, Sovereign Dark Glass)*
