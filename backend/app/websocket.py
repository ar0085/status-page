import socketio
from typing import Dict, Set
import json
from app.schemas.organization import WebSocketMessage

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# Store organization subscriptions: {tenant_id: {session_id}}
organization_subscribers: Dict[int, Set[str]] = {}


@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    print(f"Client connected: {sid}")
    await sio.emit(
        "connected", {"message": "Connected to status page updates"}, room=sid
    )


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    print(f"Client disconnected: {sid}")
    # Remove client from all organization subscriptions
    for subscribers in organization_subscribers.values():
        subscribers.discard(sid)


@sio.event
async def subscribe_organization(sid, data):
    """Subscribe a client to an organization's updates"""
    try:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            await sio.emit("error", {"message": "tenant_id is required"}, room=sid)
            return

        if tenant_id not in organization_subscribers:
            organization_subscribers[tenant_id] = set()
        organization_subscribers[tenant_id].add(sid)

        await sio.emit(
            "subscribed",
            {
                "message": f"Subscribed to organization {tenant_id}",
                "tenant_id": tenant_id,
            },
            room=sid,
        )

        print(f"Client {sid} subscribed to organization {tenant_id}")
    except Exception as e:
        await sio.emit("error", {"message": str(e)}, room=sid)


@sio.event
async def unsubscribe_organization(sid, data):
    """Unsubscribe a client from an organization's updates"""
    try:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            await sio.emit("error", {"message": "tenant_id is required"}, room=sid)
            return

        if tenant_id in organization_subscribers:
            organization_subscribers[tenant_id].discard(sid)
            await sio.emit(
                "unsubscribed",
                {
                    "message": f"Unsubscribed from organization {tenant_id}",
                    "tenant_id": tenant_id,
                },
                room=sid,
            )
            print(f"Client {sid} unsubscribed from organization {tenant_id}")
    except Exception as e:
        await sio.emit("error", {"message": str(e)}, room=sid)


async def emit_to_organization(tenant_id: int, event: str, data: dict):
    """Emit an event to all clients subscribed to an organization"""
    if tenant_id in organization_subscribers and organization_subscribers[tenant_id]:
        message = WebSocketMessage(type=event, data=data, tenant_id=tenant_id)

        await sio.emit(
            "status_update",
            message.dict(),
            room=list(organization_subscribers[tenant_id]),
        )
        print(
            f"Emitted {event} to {len(organization_subscribers[tenant_id])} clients for tenant {tenant_id}"
        )


async def emit_service_update(tenant_id: int, service_data: dict):
    """Emit service status update"""
    await emit_to_organization(tenant_id, "service_update", service_data)


async def emit_incident_update(tenant_id: int, incident_data: dict):
    """Emit incident update"""
    await emit_to_organization(tenant_id, "incident_update", incident_data)


async def emit_incident_created(tenant_id: int, incident_data: dict):
    """Emit new incident created"""
    await emit_to_organization(tenant_id, "incident_created", incident_data)


async def emit_maintenance_update(tenant_id: int, maintenance_data: dict):
    """Emit maintenance update"""
    await emit_to_organization(tenant_id, "maintenance_update", maintenance_data)


async def emit_maintenance_created(tenant_id: int, maintenance_data: dict):
    """Emit new maintenance created"""
    await emit_to_organization(tenant_id, "maintenance_created", maintenance_data)
