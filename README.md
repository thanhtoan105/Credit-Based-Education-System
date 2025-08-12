# Credit-Based Education System (QLDSV_TC)

<div align="center">
  <h3>🎓 Comprehensive Student Management System for Vietnamese Educational Institutions</h3>
  <p>A modern, full-stack Next.js application for managing credit-based education programs</p>
  
  ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
  ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![Microsoft SQL Server](https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoft%20sql%20server&logoColor=white)
</div>

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Authentication](#authentication)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

QLDSV_TC (Quản Lý Đào Tạo Sinh Viên - Trường Cao đẳng) is a comprehensive **Student Management System** designed specifically for Vietnamese colleges and universities implementing credit-based education programs. The system provides a complete solution for managing students, courses, departments, grades, and administrative tasks.

### Key Highlights
- ✅ **Multi-tenant Architecture**: Support for multiple departments with separate database connections
- ✅ **Role-based Access Control**: Different permission levels for students, faculty, and administrators
- ✅ **Credit-based System**: Full support for credit hour management and course registration
- ✅ **Modern UI/UX**: Built with Next.js 14+ and shadcn/ui for exceptional user experience
- ✅ **Vietnamese Localization**: Designed specifically for Vietnamese educational institutions

## ✨ Features

### 🎓 Academic Management
- **Student Information System**: Complete student profile management
- **Course Registration**: Credit-based course enrollment and scheduling
- **Credit Classes**: Manage credit courses with prerequisites and scheduling
- **Subject Catalog**: Comprehensive course and subject management
- **Grade Management**: Track and manage student academic performance
- **Academic Reports**: Generate detailed academic performance reports

### 🏛️ Administrative Tools
- **Department Management**: Organize academic departments and faculty
- **Multi-database Support**: Department-specific database connections
- **User Management**: Role-based user accounts and permissions
- **Tuition Management**: Financial tracking and payment processing
- **System Settings**: Configurable system parameters

### 📊 Dashboard & Analytics
- **Interactive Dashboard**: Real-time overview of academic activities
- **Activity Charts**: Visual representation of student and course data
- **Statistics Cards**: Key performance indicators and metrics
- **Calendar Integration**: Academic calendar and scheduling
- **Recent Activities**: Quick access to recent courses and activities

### 🔐 Security & Authentication
- **Multi-database Authentication**: Secure login across different departments
- **Role-based Permissions**: Granular access control (Student, Faculty, Admin)
- **Session Management**: Secure session handling and timeout
- **Protected Routes**: Route-level authentication and authorization

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: Microsoft SQL Server
- **Database Driver**: mssql (node-mssql)
- **Authentication**: Custom role-based authentication

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **CSS Processing**: PostCSS + Tailwind
- **Build Tool**: Next.js built-in bundler

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Microsoft SQL Server
- Git

### Clone the Repository
```bash
git clone https://github.com/thanhtoan105/Credit-Based-Education-System.git
cd Credit-Based-Education-System
```

### Install Dependencies
```bash
npm install
# or
yarn install
```

### Environment Setup
Create a `.env.local` file in the root directory:
```env
# Database Configuration
DB_SERVER=your_sql_server
DB_DATABASE=QLDSV_TC
DB_USER=your_username
DB_PASSWORD=your_password

# Application Settings
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup
1. Create a SQL Server database named `QLDSV_TC`
2. Run the provided SQL setup scripts
3. Configure department-specific databases if needed

### Start Development Server
```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## ⚙️ Configuration

### Database Configuration
The system uses a multi-database architecture configured in `lib/db-config.ts`:

```typescript
const dbConfig = {
  server: 'MSI',
  database: 'QLDSV_TC',
  user: 'sa',
  password: '123456',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
}
```

### Department Server Mapping
Configure department-specific databases in `lib/multi-database.ts`:
```typescript
const DEPARTMENT_SERVER_MAP = {
  'Department1': 'Server1',
  'Department2': 'Server2',
  // Add more mappings as needed
}
```

## 📖 Usage

### Authentication
1. Navigate to the login page
2. Select your department from the dropdown
3. Enter your username and password
4. System will authenticate based on your role and department

### User Roles
- **SV (Student)**: Access to personal academic information
- **PGV (Academic Office)**: Faculty-specific administrative access
- **Admin**: Full system access and configuration
- **Custom Roles**: Department-specific permissions

### Dashboard Navigation
- **Dashboard**: Overview and quick stats
- **Students**: Student management and records
- **Classes**: Class scheduling and management
- **Subjects**: Course catalog and curriculum
- **Departments**: Department administration
- **Reports**: Academic and administrative reports
- **Settings**: User and system configuration

## 🔐 Authentication

The system implements a sophisticated multi-database authentication system:

### Authentication Flow
1. **User Login**: Username, password, and department selection
2. **Database Validation**: Credentials validated against department database
3. **Session Creation**: Secure session stored client-side
4. **Role Assignment**: Permissions based on user role and department
5. **Route Protection**: Automatic redirects for unauthorized access

### Security Features
- Input validation and sanitization
- SQL injection protection
- Role-based data partitioning
- Session timeout handling
- Secure password handling

## 📁 Project Structure

```
QLDSV_TC/
├── app/                     # Next.js App Router
│   ├── api/                # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── departments/    # Department management API
│   │   ├── students/       # Student management API
│   │   └── ...
│   ├── dashboard/          # Main application pages
│   │   ├── students/       # Student management UI
│   │   ├── classes/        # Class management UI
│   │   ├── reports/        # Report generation UI
│   │   └── ...
│   └── globals.css         # Global styles
├── components/             # Reusable React components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard widgets
│   ├── layout/            # Layout components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Business logic and utilities
│   ├── auth.ts           # Authentication logic
│   ├── db-config.ts      # Database configuration
│   ├── multi-database.ts # Multi-database manager
│   ├── services/         # Data access layer
│   └── types/            # TypeScript definitions
├── package.json          # Dependencies and scripts
├── tailwind.config.ts    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

## 🤝 Contributing

We welcome contributions to improve the QLDSV_TC system! Here's how to get started:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the code style guidelines
4. Test your changes thoroughly
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

### Code Style Guidelines
- Use TypeScript for all new code
- Follow the existing code formatting (Prettier/ESLint)
- Use functional components with hooks
- Implement proper error handling
- Add JSDoc comments for complex functions
- Write unit tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ for Vietnamese Educational Institutions</p>
  <p>© 2025 ThanhToan. All rights reserved.</p>
</div>