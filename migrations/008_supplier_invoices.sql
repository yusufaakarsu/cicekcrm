-- Tedarikçi faturaları tablosu
CREATE TABLE supplier_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,               
    invoice_number TEXT,                        
    invoice_date DATE NOT NULL,                 
    due_date DATE NOT NULL,                     
    amount DECIMAL(10,2) NOT NULL,              
    payment_status TEXT CHECK(payment_status IN ('pending','partial','paid')) DEFAULT 'pending',
    payment_method TEXT,                        
    account_id INTEGER,                         
    notes TEXT,                                 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,                         
    is_deleted BOOLEAN DEFAULT 0,               
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Fatura detayları tablosu
CREATE TABLE supplier_invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_invoice_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,                
    quantity DECIMAL(10,2) NOT NULL,            
    unit_price DECIMAL(10,2) NOT NULL,          
    total_price DECIMAL(10,2) NOT NULL,         
    FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);