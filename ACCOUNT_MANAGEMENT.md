# Account Management & Login Credentials

## Current Working Accounts

All accounts are seeded automatically when you run `npm run seed` in the backend directory. Here are the four default accounts:

| Role | Email | Username | Password | Employee ID |
|------|-------|----------|----------|------------|
| **Super Admin** | admin@hrdesk.com | admin | Admin1234 | EMP-0001 |
| **HR Manager** | hr@hrdesk.com | hrmanager | Admin1234 | EMP-0002 |
| **Manager (HOD)** | manager@hrdesk.com | teammanager | Admin1234 | EMP-0003 |
| **Employee** | employee@hrdesk.com | johndoe | Admin1234 | EMP-0004 |

### Account Details

#### 1. Super Admin
- **Name:** System Admin
- **Email:** admin@hrdesk.com0000001
- **Department:** Human Resources
- **Position:** System Administrator
- **Basic Salary:** ₦500,000
- **Status:** Active, No first-login setup required

#### 2. HR Manager
- **Name:** Amaka Okonkwo
- **Email:** hr@hrdesk.com
- **Phone:** 08000000002
- **Department:** Human Resources
- **Position:** HR Manager
- **Basic Salary:** ₦450,000
- **Status:** Active, No first-login setup required

#### 3. Manager (Engineering)
- **Name:** Emeka Nwosu
- **Email:** manager@hrdesk.com
- **Phone:** 08000000003
- **Department:** Engineering
- **Position:** Engineering Manager
- **Basic Salary:** ₦600,000
- **Status:** Active, No first-login setup required

#### 4. Employee (Junior Developer)
- **Name:** John Doe
- **Email:** employee@hrdesk.com
- **Phone:** 08000000004
- **Department:** Engineering
- **Position:** Software Engineer
- **Basic Salary:** ₦350,000
- **Status:** Active, No first-login setup required

---

## How to Create a New Account

### 1. **Via API (Backend)**

#### Option A: Create User via Admin Interface (Recommended)
The HR Manager or Super Admin can create new accounts through the HR Dashboard:

1. Navigate to **HR → Settings** or **Admin → User Management** (when available)
2. Click **Add New Account**
3. Fill in required fields:
   - Email (required, unique)
   - Phone (required)
   - Username (optional)
   - Role (super_admin, hr_manager, manager, or employee)
4. System generates temporary password (user's phone number)
5. User performs first-login setup to create custom username & password

#### Option B: Direct Database Seeding
Add new user to `backend/src/seed.ts`:

```typescript
const newUser = await User.create({
  email: 'newuser@company.com',
  phone: '08012345678',
  username: 'newusername',  // optional
  passwordHash: 'TempPassword123',  // plain text — auto-hashed on save
  role: 'employee',  // or 'manager', 'hr_manager', 'super_admin'
  isFirstLogin: true,  // forces first-login setup
  active: true,
  company: company._id,
});

const newEmployee = await Employee.create({
  userId: newUser._id,
  employeeId: 'EMP-0005',
  firstName: 'John',
  lastName: 'Smith',
  email: 'newuser@company.com',
  phone: '08012345678',
  department: engDept._id,
  position: 'Software Engineer',
  // ... other required fields
});

newUser.employeeId = newEmployee._id;
await newUser.save({ validateBeforeSave: false });
```

Run seed:
```bash
cd backend
npm run seed
```

### 2. **Login Flow**

#### First-Time Login
1. User logs in with email and password (phone number)
2. System detects `isFirstLogin: true`
3. User redirected to **FirstLoginSetup** page
4. User sets custom username and password (min 8 characters)
5. User completes setup → account ready for normal use

#### Subsequent Logins
```bash
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "admin@hrdesk.com",  // or username
  "password": "Admin1234"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "isFirstLogin": false,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@hrdesk.com",
    "role": "super_admin",
    "username": "admin",
    "avatar": null
  }
}
```

### 3. **User Schema & Fields**

```typescript
interface IUser {
  email: string;              // Required, unique, lowercase
  phone: string;              // Required
  username: string;           // Optional, unique
  passwordHash: string;       // Bcrypt hashed, min 8 chars
  role: UserRole;             // 'super_admin' | 'hr_manager' | 'manager' | 'employee'
  employeeId?: ObjectId;      // Reference to Employee record
  company?: ObjectId;         // Reference to Company
  isFirstLogin: boolean;      // Forces FirstLoginSetup page
  refreshToken?: string;      // JWT refresh token
  active: boolean;            // Enable/disable account
  avatar?: string;            // Profile image URL
  timestamps: CreatedAt, UpdatedAt
}
```

---

## Password & Security

### Password Requirements
- **Minimum length:** 8 characters
- **First-time password:** User's phone number (e.g., `08000000001`)
- **Custom password:** Set during first-login setup
- **Hashing:** Bcrypt with 12 rounds (automatic via pre-save hook)

### Password Reset
Currently not implemented. To reset a user's password:

1. **Via Database:**
```bash
# Connect to MongoDB
use hrdesk
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { passwordHash: "NewPassword123", isFirstLogin: true } }
)
```

2. **Via Seed Reset:**
Re-run `npm run seed` to reset all accounts to default state

### Token Management
- **Access Token:** 15 minutes (JWT_ACCESS_EXPIRY)
- **Refresh Token:** 7 days (JWT_REFRESH_EXPIRY)
- **Refresh endpoint:** `POST /api/auth/refresh`
- **Logout endpoint:** `POST /api/auth/logout`

---

## Role-Based Access Control

### Super Admin
- Full system access
- Create/manage users
- Configure system settings
- Access all HR functions
- View all reports

### HR Manager
- Employee management
- Payroll configuration
- Leave approvals
- Recruitment management
- Generate reports

### Manager (Department HOD)
- Team management
- Team member leave approvals
- Attendance tracking
- Task assignment
- Team performance view

### Employee
- View personal dashboard
- Request leave
- View payslips
- Track attendance
- Apply for loans/advances
- View documents

---

## Environment Configuration

### Backend `.env` (MongoDB & JWT)
```env
MONGO_URI=mongodb://localhost:27017/hrdesk
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Frontend `.env` (API Connection)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the System

### 1. Start MongoDB
```bash
mongod
```

### 2. Seed Initial Data
```bash
cd backend
npm run seed
```

### 3. Start Backend
```bash
cd backend
npm run dev
```

Server runs on `http://localhost:5000`

### 4. Start Frontend
```bash
cd frontend
npm run dev
```

App runs on `http://localhost:5173`

---

## Troubleshooting

### Account Won't Login
1. Verify email/username exists: `db.users.findOne({ email: "user@example.com" })`
2. Check account is active: `active: true`
3. For first-login accounts, password is their phone number
4. Ensure JWT secrets match in `.env`

### First-Login Stuck
1. Clear browser cookies/localStorage
2. Check `isFirstLogin: true` in database
3. Verify FirstLoginSetup page exists in frontend

### Reset All Accounts
```bash
cd backend
npm run seed  # Resets all data to defaults
```

### User Not Appearing in Lists
1. Verify `company` field is set
2. Check `active: true` status
3. Ensure Employee record exists and links to User

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/auth/login` | Login with email/username | No |
| POST | `/api/auth/setup` | First-login setup | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout | Yes |

---

## Future Enhancements

- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, Microsoft)
- [ ] User invitation system
- [ ] Account deactivation workflow
- [ ] Login activity audit log
