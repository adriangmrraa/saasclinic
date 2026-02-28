# FASE 1: Evolución de Datos SAAS - Especificación Técnica

## 📢 Estado de Implementación (Feb 2026)

| Componente | Estado | Acción Realizada |
| :--- | :--- | :--- |
| **Esquema DB (CRM)** | ✅ 100% | Tablas de Leads, Clientes y Pipeline creadas. |
| **Modelos SQLALchemy** | ✅ 100% | `models_crm.py` implementado. |
| **Integración Tools** | ✅ 90% | Tools de Calificación, Asignación y Agenda funcionales. |
| **System Prompt** | ✅ 100% | Persona "Asistente de Ventas SAAS" activa. |

--- 

## 📋 Resumen Ejecutivo

Se han estructurado **tablas PostgreSQL** que transforman el núcleo de la plataforma en un CRM Agente-Céntrico, manteniendo la infraestructura multi-tenant de Nexus intacta.

| Tabla | Propósito | Relaciones Clave |
|-------|-----------|------------------|
| `leads` | Almacenar prospectos con scoring de calificación | tenant_id (multi-tenant) |
| `professionals` | Vendedores/Closers disponibles con horarios | tenant_id (multi-tenant), working_hours (JSONB) |
| `seller_agenda_events`| Reuniones de ventas (demos/llamadas) | lead_id, seller_id, tenant_id |
| `ai_actions` | Historial de acciones ejecutadas por la IA | lead_id, tenant_id |
| `lead_statuses` | Configuración de las columnas del Pipeline | tenant_id |

---

## 🗂️ Estructura Jerárquica

```
Tenant (Empresa SAAS)
├── Seller (Closer / SDR)
│   ├── Meeting (2025-02-15 09:00 - Demo Producto)
│   │   └── Lead (Juan Pérez - TechCorp)
│   │       ├── Interaction Record (WhatsApp)
│   │       │   ├── Qualification Score (85/100)
│   │       │   ├── Interest Data (JSONB)
│   │       │   └── Needs Analysis (JSONB)
│   │       └── Business Profile (JSONB)
│   └── Team Lead
│
└── Sales Pipeline
    ├── New Leads
    ├── Qualified
    └── Demo Scheduled
```

---

## 🔑 Diseño de Claves

### `leads` Table
```sql
PRIMARY KEY: id (UUID/SERIAL)
UNIQUE: (tenant_id, phone) -- WhatsApp + Tenant
FOREIGN KEY: tenant_id → tenants(id)
```

**Índices Críticos:**
- `(tenant_id, phone)` → Búsqueda rápida por WhatsApp
- `status` → Filtrado por Pipeline
- `qualification_score` → Priorización de leads calientes

### `professionals` Table (Vendedores)
```sql
ALTER TABLE professionals ADD COLUMN working_hours JSONB;
```

**Estructura del JSON de Disponibilidad:**
El campo `working_hours` almacena la agenda semanal de cada vendedor.

```json
{
  "1": { "enabled": true, "slots": [{"start": "09:00", "end": "18:00"}] }, // Lunes
  "2": { "enabled": true, "slots": [{"start": "09:00", "end": "18:00"}] }, // Martes
  "3": { "enabled": true, "slots": [{"start": "09:00", "end": "18:00"}] }, // Miércoles
  "4": { "enabled": true, "slots": [{"start": "09:00", "end": "18:00"}] }, // Jueves
  "5": { "enabled": true, "slots": [{"start": "09:00", "end": "17:00"}] }  // Viernes
}
```

---

### `seller_agenda_events`
```sql
PRIMARY KEY: id (UUID)
FOREIGN KEYS:
  - tenant_id → tenants(id)
  - lead_id → leads(id)
  - seller_id → professionals(id)
```

---

## 📊 Integración con Nexus Core

### Multi-tenancy Preservation
Todas las tablas nuevas incluyen `tenant_id` obligatorio en cada consulta.

### Memoria de Ventas
La IA utiliza `ai_actions` para recordar qué ofreció al lead anteriormente, permitiendo una charla fluida sin repetir preguntas.

### WhatsApp Sales Integration
1. `whatsapp_service` recibe mensaje.
2. `orchestrator_service` procesa con `crm_sales` tools.
3. Se actualiza el score y se notifica al vendedor si es necesario.

---

## ✅ Checklist de Validación SAAS

- [x] Filtro `tenant_id` en todas las queries de leads.
- [x] Sincronización con calendarios de vendedores.
- [x] Scoring automático visible en el Dashboard.
- [x] Handoff humano silenciando la IA por 24hs.

---

**Fecha de Actualización:** 2026-02-28
**Versión:** 2.0 (Dominio SAAS CRM)
**Estado:** Documentación Actualizada
