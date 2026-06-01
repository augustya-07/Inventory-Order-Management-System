from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional
from datetime import datetime

# ==================== USER & AUTH SCHEMAS ====================
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    username: str

# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=3, max_length=50)
    price: float = Field(..., gt=0, description="Product price must be greater than zero")
    quantity: int = Field(..., ge=0, description="Quantity in stock cannot be negative")

    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v: str) -> str:
        # Standardize SKU to uppercase and strip whitespace
        sku = v.strip().upper()
        if not sku.isalnum() and '-' not in sku and '_' not in sku:
            raise ValueError("SKU can only contain alphanumeric characters, dashes (-), or underscores (_)")
        return sku

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=3, max_length=50)
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==================== CUSTOMER SCHEMAS ====================
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ==================== ORDER SCHEMAS ====================
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity ordered must be greater than zero")

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    price_at_purchase: float

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least one product item")

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="Must be one of PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        status_upper = v.strip().upper()
        valid_statuses = {"PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"}
        if status_upper not in valid_statuses:
            raise ValueError(f"Invalid status value. Must be one of: {', '.join(valid_statuses)}")
        return status_upper

# ==================== DASHBOARD SCHEMAS ====================
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductResponse]
