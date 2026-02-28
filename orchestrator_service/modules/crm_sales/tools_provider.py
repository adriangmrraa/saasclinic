"""
CRM Sales Module - Tool Provider
Registers the CRM Sales niche tools with the global tool registry.
"""
from typing import List
from langchain.tools import BaseTool

from core.tools import tool_registry

# Import classes from the local ai_tools module
try:
    from modules.crm_sales.ai_tools import (
        GetPipelineStagesTool,
        CheckSellerAvailabilityTool,
        CreateOrUpdateLeadTool,
        AssignToCloserAndHandoffTool,
        BookSalesMeetingTool,
    )
    _TOOL_CLASSES = [
        GetPipelineStagesTool,
        CheckSellerAvailabilityTool,
        CreateOrUpdateLeadTool,
        AssignToCloserAndHandoffTool,
        BookSalesMeetingTool
    ]
except ImportError as e:
    import logging
    logging.error(f"Failed to load CRM tool classes: {e}")
    _TOOL_CLASSES = []


def crm_sales_tools_provider(tenant_id: int) -> List[BaseTool]:
    """
    Returns the list of tools available for the CRM Sales niche, 
    instantiated with the specific tenant_id for security.
    """
    return [ToolClass(tenant_id=tenant_id) for ToolClass in _TOOL_CLASSES]


# Auto-register when module is imported
tool_registry.register_provider("crm_sales", crm_sales_tools_provider)
