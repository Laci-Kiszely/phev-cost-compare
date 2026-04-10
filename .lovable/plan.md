

## Plan: Add "Select Tariff" Dropdown to Current Prices Section

### 1. Create a new Supabase table: `Tariff_Database`

Columns:
- `id` (bigint, PK, auto-generated)
- `created_at` (timestamptz, default now())
- `service_provider` (text) -- e.g. "MOL Plugee", "Ionity"
- `tariff_name` (text) -- e.g. "Basic", "Premium"
- `country` (text) -- e.g. "HU", "DE"
- `pricing_type` (text) -- "per_kwh" or "per_min"
- `electricity_price` (numeric) -- price in the respective unit
- `currency` (text) -- "EUR" or "HUF"

Add RLS policy for public read access (same pattern as Vehicle_Database).

### 2. Update `CostCalculator.tsx`

- Fetch tariffs from `Tariff_Database` on mount
- Add a "Select Tariff (Optional)" dropdown in the **Current Prices** card, below the currency toggle and above the fuel price input
- When a tariff is selected:
  - Auto-set `electricityPriceType` based on `pricing_type`
  - Auto-set `electricityPrice` from the tariff's `electricity_price`
  - Filter tariffs shown based on current `currency` selection
- Include a "Manual input" option to clear the tariff selection
- Display tariff as: `"Provider - Tariff Name (Country)"` in the dropdown

### 3. Update `FEATURE_OVERVIEW.md`

Document the new tariff selection feature.

### Technical Details

- Migration SQL creates table + RLS policy
- Tariff interface added to CostCalculator component
- Dropdown filters by current currency so users only see relevant tariffs
- Selecting a tariff auto-fills pricing type and electricity price; users can still override manually

