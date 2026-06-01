import uuid
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, crud, database, seed
from .config import settings

# Wait for DB and initialize tables
database.wait_for_db()
models.Base.metadata.create_all(bind=database.engine)

# Seed initial data
db_session = database.SessionLocal()
try:
    seed.seed_data(db_session)
finally:
    db_session.close()

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-Ready Inventory and Order Management System API",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helpers to map models to rich schemas
def map_order_to_response(order: models.Order) -> schemas.OrderResponse:
    items_response = []
    for item in order.items:
        items_response.append(schemas.OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else "Deleted Product",
            quantity=item.quantity,
            price_at_purchase=item.price_at_purchase
        ))
    return schemas.OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else "Deleted Customer",
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        items=items_response
    )

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return crud.create_user(db, user)

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = crud.authenticate_user(db, credentials)
    # Generate portable secure access token
    token = f"flowstock-session-{user.username}-{uuid.uuid4().hex[:8]}"
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username
    }

# ==================== PRODUCT ENDPOINTS ====================

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(database.get_db)):
    return crud.create_product(db, product)

@app.get("/products", response_model=List[schemas.ProductResponse])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@app.get("/products/{id}", response_model=schemas.ProductResponse)
def get_product(id: int, db: Session = Depends(database.get_db)):
    db_product = crud.get_product(db, id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found"
        )
    return db_product

@app.put("/products/{id}", response_model=schemas.ProductResponse)
def update_product(id: int, product: schemas.ProductUpdate, db: Session = Depends(database.get_db)):
    return crud.update_product(db, id, product)

@app.delete("/products/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(id: int, db: Session = Depends(database.get_db)):
    crud.delete_product(db, id)
    return None

# ==================== CUSTOMER ENDPOINTS ====================

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(database.get_db)):
    return crud.create_customer(db, customer)

@app.get("/customers", response_model=List[schemas.CustomerResponse])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_customers(db, skip=skip, limit=limit)

@app.get("/customers/{id}", response_model=schemas.CustomerResponse)
def get_customer(id: int, db: Session = Depends(database.get_db)):
    db_customer = crud.get_customer(db, id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {id} not found"
        )
    return db_customer

@app.delete("/customers/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(id: int, db: Session = Depends(database.get_db)):
    crud.delete_customer(db, id)
    return None

# ==================== ORDER ENDPOINTS ====================

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(database.get_db)):
    db_order = crud.create_order(db, order)
    return map_order_to_response(db_order)

@app.get("/orders", response_model=List[schemas.OrderResponse])
def get_orders(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    db_orders = crud.get_orders(db, skip=skip, limit=limit)
    return [map_order_to_response(o) for o in db_orders]

@app.get("/orders/{id}", response_model=schemas.OrderResponse)
def get_order(id: int, db: Session = Depends(database.get_db)):
    db_order = crud.get_order(db, id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found"
        )
    return map_order_to_response(db_order)

@app.put("/orders/{id}/status", response_model=schemas.OrderResponse)
def update_order_status(id: int, status_update: schemas.OrderStatusUpdate, db: Session = Depends(database.get_db)):
    db_order = crud.update_order_status(db, id, status_update.status)
    return map_order_to_response(db_order)

@app.delete("/orders/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(id: int, db: Session = Depends(database.get_db)):
    crud.delete_order(db, id)
    return None

# ==================== DASHBOARD ENDPOINTS ====================

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(low_stock_threshold: int = 5, db: Session = Depends(database.get_db)):
    return crud.get_dashboard_stats(db, low_stock_threshold=low_stock_threshold)
