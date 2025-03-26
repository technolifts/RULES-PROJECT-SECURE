from fastapi.testclient import TestClient
import pytest

def test_register_user(client: TestClient):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "Password123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["username"] == "newuser"
    assert "id" in data

def test_register_existing_email(client: TestClient, test_user):
    response = client.post(
        "/api/auth/register",
        json={
            "email": test_user.email,
            "username": "differentuser",
            "password": "Password123!",
        },
    )
    assert response.status_code == 400
    assert "email already exists" in response.json()["detail"].lower()

def test_register_existing_username(client: TestClient, test_user):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "different@example.com",
            "username": test_user.username,
            "password": "Password123!",
        },
    )
    assert response.status_code == 400
    assert "username already exists" in response.json()["detail"].lower()

def test_login_email(client: TestClient, test_user):
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user.email,
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_username(client: TestClient, test_user):
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user.username,
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client: TestClient, test_user):
    response = client.post(
        "/api/auth/login",
        data={
            "username": test_user.email,
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()

def test_login_nonexistent_user(client: TestClient):
    response = client.post(
        "/api/auth/login",
        data={
            "username": "nonexistent@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()
