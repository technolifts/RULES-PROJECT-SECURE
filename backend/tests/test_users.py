from fastapi.testclient import TestClient
import pytest
from app.core.security import create_access_token

def test_read_current_user(client: TestClient, test_user):
    access_token = create_access_token(subject=str(test_user.id))
    response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["username"] == test_user.username
    assert data["id"] == str(test_user.id)

def test_read_current_user_unauthorized(client: TestClient):
    response = client.get("/api/users/me")
    assert response.status_code == 401

def test_update_current_user(client: TestClient, test_user):
    access_token = create_access_token(subject=str(test_user.id))
    response = client.put(
        "/api/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "username": "updateduser",
            "email": "updated@example.com",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "updated@example.com"
    assert data["username"] == "updateduser"
    assert data["id"] == str(test_user.id)

def test_update_current_user_existing_email(client: TestClient, test_user, db):
    # Create another user
    from app.models.user import User
    from app.core.security import get_password_hash
    
    other_user = User(
        email="other@example.com",
        username="otheruser",
        hashed_password=get_password_hash("password123"),
    )
    db.add(other_user)
    db.commit()
    
    # Try to update to the other user's email
    access_token = create_access_token(subject=str(test_user.id))
    response = client.put(
        "/api/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "email": "other@example.com",
        },
    )
    assert response.status_code == 400
    assert "email already registered" in response.json()["detail"].lower()

def test_update_current_user_existing_username(client: TestClient, test_user, db):
    # Create another user
    from app.models.user import User
    from app.core.security import get_password_hash
    
    other_user = User(
        email="other@example.com",
        username="otheruser",
        hashed_password=get_password_hash("password123"),
    )
    db.add(other_user)
    db.commit()
    
    # Try to update to the other user's username
    access_token = create_access_token(subject=str(test_user.id))
    response = client.put(
        "/api/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "username": "otheruser",
        },
    )
    assert response.status_code == 400
    assert "username already registered" in response.json()["detail"].lower()
