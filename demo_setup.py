#!/usr/bin/env python3
"""
Demo setup script for the status page application.
Creates sample organizations, services, and incidents for testing.
"""

import asyncio
import aiohttp
import json
from datetime import datetime

API_BASE = "http://localhost:8000/api"

# Demo data
DEMO_ORGS = [
    {
        "name": "GitHub Inc",
        "slug": "github",
        "services": [
            {
                "name": "Git Operations",
                "description": "Core Git hosting and operations",
            },
            {"name": "API Requests", "description": "REST and GraphQL API endpoints"},
            {"name": "Pull Requests", "description": "Pull request functionality"},
            {"name": "Packages", "description": "Package registry and hosting"},
            {"name": "Codespaces", "description": "Cloud development environments"},
            {"name": "Webhooks", "description": "Event notification system"},
            {"name": "Issues", "description": "Issue tracking and management"},
            {"name": "Actions", "description": "CI/CD workflows and automation"},
            {"name": "Pages", "description": "Static site hosting"},
            {"name": "Copilot", "description": "AI-powered code completion"},
        ],
    },
    {
        "name": "Acme Corp",
        "slug": "acme",
        "services": [
            {"name": "Web Application", "description": "Main customer-facing web app"},
            {"name": "Mobile API", "description": "Mobile application backend"},
            {"name": "Payment System", "description": "Payment processing and billing"},
            {"name": "Email Service", "description": "Transactional email delivery"},
            {"name": "File Storage", "description": "Document and media storage"},
        ],
    },
]


async def create_organization(session, org_data):
    """Create an organization with demo user."""
    print(f"Creating organization: {org_data['name']}")

    # Create organization - send clerk_user_id and email as query parameters
    clerk_user_id = f"demo_user_{org_data['slug']}"
    email = f"admin@{org_data['slug']}.com"

    async with session.post(
        f"{API_BASE}/organizations",
        json={
            "name": org_data["name"],
            "slug": org_data["slug"],
        },
        params={
            "clerk_user_id": clerk_user_id,
            "email": email,
        },
    ) as resp:
        if resp.status == 201:
            org = await resp.json()
            print(f"✓ Created organization: {org['name']} (ID: {org['id']})")
            return org
        else:
            error_text = await resp.text()
            print(f"✗ Failed to create organization: {resp.status} - {error_text}")
            return None


async def create_service(session, service_data, auth_token):
    """Create a service for the authenticated user."""
    print(f"  Creating service: {service_data['name']}")

    headers = {"Authorization": f"Bearer {auth_token}"}
    async with session.post(
        f"{API_BASE}/services", json=service_data, headers=headers
    ) as resp:
        if resp.status == 201:
            service = await resp.json()
            print(f"    ✓ Created service: {service['name']} (ID: {service['id']})")
            return service
        else:
            error_text = await resp.text()
            print(f"    ✗ Failed to create service: {resp.status} - {error_text}")
            return None


async def get_public_status(session, org_slug):
    """Test the public status page endpoint."""
    print(f"\nTesting public status page for {org_slug}...")

    async with session.get(f"{API_BASE}/status/{org_slug}") as resp:
        if resp.status == 200:
            status_data = await resp.json()
            print(f"✓ Public status page working!")
            print(f"  Organization: {status_data['organization']['name']}")
            print(f"  Services: {len(status_data['services'])}")
            print(f"  Active incidents: {len(status_data['active_incidents'])}")

            # Print service statuses
            for service in status_data["services"]:
                print(f"    - {service['name']}: {service['status']}")

            return status_data
        else:
            error_text = await resp.text()
            print(f"✗ Failed to get public status: {resp.status} - {error_text}")
            return None


async def create_demo_jwt_token(org_slug):
    """Create a simple demo JWT token for testing (insecure, for demo only)."""
    import jwt

    payload = {
        "sub": f"demo_user_{org_slug}",
        "email": f"admin@{org_slug}.com",
        "iat": datetime.utcnow().timestamp(),
        "exp": datetime.utcnow().timestamp() + 3600,  # 1 hour
    }

    # Use a simple secret for demo (in production, use proper Clerk verification)
    token = jwt.encode(payload, "demo-secret", algorithm="HS256")
    return token


async def main():
    """Main demo setup function."""
    print("🚀 Setting up demo data for Status Page application\n")

    async with aiohttp.ClientSession() as session:
        # Test backend connectivity
        try:
            async with session.get(f"{API_BASE.replace('/api', '')}/health") as resp:
                if resp.status == 200:
                    print("✓ Backend is running and healthy")
                else:
                    print(f"✗ Backend health check failed: {resp.status}")
                    return
        except aiohttp.ClientError as e:
            print(f"✗ Cannot connect to backend: {e}")
            print("Make sure the backend is running on http://localhost:8000")
            return

        # Create demo organizations and services
        for org_data in DEMO_ORGS:
            # Create organization
            org = await create_organization(session, org_data)
            if not org:
                continue

            # Create a demo JWT token for this org
            auth_token = await create_demo_jwt_token(org_data["slug"])

            # Create services for this organization
            print(f"Creating services for {org['name']}:")
            for service_data in org_data["services"]:
                await create_service(session, service_data, auth_token)

            # Test public status page
            await get_public_status(session, org_data["slug"])
            print("-" * 60)

    print("\n🎉 Demo setup complete!")
    print("\nYou can now visit:")
    for org_data in DEMO_ORGS:
        print(
            f"  - http://localhost:5173/status/{org_data['slug']} (Public status page)"
        )
    print(f"  - http://localhost:5173/dashboard/services (Admin dashboard)")
    print(f"  - http://localhost:8000/docs (API documentation)")


if __name__ == "__main__":
    asyncio.run(main())
