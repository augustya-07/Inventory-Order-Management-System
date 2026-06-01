import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import CustomerList from './components/CustomerList';
import OrderList from './components/OrderList';
import LoginScreen from './components/LoginScreen';

// Read API URL from Vite environment variables, fallback to local standard
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('flowstock_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('flowstock_theme') || 'dark');

  // Sync theme with body classes
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('flowstock_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [currentView, setCurrentView] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: []
  });

  // Notification Banner State
  const [notification, setNotification] = useState(null);

  // Trigger Toast Alert
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch all databases from Python FastAPI
  const fetchData = async () => {
    if (!currentUser) return; // Prevent call if unauthorized
    try {
      // Parallel fetches for high performance
      const [resProducts, resCustomers, resOrders, resStats] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/customers`),
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/dashboard/stats`)
      ]);

      if (resProducts.ok) setProducts(await resProducts.json());
      if (resCustomers.ok) setCustomers(await resCustomers.json());
      if (resOrders.ok) setOrders(await resOrders.json());
      if (resStats.ok) setStats(await resStats.json());
    } catch (err) {
      console.error("Error communicating with backend:", err);
      showToast("Cannot connect to the backend server. Make sure the container/API is running.", "error");
    }
  };

  // Fetch initial data on load or user change
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  // ==================== AUTHENTICATION ACTIONS ====================
  const handleLoginSuccess = (userProfile) => {
    localStorage.setItem('flowstock_session', JSON.stringify(userProfile));
    setCurrentUser(userProfile);
    showToast(`Access Granted. Welcome back, ${userProfile.username}!`, 'success');
  };

  const handleSignOut = () => {
    localStorage.removeItem('flowstock_session');
    setCurrentUser(null);
    setCurrentView('dashboard');
    showToast("Terminal session closed successfully.", 'success');
  };

  // ==================== PRODUCT ACTIONS ====================
  const handleAddProduct = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to create product");
      }
      
      showToast(`Product "${payload.name}" successfully created!`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateProduct = async (id, payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to update product");
      }

      showToast(`Product updated successfully!`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete product");
      }
      showToast("Product deleted successfully.", 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== CUSTOMER ACTIONS ====================
  const handleAddCustomer = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to register customer");
      }

      showToast(`Customer "${payload.name}" successfully registered!`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCustomer = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete customer");
      }
      showToast("Customer profile deleted successfully.", 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ==================== ORDER ACTIONS ====================
  const handleCreateOrder = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to submit order");
      }

      showToast(`Invoice successfully created! Total: $${data.total_amount.toFixed(2)}`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to update order tracking status");
      }

      showToast(`Order #${id} status updated to ${newStatus}!`, 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteOrder = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to cancel order");
      }
      showToast("Order cancelled successfully, stock levels restored.", 'success');
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Route guarding interceptor
  if (!currentUser) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {notification && (
          <div className={`notification ${notification.type}`}>
            <span style={{ fontSize: '1.2rem' }}>
              {notification.type === 'success' ? '✓' : '⚠️'}
            </span>
            <span>{notification.message}</span>
          </div>
        )}
        
        {/* Curved Theme Toggle Button */}
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91l1.59 1.59M3 12h2.25m13.5 0H21m-16.05 4.95l1.59-1.59m10.91-10.91l1.59-1.59M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        <LoginScreen API_BASE_URL={API_BASE_URL} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Render View helper
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard stats={stats} onViewChange={setCurrentView} />;
      case 'products':
        return (
          <ProductList 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'customers':
        return (
          <CustomerList 
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case 'orders':
        return (
          <OrderList 
            orders={orders}
            customers={customers}
            products={products}
            onCreateOrder={handleCreateOrder}
            onDeleteOrder={handleDeleteOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        );
      default:
        return <Dashboard stats={stats} onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span style={{ fontSize: '1.2rem' }}>
            {notification.type === 'success' ? '✓' : '⚠️'}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Curved Theme Toggle Button */}
      <button 
        className="theme-toggle-btn" 
        onClick={toggleTheme} 
        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {theme === 'dark' ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91l1.59 1.59M3 12h2.25m13.5 0H21m-16.05 4.95l1.59-1.59m10.91-10.91l1.59-1.59M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>

      {/* Navigation Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <svg className="logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="logo-text">FlowStock</span>
        </div>

        <ul className="nav-links" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <li 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Dashboard
          </li>
          <li 
            className={`nav-item ${currentView === 'products' ? 'active' : ''}`}
            onClick={() => setCurrentView('products')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </li>
          <li 
            className={`nav-item ${currentView === 'customers' ? 'active' : ''}`}
            onClick={() => setCurrentView('customers')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H7v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Customers
          </li>
          <li 
            className={`nav-item ${currentView === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentView('orders')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Orders
          </li>

          {/* Active User Branding (Sidebar Details) */}
          <div style={{
            marginTop: 'auto',
            padding: '16px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--border-radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#fff'
            }}>
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.username}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 500 }}>
                • Connected
              </div>
            </div>
          </div>

          {/* Exit Terminal Session (Sign Out) */}
          <li 
            className="nav-item" 
            style={{ 
              color: 'var(--color-danger)', 
              borderColor: 'transparent',
              fontWeight: 600
            }}
            onClick={handleSignOut}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </li>
        </ul>
      </aside>

      {/* Main Screen */}
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}
