import React, { useState } from 'react';

export default function ProductList({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  // Handle Edit Click
  const handleEditClick = (product) => {
    setCurrentProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setShowEditModal(true);
  };

  // Handle Add Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !price || !quantity) return;

    onAddProduct({
      name,
      sku: sku.toUpperCase(),
      price: parseFloat(price),
      quantity: parseInt(quantity)
    });

    // Reset Form
    setName('');
    setSku('');
    setPrice('');
    setQuantity('');
    setShowAddModal(false);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !price || !quantity || !currentProduct) return;

    onUpdateProduct(currentProduct.id, {
      name,
      sku: sku.toUpperCase(),
      price: parseFloat(price),
      quantity: parseInt(quantity)
    });

    setShowEditModal(false);
    setCurrentProduct(null);
  };

  // Filtered Products
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <header>
        <h1 className="header-title">Product Catalog</h1>
        <p className="header-subtitle">Add, update, search, and manage products and inventory levels.</p>
      </header>

      {/* Top Search & Add Bar */}
      <div className="view-top-bar">
        <div className="search-input-wrapper">
          <input 
            type="text" 
            placeholder="Search by product name or SKU..." 
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg style={{width:'18px', height:'18px'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="dashboard-alert-section" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          No products found matching "{searchTerm}".
        </div>
      ) : (
        <div className="card-grid">
          {filteredProducts.map((product) => {
            const isLowStock = product.quantity <= 5;
            const isOutOfStock = product.quantity === 0;
            
            return (
              <div key={product.id} className="entity-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className="card-title">{product.name}</h3>
                    <span className={`stock-indicator ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                      {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                  <div className="card-subtitle">{product.sku}</div>
                  
                  <div style={{ marginTop: '16px' }}>
                    <div className="card-info-row">
                      <span className="card-info-label">Price per unit</span>
                      <span className="card-info-value" style={{ color: 'var(--color-success)' }}>
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="card-info-row">
                      <span className="card-info-label">Stock available</span>
                      <span className="card-info-value" style={{ color: isOutOfStock ? 'var(--color-danger)' : isLowStock ? 'var(--color-warning)' : 'inherit' }}>
                        {product.quantity} units
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn btn-secondary btn-small" onClick={() => handleEditClick(product)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                      onDeleteProduct(product.id);
                    }
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== ADD PRODUCT MODAL ==================== */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add New Product</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="e.g. Sony Wireless Earbuds"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="e.g. AUD-SONY-W3"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    className="form-input" 
                    required 
                    placeholder="299.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Quantity</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-input" 
                    required 
                    placeholder="10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT PRODUCT MODAL ==================== */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Product Details</h3>
              <button className="close-btn" onClick={() => {
                setShowEditModal(false);
                setCurrentProduct(null);
              }}>×</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Unit Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    className="form-input" 
                    required 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">In-Stock Quantity</label>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-input" 
                    required 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowEditModal(false);
                  setCurrentProduct(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
