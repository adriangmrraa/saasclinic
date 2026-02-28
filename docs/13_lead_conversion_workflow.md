# Gestión de Leads y Conversión (Workflow)

Este documento detalla el flujo de conversión de **Leads** (contactos iniciales) a **Clientes** (con historial activo en el CRM), implementado en la plataforma SAAS CRM.

## 1. Definiciones

- **Lead:** Todo contacto nuevo que entra por WhatsApp, Meta Ads o Prospección.
  - **Estado en BD:** `new`, `contacted`, `qualified`.
  - **Datos mínimos:** Teléfono (automático) y Nombre.
  - **Objetivo:** Calificar el interés y agendar una demo/llamada.

- **Cliente / Venta Cerrada:** Usuario que ha concretado una transacción o tiene un contrato activo.
  - **Estado en BD:** `converted`, `demo_scheduled`.
  - **Datos requeridos:** Nombre, Empresa, Email, Cargo.

## 2. Flujo de Conversión por IA (WhatsApp)

El agente de IA sigue un protocolo de ventas consultivo.

### Protocolo de Calificación

1.  **Lead solicita información:** El usuario pregunta por el producto o servicio.
2.  **Indagación de Necesidades (JIT):** 
    - El agente **DEBE** entender el problema del cliente antes de ofrecer una solución.
    - Esto permite asignar el **vendedor (Closer) más adecuado**.
3.  **Cálculo de Score:** El sistema evalúa el interés y califica el lead de 0 a 100.
4.  **Solicitud de Datos (Profiling):**
    - La IA solicita: Nombre, Email, Empresa.
    - *Regla de Oro:* No se agenda reunión sin tener datos de contacto validados.
5.  **Verificación de Disponibilidad:**
    - Antes de confirmar una demo, el sistema consulta los calendarios de los vendedores en tiempo real (Google Calendar).
6.  **Reserva y Handoff:**
    - Al ejecutar `book_sales_meeting`, el sistema:
        1.  Confirma la cita en el calendario del vendedor.
        2.  Ejecuta `assign_to_closer_and_handoff` para pasar la posta a un humano con un resumen de la charla.
        3.  Refleja el cambio en el Pipeline (Kanban).

## 3. Flujo Manual (Dashboard)

El panel administrativo permite gestionar leads masivamente:

1.  **Importación / Prospección:** Conversión de datos de Apify a leads activos.
2.  **Gestión de Pipeline:** Arrastrar leads entre columnas (Nuevo -> Calificado -> Demo).
3.  **Asignación Directa:** El manager puede asignar leads a vendedores específicos manualmente.

## 4. Filtrado y Segmentación

- Los leads se pueden segmentar por origen (`meta_lead_form`, `ycloud`, `prospecting`).
- El sistema prioriza visualmente los leads con mayor score de calificación.

## 5. Visibilidad en Chats (Contexto de Ventas)

La vista de **Chats** integra un panel de **Contexto del Lead**:

- **Historial Completo**: Últimos eventos, scores previos y origen del lead.
- **Acciones Rápidas**: Botones para agendar, calificar o silenciar a la IA.
- **Soberanía**: Cada empresa (tenant) solo ve sus propios leads y vendedores.

---
*Protocolo SAAS CRM © 2026*
