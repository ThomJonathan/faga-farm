# FAGA Farm Management System - User Guide

## Overview

FAGA Farm Management System is a comprehensive production inventory management system designed specifically for poultry farms. It streamlines the entire production cycle from egg collection to sales with real-time data synchronization.

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0 or higher
- **MySQL**: Version 8.0 or higher
- **Browser**: Modern web browser (Chrome, Firefox, Safari, Edge)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space

### Recommended Requirements
- **Node.js**: Version 20.0+
- **MySQL**: Version 8.0+
- **RAM**: 8GB+
- **Storage**: 1GB+ free space

## Installation Guide

### Step 1: Install Prerequisites

#### Install Node.js
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version for your operating system
3. Run the installer and follow the setup wizard
4. Verify installation by opening terminal/command prompt and running:
   ```bash
   node --version
   npm --version
   ```

#### Install MySQL
1. Visit [mysql.com](https://dev.mysql.com/downloads/mysql/)
2. Download MySQL Community Server for your operating system
3. Run the installer and follow the setup wizard
4. Set root password to `1234` (or update `src/lib/db.js` if using different password)
5. Start MySQL service

### Step 2: Download and Setup the Application

1. **Clone or Download the Project**
   ```bash
   git clone <repository-url>
   cd faga-farm
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   - Start MySQL service
   - Create database named `fagafarm`
   - Run the database setup scripts:
     ```bash
     node create-tables.js
     node create-enhanced-tables.js
     node setup-notifications.js
     ```

4. **Configure Database Connection** (Optional)
   - Edit `src/lib/db.js` if you need to change database credentials
   - Default configuration:
     ```javascript
     host: 'localhost',
     user: 'root',
     password: '1234',
     database: 'fagafarm'
     ```

### Step 3: Start the Application

1. **Development Mode**
   ```bash
   npm run dev
   ```

2. **Production Mode**
   ```bash
   npm run build
   npm start
   ```

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`
   - You should see the FAGA Farm landing page

## User Registration and Login

### Creating Your First Account

1. **Access Signup Page**
   - Click "Get Started" on the landing page
   - Or navigate directly to `http://localhost:3000/signup`

2. **Fill Registration Form**
   - **Full Name**: Your complete name
   - **Username**: Choose a unique username (required)
   - **Email**: Optional contact email
   - **Phone**: Optional contact phone number
   - **Role**: Select your role (Farm Worker, Sales Person, Manager, Admin)
   - **Password**: Minimum 6 characters
   - **Confirm Password**: Re-enter password

3. **Submit Registration**
   - Click "Create Account"
   - You'll be redirected to login page with success message

### Logging In

1. **Access Login Page**
   - Navigate to `http://localhost:3000/login`

2. **Enter Credentials**
   - Username or Email
   - Password

3. **Sign In**
   - Click "Sign In"
   - You'll be redirected to your role-specific dashboard

## User Roles and Permissions

### Farm Worker
**Responsibilities:**
- Record daily egg collection
- Manage egg incubation
- Track vaccinations and treatments
- Record mortality data
- Monitor manure and meat production

**Access Areas:**
- Egg Collection Management
- Vaccination Management
- Treatment Management
- Batch Management
- House Management
- Incubator Management

### Sales Person
**Responsibilities:**
- Process customer orders
- Manage customer information
- Track sales transactions
- Monitor product availability

**Access Areas:**
- Order Management
- Customer Management
- Sales Management

### Manager
**Responsibilities:**
- Monitor real-time inventory
- Generate management reports
- Track performance metrics
- Manage product pricing
- Oversee user management

**Access Areas:**
- Inventory Management
- Reports Management
- Performance Management
- Product Price Management
- User Management

### Admin
**Responsibilities:**
- All manager responsibilities
- System administration
- User role management
- System configuration

## Using the Application

### Navigation

The application uses a dashboard layout with:
- **Top Navigation**: Search bar, notifications, user menu
- **Sidebar**: Role-specific menu items
- **Main Content**: Current page content

### Global Search

- Located in the top navigation bar
- Search across products, batches, customers, and orders
- Real-time results as you type
- Click on results to navigate to relevant pages

### Dashboard Overview

Each role has a customized dashboard showing:
- Key metrics and KPIs
- Recent activities
- Quick action buttons
- System notifications

## Farm Worker Operations

### Recording Egg Collection

1. Navigate to "Egg Collection" from sidebar
2. Click "Add New Collection"
3. Fill form:
   - Select Batch
   - Enter Collection Date
   - Enter Number of Eggs
   - Add Notes (optional)
4. Click "Save Collection"

### Managing Vaccinations

1. Navigate to "Vaccinations" from sidebar
2. View vaccination schedule
3. For new vaccination:
   - Click "Add Vaccination"
   - Select Batch
   - Choose Vaccine
   - Enter Dosage and Cost
   - Set Next Due Date
4. Click "Record Vaccination"

### Egg Incubation Management

1. Navigate to "Egg Incubation" from sidebar
2. Click "Start Incubation"
3. Select eggs from available batches
4. Set incubation parameters
5. Monitor hatch progress

## Sales Operations

### Processing Customer Orders

1. Navigate to "Orders" from sidebar
2. Click "Create New Order"
3. Select or add customer
4. Add products to order
5. Review total and confirm

### Managing Customers

1. Navigate to "Customers" from sidebar
2. Click "Add Customer"
3. Fill customer details
4. Save customer information

## Manager Operations

### Checking Inventory

1. Navigate to "Inventory" from sidebar
2. View real-time stock levels
3. Filter by product type, breed, or age
4. Monitor low stock alerts

### Generating Reports

1. Navigate to "Reports" from sidebar
2. Select report type:
   - Production Summary
   - Sales Analysis
   - Profit/Loss Report
3. Set date range
4. Generate and export reports

## Troubleshooting

### Common Issues

#### Application Won't Start
- **Issue**: Port 3000 already in use
- **Solution**: Kill process using port 3000 or change port in `package.json`

#### Database Connection Error
- **Issue**: Can't connect to MySQL
- **Solution**:
  - Ensure MySQL service is running
  - Check credentials in `src/lib/db.js`
  - Verify database `fagafarm` exists

#### Login Issues
- **Issue**: Can't log in with correct credentials
- **Solution**:
  - Check if user account exists in database
  - Verify password is correct
  - Check user role permissions

#### Page Not Loading
- **Issue**: Blank page or errors
- **Solution**:
  - Clear browser cache
  - Check browser console for errors
  - Restart development server

### Database Issues

#### Reset Database
If you need to reset the database:
```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS fagafarm; CREATE DATABASE fagafarm;"

# Run setup scripts
node create-tables.js
node create-enhanced-tables.js
node setup-notifications.js
```

#### Backup Database
```bash
mysqldump -u root -p fagafarm > backup.sql
```

#### Restore Database
```bash
mysql -u root -p fagafarm < backup.sql
```

## API Endpoints

The application provides REST API endpoints for integration:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Production Management
- `GET/POST /api/egg-collection` - Egg collection records
- `GET/POST /api/vaccinations` - Vaccination records
- `GET/POST /api/treatments` - Treatment records
- `GET/POST /api/mortality` - Mortality records

### Sales Management
- `GET/POST /api/orders` - Order management
- `GET/POST /api/customers` - Customer management
- `GET/POST /api/products` - Product management

### Inventory & Reports
- `GET /api/inventory/alerts` - Inventory alerts
- `GET /api/reports` - Generate reports
- `GET /api/performance` - Performance metrics

## Security Best Practices

1. **Password Security**
   - Use strong passwords (minimum 8 characters)
   - Include mix of letters, numbers, symbols
   - Change default passwords

2. **Database Security**
   - Don't use root user in production
   - Create dedicated database user
   - Regularly backup database

3. **Network Security**
   - Use HTTPS in production
   - Implement proper firewall rules
   - Keep software updated

## Support and Resources

### Getting Help
- Check this user guide first
- Review application logs in terminal
- Check browser developer console for errors

### Development Resources
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **React Documentation**: [react.dev](https://react.dev)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)
- **MySQL Documentation**: [dev.mysql.com/doc](https://dev.mysql.com/doc/)

### Contact Information
For technical support or questions about the FAGA Farm Management System, please contact your system administrator or development team.

---

**Version**: 1.0.0
**Last Updated**: December 2024
**System**: FAGA Farm Management System

---

*This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).*
