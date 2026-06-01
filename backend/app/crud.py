from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional
from . import models, schemas

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

    # Map product_ids to check duplication within same order request
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

    # 3. Create the parent Order
    db_order = models.Order(
        customer_id=order_in.customer_id,
        total_amount=total_amount
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

def delete_order(db: Session, order_id: int) -> bool:
    """
    Cancelling/Deleting an order. 
    Professional requirement: Cancelling an order should return the stock back to products!
    """
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Return stock to products
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
