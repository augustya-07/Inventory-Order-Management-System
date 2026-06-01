from sqlalchemy.orm import Session
from . import models

def seed_data(db: Session):
    """
    Seed initial beautiful data if the database is empty.
    Creates sample products (including low-stock products) and customers.
    """
    # 1. Seed Products
    if db.query(models.Product).count() == 0:
        print("Seeding initial products...")
        sample_products = [
            models.Product(name="MacBook Pro 16\"", sku="LAP-MBP-16", price=2499.99, quantity=12),
            models.Product(name="Sony WH-1000XM5 Headphones", sku="AUD-SONY-XM5", price=399.99, quantity=25),
            models.Product(name="Keychron Q1 Mechanical Keyboard", sku="KEY-KCH-Q1", price=189.50, quantity=4), # Low Stock!
            models.Product(name="Dell UltraSharp 32\" 4K Monitor", sku="MON-DELL-U32", price=699.99, quantity=8),
            models.Product(name="Logitech MX Master 3S Mouse", sku="MOU-LOG-MX3", price=99.99, quantity=3),    # Low Stock!
            models.Product(name="Elgato Stream Deck MK.2", sku="ACC-ELG-SD2", price=149.99, quantity=15),
        ]
        db.add_all(sample_products)
        db.commit()

    # 2. Seed Customers
    if db.query(models.Customer).count() == 0:
        print("Seeding initial customers...")
        sample_customers = [
            models.Customer(name="John Doe", email="john.doe@example.com", phone="+1-555-0199"),
            models.Customer(name="Jane Smith", email="jane.smith@example.com", phone="+1-555-0142"),
            models.Customer(name="Alice Johnson", email="alice.j@example.com", phone="+1-555-0177"),
        ]
        db.add_all(sample_customers)
        db.commit()

    print("Database seeding completed.")
