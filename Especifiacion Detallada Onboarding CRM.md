# **Spec 34Ok: Blueprint de Implementación \- SaaS Landing & Onboarding (CRM Ventas)**

**Fecha:** Febrero 2026 **Módulo:** Frontend (React \+ Tailwind) / Backend (FastAPI \+ PostgreSQL) **Objetivo:** Transformar la entrada pública de **CRM Ventas (Nexus Core)** en un embudo B2B de alta conversión (Product-Led Growth). Replicar la estética "SaaS Dark Mode" y el Onboarding Wizard de clase mundial (estilo respond.io), integrado nativamente con nuestro Marketing Hub y AI Setter.

## **1\. Arquitectura de Navegación y Rutas (React Router)**

El archivo frontend\_react/src/App.tsx debe modificarse para alojar este nuevo embudo sin interferir con las rutas /admin o /app existentes.

| Ruta | Componente | Nivel de Acceso | Descripción |
| :---- | :---- | :---- | :---- |
| / | SaaSLandingView.tsx | Público | La página de aterrizaje principal. Reemplaza la landing actual. |
| /registro | WizardRegistrationView.tsx | Público | Contenedor maestro del formulario de 3 pasos. |
| /login | LoginView.tsx | Público | (Actualizado visualmente para matchear el Dark Mode). |
| /app | DashboardView.tsx | Privado (JWT) | Panel principal. Inyectará el WelcomeModal y el OnboardingChecklist si el usuario es nuevo. |

## **2\. Desglose Front-End: Landing Page (SaaSLandingView.tsx)**

El diseño se basa en el patrón **"Sovereign Dark Glass"**.

* **Fondo principal:** \#000000 a \#0a0a0a (Degradado sutil).  
* **Texto primario:** text-white, **Secundario:** text-gray-400.  
* **Acentos:** Azul Eléctrico (\#2563EB / blue-600) y Morado Meta (\#9333EA / purple-600).

### **Componentes Internos a crear en src/views/landing/components/:**

#### **2.1. HeroSection.tsx**

* **Contenedor:** min-h-screen flex flex-col items-center justify-center pt-20 pb-10 px-4 text-center.  
* **Badge Superior:** Pill con borde brillante \<div className="rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 px-4 py-1 text-sm mb-6"\>Nuevo: AI Setter \+ Meta Ads\</div\>.  
* **Titular (H1):** text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500.  
  * *Texto:* "Los leads preguntan. Llaman. Tú pierdes el seguimiento. ¿Puedes seguir el ritmo?"  
* **Subtítulo (p):** text-xl text-gray-400 max-w-2xl mt-6.  
  * *Texto:* "CRM Ventas unifica WhatsApp, Meta Ads y tu Pipeline. Deja que nuestro Agente IA califique y agende reuniones por tus vendedores."  
* **Botón CTA:** bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-8 py-4 text-lg font-semibold shadow-\[0\_0\_30px\_rgba(37,99,235,0.4)\] transition-all.

#### **2.2. SocialProofTicker.tsx**

* **UI:** Barra infinita animada (keyframes en Tailwind).  
* **Texto:** "Agencias y equipos de ventas de alto rendimiento confían en nosotros".  
* **Contenido:** Íconos de clientes (en blanco y negro, opacity-50 hover:opacity-100 transition-opacity).

#### **2.3. FeatureZigZag.tsx (Bloques Alternados)**

Itera sobre un array de features.

* **Bloque 1 (Marketing Hub):**  
  * *Imagen:* Mockup de la UI de "MarketingPerformanceCard" mostrando ROI y campañas.  
  * *Texto Izquierda:* "Unifica todo tu tráfico. Los leads vienen de Facebook, Instagram o referidos. Mide el costo real de adquisición (CAC) y el ROI en tiempo real."  
* **Bloque 2 (AI Setter):**  
  * *Imagen:* Mockup flotante imitando un chat de WhatsApp donde el IA dice: *"¡Perfecto\! Te agendo una llamada con nuestro Closer. ¿A las 15hs te queda bien?"*.  
  * *Texto Derecha:* "Vende mientras duermes. El AI Setter responde objeciones, califica el presupuesto del lead y lo asigna al vendedor correcto."

#### **2.4. ImpactMetrics.tsx**

* **UI:** Un grid grid-cols-1 md:grid-cols-3 gap-8 py-20.  
* **Tarjetas:** Fondo bg-white/\[0.02\] border border-white/10 backdrop-blur-md rounded-2xl p-8 text-center.  
* **Datos:** 60% (Cierres más rápidos), 81% (Calificación IA), 24/7 (Seguimiento ininterrumpido).

## **3\. Flujo de Registro: "WizardRegistrationView.tsx"**

Este es el corazón de la captación. Será una *Single Page Application* interna usando react-hook-form y un estado numérico para navegar entre pasos sin recargar la página.

### **3.1. Estructura de Estado (Zod \+ React Hook Form)**

`interface WizardFormData {`  
  `// Step 0`  
  `email: string;`  
  `password: string;`  
  `// Step 1`  
  `company_name: string;`  
  `industry: string;`  
  `company_size: string;`  
  `website?: string;`  
  `// Step 2`  
  `sales_model: string;`  
  `use_cases: string[];`  
  `// Step 3`  
  `role: string;`  
  `phone_number: string;`  
  `acquisition_source: string;`  
`}`

### **3.2. Paso a Paso del UI (Flujo Fricción-Cero)**

* **Layout Base:** Pantalla dividida. Izquierda: Formulario (centrado, ancho máximo 400px). Derecha: Panel oscuro con un testimonial o estadísticas que cambian según el paso (refuerza la confianza).  
* **Step 0 (Credenciales):** Input email y password. Al dar "Next", validamos que no estén vacíos y cumplan formato.  
* **Step 1 (Empresa):**  
  * *Dropdown Industry:* Opciones \-\> Agencia Marketing, Bienes Raíces, SaaS/Tech, Educación/Cursos, Servicios Profesionales, Otro.  
  * *Radio Buttons Size:* Cajas seleccionables con hover azul \-\> 1-10, 11-50, 51-200, 200+.  
* **Step 2 (Casos de uso):**  
  * *Checkboxes múltiples:* "Calificar Leads", "Agendar Reuniones (Setters)", "Manejar Objeciones", "Medir ROI de Meta Ads".  
* **Step 3 (Perfil):**  
  * *Role:* Dropdown \-\> CEO / Founder, Director de Ventas / Manager, Vendedor / Setter.  
  * *Teléfono:* Componente con bandera internacional.  
* **Submit:** Al presionar "Comenzar", se muestra un spinner. Si es exitoso, redirección window.location.href \= '/app'.

## **4\. Activación: Dashboard Onboarding Experience**

Cuando el usuario aterriza en /app por primera vez, no debe ver un sistema vacío. Debe ser guiado.

### **4.1. WelcomeModal.tsx**

* **Lógica de aparición:** if (tenant.subscription\_status \=== 'trial' && isFirstLogin)  
* **Efecto:** Dispara la librería react-confetti (duración 4 segundos).  
* **Modal UI:** \* Header: "🎉 Bienvenido a tu prueba de 14 días Growth".  
  * Body: Un video incrustado (iframe de YouTube ocultando controles) "Demo de 2 minutos: Cómo cerrar tu primer lead hoy".  
  * Botón: "Configurar mi CRM" (Cierra el modal).

### **4.2. OnboardingChecklist.tsx**

* **Ubicación:** Un "Widget" fijado en la parte superior derecha o como primer elemento en el main grid del Dashboard.  
* **Progreso:** Barra de 0% a 100%.  
* **Items (Estilo Acordeón):**  
  1. **🔌 Conectar Marketing Hub:** "Sincroniza tus campañas de Meta Ads para medir el ROI." (Botón: Ir a Meta Ads).  
  2. **📱 Unificar WhatsApp:** "Conecta tu número oficial para que el AI Setter comience a trabajar." (Botón: Ir a Configuración).  
  3. **🤖 Entrenar al AI Setter:** "Define tus precios y servicios en el menú de Tratamientos/Servicios." (Botón: Ir a Servicios).  
  4. **👥 Invitar a tus Closers:** "Añade a tu equipo para que reciban reuniones agendadas." (Botón: Ir a Aprobaciones).  
* *Nota:* Cada item se tacha y se vuelve verde cuando se detecta el dato en el backend (ej: si credentials tiene token de Meta, el paso 1 se marca solo).

## **5\. Implementación Backend y Base de Datos**

Requerimos asegurar que este registro no rompa la estructura base tenants y mantenga la filosofía Multi-Tenant.

### **5.1. Migración Idempotente en db.py (Evolution Pipeline)**

Busca la función apply\_patches(conn) en orchestrator\_service/db.py y añade este parche al final de la lista:  
`async def patch_028_crm_saas_onboarding(conn):`  
    `"""Añade columnas para soportar el flujo SaaS de 14 días de prueba y métricas B2B"""`  
    `await conn.execute("""`  
        `DO $$`   
        `BEGIN`  
            `-- Fechas y status de Trial`  
            `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'trial_ends_at') THEN`  
                `ALTER TABLE tenants ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;`  
            `END IF;`

            `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'subscription_status') THEN`  
                `ALTER TABLE tenants ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'trial';`  
            `END IF;`

            `-- Perfilamiento B2B`  
            `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'industry') THEN`  
                `ALTER TABLE tenants ADD COLUMN industry VARCHAR(100);`  
            `END IF;`

            `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'company_size') THEN`  
                `ALTER TABLE tenants ADD COLUMN company_size VARCHAR(50);`  
            `END IF;`

            `IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'acquisition_source') THEN`  
                `ALTER TABLE tenants ADD COLUMN acquisition_source VARCHAR(100);`  
            `END IF;`  
        `END $$;`  
    `""")`

### **5.2. El Endpoint Atómico: POST /auth/register/wizard**

En orchestrator\_service/routes/auth\_routes.py.  
**Pydantic Schema:**  
`class WizardRegisterRequest(BaseModel):`  
    `email: EmailStr`  
    `password: str`  
    `company_name: str`  
    `industry: str`  
    `company_size: str`  
    `sales_model: str`  
    `use_cases: List[str]`  
    `role: str`  
    `phone_number: str`  
    `acquisition_source: str`  
    `website: Optional[str] = None`

**Lógica del Endpoint (Pseudocódigo estructurado):**  
`@router.post("/register/wizard")`  
`async def register_wizard(req: WizardRegisterRequest, db: Connection = Depends(get_db)):`  
    `# 1. Validar si el email ya existe`  
      
    `# 2. Iniciar Transacción de BD`  
    `async with db.transaction():`  
        `# 3. Crear Tenant`  
        `# Nota: Guardamos req.company_name en 'clinic_name' para retrocompatibilidad interna.`  
        `# Guardamos 'use_cases' y 'sales_model' dentro del JSONB 'config'.`  
        `# Setear trial_ends_at = NOW() + 14 days.`  
        `tenant_id = await db.fetchval(INSERT INTO tenants...)`

        `# 4. Encriptar Password (bcrypt)`  
          
        `# 5. Crear Usuario`  
        `# Importante: Para el CEO que crea la cuenta, el status es 'approved'`   
        `# para que pueda ingresar AL INSTANTE sin fricción.`  
        `user_id = await db.fetchval(INSERT INTO users (..., status='approved', role=req.role)...)`  
          
        `# 6. Crear Vendedor (Professional) asociado`  
        `# Para que el CRM de ventas funcione, el CEO/usuario debe existir en la tabla de vendedores.`  
        `await db.execute(INSERT INTO professionals (tenant_id, name, user_id, specialty) VALUES (tenant_id, req.email, user_id, 'CEO/Admin'))`  
          
    `# 7. Generar JWT y retornar`  
    `token = create_jwt_token({"sub": req.email, "role": req.role, "tenant_id": tenant_id})`  
    `return {"access_token": token, "token_type": "bearer", "status": "success"}`

## **6\. Plan de Ejecución (Checklist Estratégico para IA)**

Para codificar esto sin romper el sistema, sigue este orden exacto:

1. \[ \] **Fase Backend (Cimientos):**  
   * Modificar db.py agregando patch\_028\_crm\_saas\_onboarding.  
   * Crear los modelos Pydantic en models.py o dentro de auth\_routes.py.  
   * Implementar el endpoint POST /auth/register/wizard en auth\_routes.py.  
   * *Verificación:* Reiniciar Docker, ver que el parche SQL corrió limpio, probar endpoint vía Swagger (Postman).  
2. \[ \] **Fase UI Toolkit & Routing:**  
   * Asegurar que Tailwind está configurado para colores oscuros (bg-gray-950).  
   * Crear el layout base SaaSLayout.tsx (que oculta el sidebar/header del panel para estas rutas públicas).  
   * Modificar App.tsx para agregar las rutas / y /registro bajo este nuevo layout.  
3. \[ \] **Fase Wizard Registration (El Motor de Conversión):**  
   * Crear la carpeta src/views/onboarding/.  
   * Crear WizardRegistrationView.tsx.  
   * Implementar los 4 sub-componentes (Step 0, 1, 2, 3\) con react-hook-form.  
   * Conectar el submit final usando axios al nuevo endpoint de backend. Manejar redirección automática e inyección del JWT en localStorage.  
4. \[ \] **Fase Landing Page (La Cara Pública):**  
   * Crear SaaSLandingView.tsx.  
   * Construir el Hero, los Tickers de prueba social, y los Feature Blocks (Zig-Zag) con textos enfocados en CRM, Agente IA, y Marketing Hub.  
5. \[ \] **Fase Onboarding Dashboard (La Retención):**  
   * Instalar react-confetti (npm install react-confetti).  
   * En DashboardView.tsx, crear lógica para detectar si la cuenta tiene menos de 10 minutos de creada o leer un flag de localStorage (isFirstLogin).  
   * Crear e inyectar WelcomeModal.tsx y OnboardingChecklist.tsx.