# Project Feature Overview

## 1. Project Summary

### Purpose of the App
This is an **EV Cost Calculator** web application that allows users to compare the cost of driving electric vehicles versus petrol vehicles. Users can input fuel prices, electricity prices, and vehicle consumption rates to calculate and compare costs per 100km.

### Tech Stack Used
- **Frontend**: React 18 with TypeScript, Vite as build tool
- **Styling**: Tailwind CSS with custom design system, shadcn/ui component library
- **Backend**: Supabase (PostgreSQL database + Edge Functions)
- **Routing**: React Router DOM v6
- **State Management**: React useState/useEffect hooks
- **HTTP Client**: TanStack React Query
- **UI Components**: Radix UI primitives via shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Sonner + custom toast system

## 2. Pages & Routes

### Main Routes
- **`/` (Root/Index)**: Main cost calculator interface
- **`/*` (Catch-all)**: 404 error page for invalid routes

### Page Details
- **Index Page (`/`)**: 
  - Displays the EV Cost Calculator component
  - Single-page application focused on cost comparison
  - Responsive mobile-first design

- **404 Page (`/*`)**:
  - Simple error page with navigation back to home
  - Logs 404 errors for debugging purposes

## 3. Components

### Core Components
- **`CostCalculator`**: Main application component
  - **Currency Support**: Toggle between EUR and HUF with automatic default value updates
  - Vehicle selection dropdown with database integration
  - Form inputs for fuel/electricity prices and consumption rates (currency-aware)
  - Auto-fill vehicle data from database with manual override capability
  - Real-time calculation of costs per 100km in selected currency
  - Results display with visual comparison cards in chosen currency
  - Savings indicator showing which option is cheaper (currency-formatted)

- **`FeedbackModal`**: User feedback system
  - Modal dialog with form fields (name, email, title, feedback)
  - Client-side form validation
  - Integration with Supabase Edge Function for submission
  - Toast notifications for success/error states

### UI Components (shadcn/ui)
Full suite of 50+ reusable UI components including:
- `Card`, `Input`, `Label`, `Button`, `Dialog`, `Select`
- `Toast`, `Textarea`, `Tooltip`, `Accordion`, `Avatar`
- `Calendar`, `Carousel`, `Chart`, `Checkbox`, `Command`
- `DropdownMenu`, `Form`, `Navigation`, `Pagination`, `Progress`
- `Sidebar`, `Skeleton`, `Slider`, `Switch`, `Table`, `Tabs`

## 4. APIs & Backend

### Supabase Edge Functions
- **`feedback-submit`**:
  - **Purpose**: Handles user feedback form submissions
  - **Inputs**: `{ name: string, email: string, title?: string, feedback: string }`
  - **Validation**: Required fields, length limits, email format validation
  - **Outputs**: Success/error response with appropriate HTTP status codes
  - **Security**: Public endpoint (`verify_jwt = false`), CORS enabled
  - **Database**: Inserts into `Feedback_Collecting_DB` table using service role

### Database Access
- **Supabase Client**: Configured with localStorage persistence and auto-refresh
- **Authentication**: Currently not implemented (functions use service role)
- **RLS**: Row Level Security enabled on tables but no policies defined

## 5. Database Schema

### Tables
- **`Feedback_Collecting_DB`**:
  - `id` (bigint, primary key, auto-generated)
  - `created_at` (timestamp, default: now())
  - `name_of_poster` (text, nullable, default: 'John Doe')
  - `email_of_poster` (text, nullable, default: 'youremail@email.at')
  - `title_feedback` (text, nullable)
  - `comment_feedback` (text, nullable, default: '')

- **`Vehicle_Database`**:
  - `id` (bigint, primary key, auto-generated)
  - `created_at` (timestamp, default: now())
  - `car_type` (text, nullable) - Vehicle make/model
  - `fuel_consumption` (real, nullable) - L/100km
  - `electro_consumption` (real, nullable) - kWh/100km
  - `charging_capacity` (real, nullable) - kW
  - `consumption_version` (text, nullable) - Version/variant description

- **`Default_Parameters`**:
  - `id` (bigint, primary key, auto-generated)
  - `created_at` (timestamp, default: now())
  - `variable_name` (text, nullable) - Parameter identifier (e.g., "fuel_price_eur")
  - `variable_value` (numeric, nullable) - Default value for the parameter

- **`Tariff_Database`**:
  - `id` (bigint, primary key, auto-generated)
  - `created_at` (timestamp, default: now())
  - `service_provider` (text, nullable) - e.g. "MOL Plugee", "Ionity"
  - `tariff_name` (text, nullable) - e.g. "Basic", "Premium"
  - `country` (text, nullable) - e.g. "HU", "DE"
  - `pricing_type` (text, nullable) - "per_kwh" or "per_min"
  - `electricity_price` (numeric, nullable) - Price in the respective unit
  - `currency` (text, nullable) - "EUR" or "HUF"

## 6. User Flows

### Primary User Flow
1. **Landing**: User arrives at the main calculator page (`/`)
   - System fetches default pricing values from the Default_Parameters database table
   - Values are loaded based on latest timestamp for each variable name
   - Falls back to hardcoded defaults if database is empty
2. **Currency Selection**: User can switch between EUR and HUF using toggle buttons in Current Prices section
   - System automatically updates all currency displays using database-driven defaults:
     - Pulls values for: fuel_price_eur, fuel_price_huf, electricity_price_kwh_eur, electricity_price_kwh_huf, electricity_price_minute_eur, electricity_price_minute_huf
     - Hardcoded fallbacks: EUR (Fuel €1.5789/L, Electricity €0.56/kWh or €0.075/min), HUF (Fuel 590 Ft/L, Electricity 200 Ft/kWh or 5 Ft/min)
3. **Input Data**: User enters:
   - Current fuel price (in selected currency/liter)
   - Electricity pricing type (per kWh or per minute)
   - Electricity price (in selected currency)
   - **Vehicle Selection**: Choose from pre-configured vehicles or manual input:
     - Option A: Select vehicle from dropdown to auto-fill consumption data
     - Option B: Manual entry of fuel consumption (L/100km), electricity consumption (kWh/100km), charging capacity (kW)
   - User can modify any auto-filled values as needed
4. **View Results**: Real-time calculation displays (in selected currency):
   - Cost per 100km for electricity
   - Cost per 100km for petrol
   - Petrol equivalent price
   - Fuel consumption equivalent
   - Savings indicator
4. **Optional Feedback**: User can provide feedback via modal form

### Feedback Flow
1. **Open Modal**: Click "Your feedback" button
2. **Fill Form**: Enter name, email, optional title, and feedback details
3. **Submit**: Form validation and submission to backend
4. **Confirmation**: Toast notification confirms successful submission

## 7. Integrations & External Services

### Supabase Integration
- **Database**: PostgreSQL with Row Level Security
- **Edge Functions**: Serverless functions for backend logic
- **Client SDK**: @supabase/supabase-js v2.56.0
- **Project ID**: `aknltelxmsattcjwhbwo`
- **Environment**: Production Supabase instance

### Design System
- **Tailwind CSS**: Utility-first styling with custom configuration
- **Color Tokens**: HSL-based semantic color system
- **Automotive Theme**: Custom electric/fuel color schemes
- **Gradients & Shadows**: Themed visual effects
- **Dark Mode**: Full dark mode support configured

## 8. Known Limitations / TODOs

### Security Considerations
✅ **Secure Database Access**: RLS is enabled on all tables with restrictive policies that block public access while allowing service role access.
✅ **Input Validation**: Comprehensive server-side validation with length constraints, email format checks, and payload size limits.
✅ **Rate Limiting**: Edge functions implement rate limiting (5 requests per minute per IP) to prevent abuse.
✅ **CORS Restrictions**: CORS is restricted to the application domain instead of wildcard access.
✅ **Database Constraints**: Tables have proper NOT NULL constraints, length limits, and email format validation at the database level.
⚠️ **Public Edge Functions**: The feedback-submit function is configured with `verify_jwt = false` for public access, but includes rate limiting and validation.
⚠️ **No Authentication**: The application doesn't require user authentication as it's designed for public feedback collection.

### Missing Features
- **User Accounts**: No user registration or login system
- **Data Persistence**: User inputs are not saved between sessions
- **Historical Data**: No tracking of previous calculations
- **Export Features**: No ability to save or export results
- **Advanced Calculations**: No support for different charging speeds, time-of-use rates
- **Limited Localization**: Currently supports EUR and HUF currencies but lacks full localization
- **Vehicle Database Management**: No admin interface to add/edit vehicles in the database

### Technical Debt
- **Large Components**: CostCalculator component could be broken into smaller parts
- **Input Validation**: Limited client-side validation beyond basic checks
- **Error Handling**: Minimal error boundaries and fallback states
- **Testing**: No unit tests or integration tests present
- **Documentation**: Limited inline code documentation

### Potential Improvements
- Add user authentication for personalized experiences
- Implement proper RLS policies for data security
- Add rate limiting and CAPTCHA for feedback form
- Break down large components into smaller, focused components
- Add data export functionality (PDF, CSV)
- Implement proper error boundaries and loading states
- Add unit and integration tests
- ✅ **Multi-currency support** (completed - EUR/HUF toggle with automatic default updates)
- Support for additional currencies and units beyond EUR/HUF
- Time-of-use electricity pricing calculations
- ✅ **Vehicle-specific consumption databases** (completed - Vehicle_Database integration)
- Add admin interface for managing vehicle database entries
- Implement search/filter functionality for vehicle selection
- Add vehicle comparison features