USE fagafarm;

INSERT INTO notifications (user_id, title, message, type, priority, created_at) VALUES
(NULL, 'Low Stock Alert', 'Eggs inventory is running low. Current stock: 45 units', 'inventory', 'high', NOW()),
(NULL, 'New Sale Recorded', 'Sale #1234 has been completed for MWK 250.00', 'sales', 'medium', NOW()),
(NULL, 'Batch Hatching Complete', 'Batch BATCH-20241201-0001 has completed hatching with 95% success rate', 'production', 'medium', NOW()),
(NULL, 'Health Check Reminder', 'Vaccinations are due for Batch BATCH-20241201-0002', 'health', 'low', NOW()),
(NULL, 'System Maintenance', 'Scheduled maintenance will occur tonight at 2 AM', 'system', 'low', NOW());
