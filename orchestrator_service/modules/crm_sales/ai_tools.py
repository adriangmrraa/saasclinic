import json
import re
import uuid
import logging
from typing import Type, Any, Optional, List
from datetime import datetime, timedelta, date
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool
from dateutil.parser import parse as dateutil_parse

from db import pool
from core.utils import ARG_TZ

logger = logging.getLogger(__name__)

# --- SCHEMAS ---

class GetPipelineStagesInput(BaseModel):
    pass # No params needed from LLM

class CheckSellerAvailabilityInput(BaseModel):
    date_query: str = Field(..., description="Fecha o rango de fechas a consultar en formato YYYY-MM-DD.")

class CreateOrUpdateLeadInput(BaseModel):
    phone: str = Field(..., description="Número de teléfono del lead.")
    name: str = Field(..., description="Nombre completo del lead.")
    email: Optional[str] = Field(None, description="Email del lead (opcional).")
    qualification_score: int = Field(0, description="Puntuación de calificación del lead de 0 a 100.")

class AssignToCloserAndHandoffInput(BaseModel):
    phone: str = Field(..., description="Número de teléfono del lead a asignar.")
    seller_name_or_id: str = Field(..., description="Nombre o ID del vendedor al que se asignará el lead.")
    summary: str = Field(..., description="Resumen breve para el vendedor sobre por qué este lead está caliente o requiere atención temprana.")

class BookSalesMeetingInput(BaseModel):
    phone: str = Field(..., description="Número de teléfono del lead.")
    date_time: str = Field(..., description="Fecha y hora de la reunión, ej. 'mañana a las 10:00', 'lunes 15:30'.")
    reason: str = Field(..., description="Breve motivo de la reunión (qué producto o servicio le interesa).")
    preferred_seller: Optional[str] = Field(None, description="Nombre parcial del vendedor preferido si el cliente lo menciona.")

# --- TOOLS ---

class GetPipelineStagesTool(BaseTool):
    name: str = "get_pipeline_stages"
    description: str = "Obtiene los estados válidos del Pipeline (Kanban) configurados para esta empresa."
    args_schema: Type[BaseModel] = GetPipelineStagesInput
    tenant_id: int

    async def _arun(self, **kwargs: Any) -> Any:
        async with pool.acquire() as conn:
            records = await conn.fetch(
                """
                SELECT code, name, category 
                FROM lead_statuses 
                WHERE tenant_id = $1
                ORDER BY sort_order ASC
                """,
                self.tenant_id
            )
            if not records:
                return "No se encontraron estados de pipeline configurados para este tenant."
            
            stages = [f"- {r['category'].upper()}: {r['name']} (code: {r['code']})" for r in records]
            return "Estados del Pipeline actual:\n" + "\n".join(stages)

    def _run(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError("This tool only supports async execution.")

# --- HELPERS ---

def _get_now():
    return datetime.now(ARG_TZ)

def _parse_datetime_crm(datetime_query: str) -> datetime:
    """Parsea fecha/hora tipo 'miércoles 17:00' o 'tomorrow 15:30'."""
    query = datetime_query.lower().strip()
    target_time = (10, 0)
    time_match = re.search(r"(\d{1,2})[:h](\d{2})", query)
    if time_match:
        target_time = (int(time_match.group(1)), int(time_match.group(2)))
    else:
        hour_only = re.search(r"(?:las?\s+)?(\d{1,2})\s*(?:hs?|horas?)?\b", query)
        if hour_only:
            h = int(hour_only.group(1))
            if 0 <= h <= 23:
                target_time = (h, 0)

    today = _get_now().date()
    day_map = {
        "mañana": 1, "tomorrow": 1, "pasado mañana": 2, "day after tomorrow": 2,
        "hoy": 0, "today": 0,
        "lunes": 0, "monday": 0, "martes": 1, "tuesday": 1,
        "miércoles": 2, "miercoles": 2, "wednesday": 2, "jueves": 3, "thursday": 3,
        "viernes": 4, "friday": 4, "sábado": 5, "sabado": 5, "saturday": 5,
        "domingo": 6, "sunday": 6,
    }
    
    target_date = None
    for key, days_ahead in day_map.items():
        if key in query:
            if days_ahead == 0:
                target_date = today
            else:
                # Calculate next occurrence of a weekday if nested in day_map logic
                # For simplicity, use the simple day adding if it matches
                target_date = today + timedelta(days=days_ahead)
            break
            
    if not target_date:
        return datetime.combine(today + timedelta(days=1), datetime.min.time().replace(hour=target_time[0], minute=target_time[1])).replace(tzinfo=ARG_TZ)

    return datetime.combine(target_date, datetime.min.time().replace(hour=target_time[0], minute=target_time[1])).replace(tzinfo=ARG_TZ)


class CheckSellerAvailabilityTool(BaseTool):
    name: str = "check_seller_availability"
    description: str = "Comprueba si hay vendedores disponibles para agendar una llamada en una fecha determinada."
    args_schema: Type[BaseModel] = CheckSellerAvailabilityInput
    tenant_id: int

    async def _arun(self, date_query: str, **kwargs: Any) -> Any:
        async with pool.acquire() as conn:
            # Query the professionals table
            records = await conn.fetch(
                """
                SELECT p.id, p.first_name, p.last_name, u.role 
                FROM professionals p
                JOIN users u ON p.user_id = u.id
                WHERE p.tenant_id = $1 
                  AND p.is_active = true
                """,
                self.tenant_id
            )
            if not records:
                return "No hay vendedores configurados o activos en este momento."
            
            # Check availability for each
            try:
                target_dt = _parse_datetime_crm(date_query)
            except:
                return f"No pude entender la fecha '{date_query}'. Prueba con algo como 'mañana a las 10:00'."

            available_sellers = []
            for r in records:
                conflict = await conn.fetchval(
                    """
                    SELECT EXISTS(
                        SELECT 1 FROM seller_agenda_events
                        WHERE tenant_id = $1 AND seller_id = $2 AND status != 'cancelled'
                          AND start_datetime < $3 AND end_datetime > $4
                    )
                    """,
                    self.tenant_id, r['id'], target_dt + timedelta(hours=1), target_dt
                )
                if not conflict:
                    available_sellers.append(f"- {r['first_name']} {r['last_name']} ({r['role']})")
            
            if not available_sellers:
                return f"No hay vendedores disponibles para el {target_dt.strftime('%d/%m %H:%M')}. Prueba otro horario."
                
            return f"Vendedores disponibles para {target_dt.strftime('%d/%m %H:%M')}:\n" + "\n".join(available_sellers)

    def _run(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError("This tool only supports async execution.")


class CreateOrUpdateLeadTool(BaseTool):
    name: str = "create_or_update_lead"
    description: str = "Crea un nuevo lead o actualiza uno existente usando el número de teléfono como identificador."
    args_schema: Type[BaseModel] = CreateOrUpdateLeadInput
    tenant_id: int

    async def _arun(self, phone: str, name: str, email: Optional[str] = None, qualification_score: int = 0, **kwargs: Any) -> Any:
        async with pool.acquire() as conn:
            # Upsert logic ensuring tenant_id isolation
            query = """
                INSERT INTO leads (tenant_id, phone, name, email, qualification_score, status)
                VALUES ($1, $2, $3, $4, $5, 'new')
                ON CONFLICT (tenant_id, phone) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    email = COALESCE(EXCLUDED.email, leads.email),
                    qualification_score = EXCLUDED.qualification_score,
                    updated_at = NOW()
                RETURNING id, status
            """
            try:
                record = await conn.fetchrow(
                    query, 
                    self.tenant_id, phone, name, email, qualification_score
                )
                if record:
                    # Persist event in history
                    try:
                        await pool.execute(
                            "INSERT INTO ai_actions (tenant_id, lead_id, type, title, summary, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
                            self.tenant_id, record['id'], 
                            "lead_qualified" if qualification_score > 70 else "lead_updated",
                            "Lead Qualificado" if qualification_score > 70 else "Lead Actualizado",
                            f"Lead {name} registrado/actualizado vía IA con score {qualification_score}.",
                            json.dumps({"qualification_score": qualification_score})
                        )
                    except Exception as e:
                        logger.error(f"Error persisting ai_action in upsert: {e}")

                    # Emit ai_action event
                    try:
                        from core.socket_notifications import emit_ai_action
                        await emit_ai_action(self.tenant_id, {
                            "type": "lead_qualified" if qualification_score > 70 else "lead_updated",
                            "title": "Lead Qualificado" if qualification_score > 70 else "Lead Actualizado",
                            "summary": f"Lead {name} registrado/actualizado vía IA con score {qualification_score}.",
                            "lead_phone": phone,
                            "lead_id": str(record['id']),
                            "metadata": {"qualification_score": qualification_score}
                        })
                    except: pass
                    
                    return f"Lead guardado/actualizado exitosamente con ID {record['id']} en estado '{record['status']}'."
                return "Upsert ejecutado pero no retornó datos."
            except Exception as e:
                return f"Error al guardar el lead en la base de datos CRM: {str(e)}"

    def _run(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError("This tool only supports async execution.")

class AssignToCloserAndHandoffTool(BaseTool):
    name: str = "assign_to_closer_and_handoff"
    description: str = "Asigna un lead caliente a un vendedor humano (closer) y le envía una notificación en tiempo real notificando el Handoff."
    args_schema: Type[BaseModel] = AssignToCloserAndHandoffInput
    tenant_id: int

    async def _arun(self, phone: str, seller_name_or_id: str, summary: str, **kwargs: Any) -> Any:
        async with pool.acquire() as conn:
            # 1. Get the lead ID ensuring data isolation
            lead = await conn.fetchrow(
                "SELECT id, name FROM leads WHERE tenant_id = $1 AND phone = $2",
                self.tenant_id, phone
            )
            if not lead:
                return f"No se encontró un lead con el teléfono {phone} para asignar."
            
            # 2. Get the seller ID securely
            seller = await conn.fetchrow(
                """
                SELECT id, first_name, last_name 
                FROM users 
                WHERE tenant_id = $1 AND role IN ('closer', 'seller', 'ceo') AND status = 'active'
                AND (id::text = $2 OR first_name ILIKE $3)
                LIMIT 1
                """,
                self.tenant_id, seller_name_or_id, f"%{seller_name_or_id}%"
            )
            if not seller:
                return f"No se encontró un vendedor válido con el nombre o ID: {seller_name_or_id}"
                
            # 3. Update the lead and secure 24 hours of human override
            await conn.execute(
                """
                UPDATE leads 
                SET assigned_to = $1, 
                    status = 'demo_scheduled', 
                    human_override_until = NOW() + INTERVAL '24 hours',
                    updated_at = NOW()
                WHERE id = $2 AND tenant_id = $3
                """,
                seller['id'], lead['id'], self.tenant_id
            )
            
            # 4. Notify and Persist
            try:
                # DB Persistence
                await pool.execute(
                    "INSERT INTO ai_actions (tenant_id, lead_id, type, title, summary, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
                    self.tenant_id, lead['id'], "status_change", "Lead Asignado (Handoff)", summary,
                    json.dumps({
                        "assigned_to": str(seller['id']),
                        "seller_name": f"{seller['first_name']} {seller['last_name']}",
                        "new_status": "demo_scheduled"
                    })
                )

                # Socket Emit
                from core.socket_notifications import emit_ai_action
                await emit_ai_action(self.tenant_id, {
                    "type": "status_change",
                    "title": "Lead Asignado (Handoff)",
                    "summary": summary,
                    "lead_phone": phone,
                    "lead_id": str(lead['id']),
                    "metadata": {
                        "assigned_to": str(seller['id']),
                        "seller_name": f"{seller['first_name']} {seller['last_name']}",
                        "new_status": "demo_scheduled"
                    }
                })
            except Exception as e:
                logger.error(f"Error emitting/persisting ai_action in handoff: {e}")
            
            return f"Lead asignado exitosamente a {seller['first_name']} {seller['last_name']} y notificación push enviada."

    def _run(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError("This tool only supports async execution.")

class BookSalesMeetingTool(BaseTool):
    name: str = "book_sales_meeting"
    description: str = "Agenda una reunión de ventas (demo o llamada) en el calendario local del vendedor."
    args_schema: Type[BaseModel] = BookSalesMeetingInput
    tenant_id: int

    async def _arun(self, phone: str, date_time: str, reason: str, preferred_seller: Optional[str] = None, **kwargs: Any) -> Any:
        async with pool.acquire() as conn:
            # 1. Parse date/time
            try:
                start_dt = _parse_datetime_crm(date_time)
                if start_dt < _get_now():
                    return "❌ No se pueden agendar reuniones en el pasado. Por favor, elige una fecha futura."
                end_dt = start_dt + timedelta(hours=1)
            except Exception as e:
                return f"❌ No pude entender la fecha '{date_time}'. Por favor, sé más específico (ej. 'Mañana a las 11:00')."

            # 2. Get lead ensuring data isolation
            lead = await conn.fetchrow(
                "SELECT id, first_name, last_name FROM leads WHERE tenant_id = $1 AND phone = $2",
                self.tenant_id, phone
            )
            if not lead:
                return "❌ Primero debo guardarte como lead. Por favor, dime tu nombre para registrarte antes de agendar."

            # 3. Find available seller in professionals table
            sellers_query = """
                SELECT p.id, p.first_name, p.last_name
                FROM professionals p
                JOIN users u ON p.user_id = u.id
                WHERE p.tenant_id = $1 AND p.is_active = true
            """
            params = [self.tenant_id]
            if preferred_seller:
                sellers_query += " AND (p.first_name ILIKE $2 OR p.last_name ILIKE $2)"
                params.append(f"%{preferred_seller}%")
            
            candidates = await conn.fetch(sellers_query, *params)
            if not candidates:
                return "❌ No hay vendedores disponibles para esta organización actualmente."

            target_seller = None
            for s in candidates:
                # Check conflicts in local calendar
                conflict = await conn.fetchval(
                    """
                    SELECT EXISTS(
                        SELECT 1 FROM seller_agenda_events
                        WHERE tenant_id = $1 AND seller_id = $2 AND status != 'cancelled'
                          AND start_datetime < $3 AND end_datetime > $4
                    )
                    """,
                    self.tenant_id, s['id'], end_dt, start_dt
                )
                if not conflict:
                    target_seller = s
                    break
            
            if not target_seller:
                return "❌ Lo siento, no hay vendedores disponibles en ese horario. ¿Podemos intentar otro momento?"

            # 4. Book the meeting
            event_id = uuid.uuid4()
            title = f"Ventas: {reason[:100]}"
            await conn.execute(
                """
                INSERT INTO seller_agenda_events (id, tenant_id, seller_id, title, start_datetime, end_datetime, lead_id, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
                """,
                event_id, self.tenant_id, target_seller['id'], title, start_dt, end_dt, lead['id']
            )

            # 5. Notify and Persist
            try:
                # DB Persistence
                await pool.execute(
                    "INSERT INTO ai_actions (tenant_id, lead_id, type, title, summary, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
                    self.tenant_id, lead['id'], "meeting_booked", "Cita de Ventas Agendada",
                    f"Reunión para {lead['first_name']} {lead['last_name']} el {start_dt.strftime('%d/%m %H:%M')}",
                    json.dumps({
                        "date_time": start_dt.isoformat(),
                        "seller_id": str(target_seller['id']),
                        "event_id": str(event_id)
                    })
                )

                # Socket Emit
                from core.socket_notifications import emit_ai_action
                await emit_ai_action(self.tenant_id, {
                    "type": "meeting_booked",
                    "title": "Cita de Ventas Agendada",
                    "summary": f"Reunión para {lead['first_name']} {lead['last_name']} el {start_dt.strftime('%d/%m %H:%M')}. Motivo: {reason}",
                    "lead_phone": phone,
                    "lead_id": str(lead['id']),
                    "metadata": {
                        "date_time": start_dt.isoformat(),
                        "seller_id": str(target_seller['id']),
                        "event_id": str(event_id)
                    }
                })
            except Exception as e:
                logger.error(f"Error persisting/emitting meeting ai_action: {e}")

            return f"✅ ¡Listo! He agendado tu reunión para el {start_dt.strftime('%d/%m a las %H:%M')} con {target_seller['first_name']}. ¿Hay algo más en lo que pueda ayudarte?"

    def _run(self, *args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError("This tool only supports async execution.")


# Classes exported instead of instances so we can instantiate them with dynamic tenant_ids

