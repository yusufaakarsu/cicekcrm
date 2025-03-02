-- Kasa açılış bakiyesi için transaction kaydı
INSERT INTO transactions (
    account_id,        
    category_id,       
    type,             
    amount,           
    date,            
    related_type,     
    related_id,       
    payment_method,   
    description,      
    status,          
    created_by       
) VALUES (
    1,                                  
    1,                                 
    'in',                              
    100000.00,                          
    datetime('now'),                
    'opening_balance',               
    0,                              
    'cash',                         
    'Kasa açılış bakiyesi',          
    'paid',                           
    1                                
);
