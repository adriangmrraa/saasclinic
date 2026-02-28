import os
import sys

# Agregamos la ruta del servicio al sys.path para importar app
sys.path.insert(0, os.path.dirname(__file__))

from main import app
from fastapi.routing import APIRoute
import inspect

def audit_crm_endpoints():
    print("Iniciando auditoría de aislamiento de tenant (Fase 10)...")
    warnings = []
    
    for route in app.routes:
        if isinstance(route, APIRoute):
            # Filtrar rutas relacionadas al CRM o marcadas con admin/core/crm
            if route.path.startswith("/admin/core/crm") or route.path.startswith("/crm") or "CRM" in str(route.tags):
                # Verificar dependencias
                dependencies = route.dependencies
                endpoint_signature = inspect.signature(route.endpoint)
                
                has_strict_tenant_dep = False
                has_context_dep = False
                
                # Check global route dependencies
                for dep in dependencies:
                    if hasattr(dep.dependency, "__name__"):
                        dep_name = dep.dependency.__name__
                        if dep_name == "get_tenant_id_from_token":
                            has_strict_tenant_dep = True
                        if dep_name == "get_current_user_context" or dep_name == "get_current_user":
                            has_context_dep = True
                
                # Check endpoint parameter dependencies
                for param_name, param in endpoint_signature.parameters.items():
                    # Es una dependencia de Depends?
                    if hasattr(param.default, "dependency"):
                        dep_func = param.default.dependency
                        if hasattr(dep_func, "__name__"):
                            dep_name = dep_func.__name__
                            if dep_name == "get_tenant_id_from_token":
                                has_strict_tenant_dep = True
                            if dep_name == "get_current_user_context" or dep_name == "get_current_user":
                                has_context_dep = True
                                
                    # Está pidiendo tenant_id explícitamente en el payload o query en POST/PUT?
                    if route.methods and any(m in route.methods for m in ["POST", "PUT", "DELETE"]):
                        if param_name == "tenant_id":
                            warnings.append(f"❌ PELIGRO: {list(route.methods)} {route.path} expone 'tenant_id' como parámetro directo de entrada.")
                
                if not has_strict_tenant_dep and not has_context_dep:
                    warnings.append(f"⚠️ ADVERTENCIA: {list(route.methods)} {route.path} NO inyecta contexto de usuario o tenant autenticado.")
                
                # Para updates o deletes, es altamente recomendado usar get_tenant_id_from_token
                if route.methods and any(m in route.methods for m in ["POST", "PUT", "DELETE"]) and not has_strict_tenant_dep:
                    if has_context_dep:
                        warnings.append(f"⚠️ SUGERENCIA: {list(route.methods)} {route.path} usa context genérico, pero podría usar get_tenant_id_from_token estrictamente.")

    
    print("\nResultados de la auditoría:")
    if not warnings:
        print("✅ Todo perfecto. Todos los endpoints pasaron la validación de aislamiento.")
    else:
        for w in warnings:
            print(w)
        print(f"\nTotal advertencias: {len(warnings)}")

if __name__ == "__main__":
    audit_crm_endpoints()
