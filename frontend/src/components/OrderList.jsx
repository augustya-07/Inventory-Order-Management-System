import React, { useState } from 'react';

export default function OrderList({ orders, customers, products, onCreateOrder, onDeleteOrder }) {
  const [showCreateView, setShowCreateView] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // --- Create Order Form States ---
  const [customerId, setCustomerId] = useState('');
  // items: [{ product_id: '', quantity: 1, availableStock: 0, price: 0, name: '' }]
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, availableStock: 0, price: 0, name: '' }
  ]);

  // Handle Add Item Row
  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, availableStock: 0, price: 0, name: '' }]);
  };

  // Handle Remove Item Row
  const handleRemoveItemRow = (index) => {
    const items = [...orderItems];
    items.splice(index, 1);
    setOrderItems(items);
  };

  // Handle Item Product Change
  const handleItemProductChange = (index, prodId) => {
    const items = [...orderItems];
    const product = products.find(p => p.id === parseInt(prodId));

    if (product) {
      items[index] = {
        product_id: prodId,
        quantity: Math.min(items[index].quantity, product.quantity), // cap quantity by available stock
        availableStock: product.quantity,
        price: product.price,
        name: product.name
      };
    } else {
      items[index] = { product_id: '', quantity: 1, availableStock: 0, price: 0, name: '' };
    }
    setOrderItems(items);
  };

  // Handle Item Quantity Change
  const handleItemQuantityChange = (index, qty) => {
    const items = [...orderItems];
    const quantity = parseInt(qty) || 1;
    // Enforce limits
    const maxStock = items[index].availableStock;
    items[index].quantity = Math.max(1, Math.min(quantity, maxStock));
    setOrderItems(items);
  };

  // Calculate Running Total
  const runningTotal = orderItems.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  // Submit Order Creation
  const handleOrderSubmit = (e) => {
    e.preventDefault();
    if (!customerId) {
      alert("Please select a customer first.");
      return;
    }

    // Filter valid items
    const validItems = orderItems.filter(item => item.product_id !== '');
    if (validItems.length === 0) {
      alert("Please add at least one valid product to your order.");
      return;
    }

    // Structure request payload
    const payload = {
      customer_id: parseInt(customerId),
      items: validItems.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: item.quantity
      }))
    };

    onCreateOrder(payload);

    // Reset fields
    setCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1, availableStock: 0, price: 0, name: '' }]);
    setShowCreateView(false);
  };

  // Format date helper
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <header>
        <h1 className="header-title">Order Ledger</h1>
        <p className="header-subtitle">Invoice customers, track orders, audit purchase details, and manage cancellations.</p>
      </header>

      {/* View Toggle Bar */}
      <div className="view-top-bar" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setShowCreateView(!showCreateView)}>
          {showCreateView ? (
            <>
              <svg style={{width:'18px', height:'18px'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Order History
            </>
          ) : (
            <>
              <svg style={{width:'18px', height:'18px'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create New Order
            </>
          )}
        </button>
      </div>

      {/* ==================== CREATE NEW ORDER VIEW ==================== */}
      {showCreateView ? (
        <form onSubmit={handleOrderSubmit} className="order-creation-layout">
          {/* Builder Panel */}
          <div className="order-items-builder">
            <h3 className="section-title" style={{ marginBottom: '24px' }}>Draft Order Details</h3>
            
            {/* Customer Selector */}
            <div className="form-group">
              <label className="form-label">Select Customer</label>
              <select 
                className="form-input" 
                required 
                value={customerId} 
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '32px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Line Items</span>
              <button type="button" className="btn btn-secondary btn-small" onClick={handleAddItemRow}>
                + Add Item Row
              </button>
            </div>

            {/* Dynamic Items Rows */}
            {orderItems.map((item, idx) => (
              <div key={idx} className="builder-item-row">
                {/* Product Select */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Product</label>
                  <select 
                    className="form-input" 
                    required 
                    value={item.product_id}
                    onChange={(e) => handleItemProductChange(idx, e.target.value)}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map(p => (
                      <option 
                        key={p.id} 
                        value={p.id} 
                        disabled={p.quantity === 0}
                      >
                        {p.name} {p.quantity === 0 ? "(OUT OF STOCK)" : `($${p.price.toFixed(2)})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Input */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Qty {item.product_id && `(Max: ${item.availableStock})`}
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    disabled={!item.product_id}
                    max={item.availableStock || 1}
                    className="form-input"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                  />
                </div>

                {/* Remove button */}
                <button 
                  type="button" 
                  className="btn btn-danger btn-small" 
                  style={{ marginBottom: '2px', padding: '10px' }}
                  disabled={orderItems.length === 1}
                  onClick={() => handleRemoveItemRow(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Checkout/Summary Panel */}
          <div className="summary-panel">
            <div>
              <h3 className="summary-title">Order Checkout Summary</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orderItems.filter(item => item.product_id !== '').map((item, idx) => (
                  <div key={idx} className="summary-item">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.name} <span style={{ fontFamily: 'monospace' }}>x{item.quantity}</span>
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="summary-total">
                <span>Total Amount:</span>
                <span>${runningTotal.toFixed(2)}</span>
              </div>

              <div className="form-actions" style={{ marginTop: '24px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowCreateView(false);
                    setCustomerId('');
                    setOrderItems([{ product_id: '', quantity: 1, availableStock: 0, price: 0, name: '' }]);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* ==================== ORDER LIST HISTORY VIEW ==================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.length === 0 ? (
            <div className="dashboard-alert-section" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No orders have been recorded yet. Click "Create New Order" to start invoicing clients.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Date & Time</th>
                    <th>Items Ordered</th>
                    <th>Total Price</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isSelected = selectedOrderId === order.id;
                    const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <React.Fragment key={order.id}>
                        <tr>
                          <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{order.id}</td>
                          <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{formatDate(order.created_at)}</td>
                          <td>{itemsCount} items ({order.items.length} types)</td>
                          <td style={{ fontWeight: 800, color: 'var(--color-success)' }}>
                            ${order.total_amount.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary btn-small"
                                onClick={() => setSelectedOrderId(isSelected ? null : order.id)}
                              >
                                {isSelected ? 'Hide Details' : 'View Details'}
                              </button>
                              <button 
                                className="btn btn-danger btn-small"
                                onClick={() => {
                                  if (window.confirm(`Cancel Order #${order.id}? This will restore stock levels of all products in this order!`)) {
                                    onDeleteOrder(order.id);
                                  }
                                }}
                              >
                                Cancel Order
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Order Detail Drawer Row */}
                        {isSelected && (
                          <tr>
                            <td colSpan={6} style={{ backgroundColor: 'hsla(223, 47%, 8%, 0.4)', padding: '0 20px 20px 20px' }}>
                              <div className="order-details-drawer">
                                <h4 style={{ fontWeight: 700, marginBottom: '16px', borderBottom: '1px dashed var(--card-border)', paddingBottom: '8px' }}>
                                  Detailed Invoice Breakdown - Order #{order.id}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                  {order.items.map((item, idx) => (
                                    <div 
                                      key={idx} 
                                      style={{
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--card-border)',
                                        borderRadius: '8px',
                                        padding: '16px'
                                      }}
                                    >
                                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px' }}>
                                        {item.product_name}
                                      </div>
                                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                          <span>Quantity:</span>
                                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.quantity} units</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                          <span>Unit Price:</span>
                                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${item.price_at_purchase.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--card-border)', paddingTop: '6px', marginTop: '6px' }}>
                                          <span>Subtotal:</span>
                                          <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                                            ${(item.price_at_purchase * item.quantity).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
