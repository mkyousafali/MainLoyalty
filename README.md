# Urban Market Loyalty System 🏪

A comprehensive loyalty management system with bilingual support (English/Arabic) for Urban Market stores.

## ✨ Features

- 🌍 **Multi-language Support** - Complete English/Arabic translations with RTL layout
- 🎯 **Customer Offers Management** - Visual offer cards with expiration tracking
- 👨‍💼 **Admin Dashboard** - Full CRUD operations for offers and branches
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🏪 **Branch Management** - Multi-location support with branch-specific offers
- 📁 **File Upload System** - Support for images and PDF attachments
- 🔐 **Secure Authentication** - Customer and admin access controls
- 💳 **Transaction Management** - Complete transaction tracking system

## 🚀 Live Demo

**Frontend**: [https://main-loyalty.vercel.app](https://main-loyalty.vercel.app)

## 🛠️ Tech Stack

- **Frontend**: SvelteKit, TailwindCSS, JavaScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **Languages**: English, Arabic (RTL support)

## 📁 Project Structure

```
MainLoyalty/
├── frontend/svelte/          # SvelteKit application
│   ├── src/routes/          # Page routes
│   ├── src/lib/             # Components and utilities
│   └── src/stores/          # State management
├── backend/go/              # Go backend (optional)
├── db/                      # Database schemas and migrations
└── uploads/                 # File storage
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### 1. Clone Repository
```bash
git clone https://github.com/mkyousafali/MainLoyalty.git
cd MainLoyalty
```

### 2. Install Dependencies
```bash
cd frontend/svelte
npm install
```

### 3. Environment Setup
Create `.env.local` in `frontend/svelte/`:
```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Run these SQL scripts in your Supabase SQL Editor:
1. Set up offers table and related schemas
2. Configure authentication and row-level security
3. Set up file storage buckets

### 5. Development
```bash
npm run dev
# Opens on http://localhost:5173
```

## 🎨 Key Pages

- **`/`** - Landing page with language selection
- **`/login`** - Customer/Admin authentication
- **`/my-offers`** - Customer offers display with filtering
- **`/admin`** - Admin dashboard
- **`/admin/offers-management`** - Offers CRUD operations
- **`/admin/create-offer`** - Create new offers
- **`/customer-support`** - Support and branch information

## 🌍 Internationalization

Full bilingual support with:
- **English** (LTR) - Default language
- **Arabic** (RTL) - Complete translation with right-to-left layout
- Dynamic language switching
- Persistent language preferences

## 🏗️ Deployment

### Vercel Deployment
1. Fork this repository
2. Connect to Vercel
3. Add environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automatically

### Database Migration
Execute SQL scripts in order:
1. Create tables and relationships
2. Set up authentication policies
3. Configure storage buckets
4. Insert sample data (optional)

## 🎯 Core Features Detail

### Admin Panel
- **Offers Management**: Create, edit, delete, view offers
- **Branch Management**: Multi-location support
- **File Upload**: Image and PDF support with preview
- **Analytics**: View offer performance and customer engagement

### Customer Experience
- **Offer Discovery**: Visual cards with search and filtering
- **Branch Selection**: Location-based offer filtering
- **Expired Offers**: Visual indicators for expired deals
- **Mobile Responsive**: Touch-friendly interface

### Security
- **Row Level Security**: Supabase RLS policies
- **Authentication**: Secure login system
- **Data Validation**: Input sanitization and validation
- **File Upload Security**: Secure file handling

## � Business Rules & Policies

### Point Redemption Rules
- **Branch-Specific Redemption**: Point redemption is only possible if the specific branch has enough points available. Customers cannot use combined points from all branches for redemption at a single location.
- **Branch Point Validation**: Each branch maintains its own point balance for customers. Redemption requests must be validated against the individual branch's available points, not the customer's total points across all branches.

## �🔄 Updates & Maintenance

- **Automated Deployments**: Every push to main branch
- **Database Migrations**: SQL scripts for schema updates
- **Version Control**: Semantic versioning
- **Error Monitoring**: Built-in error handling

## 📞 Support

For support and questions:
- **GitHub Issues**: [Create an issue](https://github.com/mkyousafali/MainLoyalty/issues)
- **Email**: Contact through GitHub profile

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- SvelteKit team for the amazing framework
- Supabase for the backend infrastructure
- TailwindCSS for the utility-first styling
- Vercel for seamless deployment

---

**Built with ❤️ by [MK Yousaf Ali](https://github.com/mkyousafali)**
