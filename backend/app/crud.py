import hashlib
import uuid
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional
from . import models, schemas

# ==================== AUTH & SECURITY HELPERS ====================
def hash_password(password: str, salt: str = None) -> str:
    """
    Secure password hashing helper using SHA-256 with salt.
    No external native dependencies required, fully portable.
    """
    if not salt:
        salt = uuid.uuid4().hex
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return f"{salt}${hashed}"

def verify_password(plain_password: str, stored_password: str) -> bool:
    """
    Verifies a plain text password against a securely stored salt-hash combo.
    """
    try:
        salt, hashed = stored_password.split('$')
        rehashed = hashlib.sha256((plain_password + salt).encode('utf-8')).hexdigest()
        return rehashed == hashed
    except Exception:
        return False

# ==================== USER CRUD ====================
def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    # Check duplicate username
    existing = get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user.username}' is already taken"
        )
    
    db_user = models.User(
        username=user.username,
        hashed_password=hash_password(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, credentials: schemas.UserLogin) -> models.User:
    user = get_user_by_username(db, credentials.username)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    return user

# ==================== PRODUCT CRUD ====================
def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[models.Product]:
    return db.query(models.Product).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    # Check if SKU already exists
    existing = get_product_by_sku(db, product.sku)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists"
        )
    
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate) -> models.Product:
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        existing = get_product_by_sku(db, update_data["sku"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_data['sku']}' already exists"
            )
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product(db, product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    db.delete(db_product)
    db.commit()
    return True

# ==================== CUSTOMER CRUD ====================
def get_customer(db: Session, customer_id: int) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[models.Customer]:
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate) -> models.Customer:
    existing = get_customer_by_email(db, customer.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists"
        )
        
    db_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int) -> bool:
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    db.delete(db_customer)
    db.commit()
    return True

# ==================== ORDER CRUD ====================
def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100) -> List[models.Order]:
    return db.query(models.Order).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    # 1. Validate customer exists
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} not found"
        )

    # 2. Begin transaction for atomic stock verification and updates
    total_amount = 0.0
    order_items_to_create = []
    seen_products = set()

    for item in order_in.items:
        if item.product_id in seen_products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate product ID {item.product_id} specified in order"
            )
        seen_products.add(item.product_id)

        product = get_product(db, item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )

        # Check inventory sufficiency
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Available: {product.quantity}, Requested: {item.quantity}"
            )

        # Deduct stock
        product.quantity -= item.quantity
        
        # Calculate totals
        item_total = product.price * item.quantity
        total_amount += item_total

        # Prepare OrderItem
        db_order_item = models.OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            price_at_purchase=product.price
        )
        order_items_to_create.append(db_order_item)

    # 3. Create the parent Order (Defaults to PENDING)
    db_order = models.Order(
        customer_id=order_in.customer_id,
        total_amount=total_amount,
        status="PENDING"
    )
    db.add(db_order)
    db.flush()  # Generates the db_order.id

    # 4. Associate and save the items
    for item in order_items_to_create:
        item.order_id = db_order.id
        db.add(item)

    db.commit()
    db.refresh(db_order)
    return db_order

def update_order_status(db: Session, order_id: int, new_status: str) -> models.Order:
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
        
    old_status = db_order.status
    
    # Capitalize just in case
    status_formatted = new_status.upper()
    
    # Trigger stock restoration if cancelled (and wasn't cancelled already)
    if status_formatted == "CANCELLED" and old_status != "CANCELLED":
        for item in db_order.items:
            product = get_product(db, item.product_id)
            if product:
                product.quantity += item.quantity
                
    # If restoring back from CANCELLED to PENDING/PROCESSING/SHIPPED/DELIVERED:
    # (A professional check: re-deduct the stock if possible, otherwise block it if insufficient)
    elif old_status == "CANCELLED" and status_formatted != "CANCELLED":
        # Check stock first
        for item in db_order.items:
            product = get_product(db, item.product_id)
            if product and product.quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot reinstate order. Product '{product.name}' has insufficient stock. Available: {product.quantity}, Needs: {item.quantity}"
                )
        # Deduct stock
        for item in db_order.items:
            product = get_product(db, item.product_id)
            if product:
                product.quantity -= item.quantity
                
    db_order.status = status_formatted
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int) -> bool:
    """
    Cancelling/Deleting an order. 
    Return stock to products if the order is not already cancelled.
    """
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Return stock if the order status wasn't CANCELLED (as CANCELLED already returned it)
    if db_order.status != "CANCELLED":
        for item in db_order.items:
            product = get_product(db, item.product_id)
            if product:
                product.quantity += item.quantity
            
    db.delete(db_order)
    db.commit()
    return True

# ==================== DASHBOARD CRUD ====================
def get_dashboard_stats(db: Session, low_stock_threshold: int = 5) -> schemas.DashboardStats:
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    low_stock_products = db.query(models.Product).filter(
        models.Product.quantity <= low_stock_threshold
    ).order_by(models.Product.quantity.asc()).all()
    
    return schemas.DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[schemas.ProductResponse.model_validate(p) for p in low_stock_products]
    )
