import React, { useState } from 'react';

export default function CustomerList({ customers, onAddCustomer, onDeleteCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Handle Add Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onAddCustomer({
      name,
      email,
      phone: phone.trim() || null
    });

    // Reset Form
    setName('');
    setEmail('');
    setPhone('');
    setShowAddModal(false);
  };

  // Filtered Customers
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <header>
        <h1 className="header-title">Customer Registry</h1>
        <p className="header-subtitle">Manage client accounts, contact information, and record references.</p>
      </header>

      {/* Top Search & Add Bar */}
      <div className="view-top-bar">
        <div className="search-input-wrapper">
          <input 
            type="text" 
            placeholder="Search by client name or email..." 
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <svg style={{width:'18px', height:'18px'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.3 20c-2.216 0-4.334-.582-6.2-1.648z" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="dashboard-alert-section" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          No customers found matching "{searchTerm}".
        </div>
      ) : (
        <div className="card-grid">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="entity-card">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent-glow)',
                    border: '1px solid hsla(263, 90%, 66%, 0.3)',
                    color: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="card-title" style={{ marginBottom: '2px' }}>{customer.name}</h3>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      ID: #{customer.id}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', width: '50px' }}>Email:</span>
                    <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{customer.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', width: '50px' }}>Phone:</span>
                    <span>{customer.phone || 'Not Specified'}</span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn btn-danger btn-small" onClick={() => {
                  if (window.confirm(`Are you sure you want to delete customer ${customer.name}? This will also delete all their orders!`)) {
                    onDeleteCustomer(customer.id);
                  }
                }}>
                  Delete Customer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== ADD CUSTOMER MODAL ==================== */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Register New Customer</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  required 
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="+1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
