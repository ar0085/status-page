#!/usr/bin/env python3
"""
Simple test script to verify CRUD operations for incidents and maintenance
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Test data
test_headers = {
    "Authorization": "Bearer test-token",  # You'll need to replace with actual token
    "Content-Type": "application/json",
}


def test_services():
    print("Testing Services CRUD...")

    # Get services
    response = requests.get(f"{BASE_URL}/api/services/", headers=test_headers)
    print(f"GET services: {response.status_code}")
    if response.status_code == 200:
        services = response.json()
        print(f"Found {len(services)} services")
        return services
    return []


def test_incidents(services):
    print("\nTesting Incidents CRUD...")

    if not services:
        print("No services available for testing")
        return []

    # Create incident
    incident_data = {
        "title": "Test Incident",
        "description": "This is a test incident",
        "service_ids": [services[0]["id"]],
    }

    response = requests.post(
        f"{BASE_URL}/api/incidents/", headers=test_headers, json=incident_data
    )
    print(f"CREATE incident: {response.status_code}")

    if response.status_code == 201:
        incident = response.json()
        incident_id = incident["id"]
        print(f"Created incident with ID: {incident_id}")

        # Add incident update
        update_data = {"text": "This is a test update"}
        response = requests.post(
            f"{BASE_URL}/api/incidents/{incident_id}/updates",
            headers=test_headers,
            json=update_data,
        )
        print(f"CREATE incident update: {response.status_code}")

        # Update incident
        update_incident_data = {"title": "Updated Test Incident", "status": "resolved"}
        response = requests.put(
            f"{BASE_URL}/api/incidents/{incident_id}",
            headers=test_headers,
            json=update_incident_data,
        )
        print(f"UPDATE incident: {response.status_code}")

        # Get incident
        response = requests.get(
            f"{BASE_URL}/api/incidents/{incident_id}", headers=test_headers
        )
        print(f"GET incident: {response.status_code}")

        # Delete incident
        response = requests.delete(
            f"{BASE_URL}/api/incidents/{incident_id}", headers=test_headers
        )
        print(f"DELETE incident: {response.status_code}")

        return [incident]

    return []


def test_maintenance(services):
    print("\nTesting Maintenance CRUD...")

    if not services:
        print("No services available for testing")
        return []

    # Create maintenance
    maintenance_data = {
        "title": "Test Maintenance",
        "description": "This is a test maintenance window",
        "scheduled_start": "2025-05-28T10:00:00",
        "scheduled_end": "2025-05-28T12:00:00",
        "service_ids": [services[0]["id"]],
    }

    response = requests.post(
        f"{BASE_URL}/api/maintenance/", headers=test_headers, json=maintenance_data
    )
    print(f"CREATE maintenance: {response.status_code}")

    if response.status_code == 201:
        maintenance = response.json()
        maintenance_id = maintenance["id"]
        print(f"Created maintenance with ID: {maintenance_id}")

        # Update maintenance
        update_maintenance_data = {
            "title": "Updated Test Maintenance",
            "status": "in_progress",
        }
        response = requests.put(
            f"{BASE_URL}/api/maintenance/{maintenance_id}",
            headers=test_headers,
            json=update_maintenance_data,
        )
        print(f"UPDATE maintenance: {response.status_code}")

        # Get maintenance
        response = requests.get(
            f"{BASE_URL}/api/maintenance/{maintenance_id}", headers=test_headers
        )
        print(f"GET maintenance: {response.status_code}")

        # Delete maintenance
        response = requests.delete(
            f"{BASE_URL}/api/maintenance/{maintenance_id}", headers=test_headers
        )
        print(f"DELETE maintenance: {response.status_code}")

        return [maintenance]

    return []


def test_public_status():
    print("\nTesting Public Status Page...")

    # Test public status page (no auth needed)
    response = requests.get(f"{BASE_URL}/api/status/hans-github")
    print(f"GET public status: {response.status_code}")

    if response.status_code == 200:
        status_data = response.json()
        print(f"Organization: {status_data['organization']['name']}")
        print(f"Services: {len(status_data['services'])}")
        print(f"Active incidents: {len(status_data['active_incidents'])}")
        print(f"Active maintenances: {len(status_data['active_maintenances'])}")


if __name__ == "__main__":
    print("Starting CRUD tests...")
    print("Note: You need to update the Authorization header with a valid token")

    # Test services first
    services = test_services()

    # Test incidents
    test_incidents(services)

    # Test maintenance
    test_maintenance(services)

    # Test public status page
    test_public_status()

    print("\nTests completed!")
