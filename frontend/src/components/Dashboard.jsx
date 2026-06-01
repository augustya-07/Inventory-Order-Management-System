import React from 'react';

export default function Dashboard({ stats, onViewChange }) {
  const lowStockCount = stats?.low_stock_products?.length || 0;

  const cardItems = [
    {
      title: "Total Products",
      value: stats?.total_products ?? 0,
      color: "var(--color-info)",
      glow: "hsla(199, 89%, 48%, 0.15)",
      view: "products",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      )
    },
    {
      title: "Total Customers",
      value: stats?.total_customers ?? 0,
      color: "var(--color-accent)",
      glow: "hsla(263, 90%, 66%, 0.15)",
      view: "customers",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20c-2.207 0-4.3-.629-6.09-1.73v-.109a4.125 4.125 0 017.478-2.492 4.125 4.125 0 017.478 2.492zm-.08-.109a3.07 3.07 0 01-4.832 0M19.5 9.75a3 3 0 11-6 0 3 3 0 016 0zM12 7.5a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: "Total Orders",
      value: stats?.total_orders ?? 0,
      color: "var(--color-success)",
      glow: "hsla(160, 84%, 39%, 0.15)",
      view: "orders",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      )
    },
    {
      title: "Low Stock Alert",
      value: lowStockCount,
      color: lowStockCount > 0 ? "var(--color-danger)" : "var(--color-success)",
      glow: lowStockCount > 0 ? "hsla(350, 89%, 60%, 0.15)" : "hsla(160, 84%, 39%, 0.15)",
      view: "products",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )
    }
  ];

  return (
    <div>
      <header>
        <h1 className="header-title">Dashboard Overview</h1>
        <p className="header-subtitle">Real-time inventory levels, customer database size, and sales telemetry.</p>
      </header>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        {cardItems.map((item, idx) => (
          <div 
            key={idx} 
            className="stat-card" 
            style={{ 
              '--stat-color': item.color, 
              '--stat-color-glow': item.glow,
              'cursor': 'pointer'
            }}
            onClick={() => onViewChange(item.view)}
          >
            <div className="stat-header">
              <span>{item.title}</span>
              <span className="stat-icon">{item.icon}</span>
            </div>
            <div className="stat-value">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Warning Section */}
      <div className="dashboard-alert-section">
        <div className="section-header">
          <h2 className="section-title">
            <span>Low Stock Alert Center</span>
            {lowStockCount > 0 && <span className="badge-count">{lowStockCount} Products</span>}
          </h2>
          <button className="btn btn-secondary btn-small" onClick={() => onViewChange('products')}>
            Manage Inventory
          </button>
        </div>

        {lowStockCount === 0 ? (
          <div style={{ color: 'var(--color-success)', fontWeight: 500, padding: '8px 0' }}>
            ✓ All inventory levels are optimal. No low-stock items detected.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU Code</th>
                  <th>Current Stock</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.name}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{product.sku}</td>
                    <td style={{ fontWeight: 700 }}>{product.quantity} units</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>
                      <span className={`stock-indicator ${product.quantity === 0 ? 'out-of-stock' : 'low-stock'}`}>
                        <span style={{ 
                          display: 'inline-block', 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: product.quantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)'
                        }} />
                        {product.quantity === 0 ? 'Out of Stock' : 'Critical Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Professional Dashboard Quick Action Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="entity-card">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--color-accent)' }}>⚡</span>
              Create an Order instantly
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px', lineHeight: 1.6 }}>
              Quickly draft a new invoice for any client. Real-time inventory checking ensures you never double-sell out-of-stock products, automatically reducing stock levels upon successful completion.
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '24px', width: '100%' }}
            onClick={() => onViewChange('orders')}
          >
            Go to Orders Panel
          </button>
        </div>

        <div className="entity-card">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--color-info)' }}>📦</span>
              Restock & Manage Products
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px', lineHeight: 1.6 }}>
              Define new catalog listings, update product descriptions, alter pricing, or adjust quantities. Unique SKUs are strictly enforced on database levels to preserve catalog integrity.
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: '24px', width: '100%' }}
            onClick={() => onViewChange('products')}
          >
            Open Catalog Listings
          </button>
        </div>
      </div>
    </div>
  );
}
