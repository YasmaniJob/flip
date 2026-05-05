# Dynamic Trial Configuration - Complete

## Summary
Successfully implemented dynamic trial period configuration. The trial days are now configurable through the admin UI and stored in the database, replacing the previous hardcoded 15-day value.

## Changes Made

### 1. Updated Onboarding Endpoint
**File**: `apps/web/src/app/api/institutions/onboard/route.ts`

**Before** (Hardcoded):
```typescript
const trialEndsAt = new Date();
trialEndsAt.setDate(trialEndsAt.getDate() + 15); // ❌ Hardcoded
```

**After** (Dynamic):
```typescript
// Get dynamic trial days from configuration
const trialDays = await getTrialDays();
const trialEndsAt = new Date();
trialEndsAt.setDate(trialEndsAt.getDate() + trialDays); // ✅ Dynamic
```

### 2. Added Import
```typescript
import { getTrialDays } from '@/lib/trial-config';
```

### 3. Fixed Init Script
**File**: `apps/web/scripts/init-trial-config.ts`
- Added dotenv configuration to load environment variables

## Architecture

### Database Storage
Trial configuration is stored in the `global_config` table:

```typescript
{
  id: 'uuid',
  key: 'trial_days',
  value: '{"trialDays": 30}', // JSON string
  updatedBy: 'user@email.com',
  updatedAt: Date,
  createdAt: Date
}
```

### Configuration Service
**File**: `apps/web/src/lib/trial-config.ts`

Functions:
- `getTrialDays()`: Returns configured trial days (default: 15)
- `getTrialConfig()`: Returns full config with metadata
- `setTrialDays(days, updatedBy)`: Updates trial configuration

### API Endpoints

#### GET `/api/admin/config/trial`
Returns current trial configuration (admin only)

**Response**:
```json
{
  "trialDays": 30,
  "updatedAt": "2026-04-11T01:52:21.061Z",
  "updatedBy": "yasmanijguillen@gmail.com"
}
```

#### POST `/api/admin/config/trial`
Updates trial configuration (admin only)

**Request**:
```json
{
  "trialDays": 30
}
```

**Validation**: Must be between 1 and 365 days

#### GET `/api/public/trial-days`
Public endpoint for landing page

**Response**:
```json
{
  "trialDays": 30
}
```

### Admin UI
**File**: `apps/web/src/features/subscriptions/components/trial-config-card.tsx`
**Page**: `/suscripciones`

Features:
- View current trial days configuration
- Update trial days (1-365 range)
- Reset to default (15 days)
- Visual feedback with toast notifications
- Clear explanation that changes only affect new institutions

## Current Configuration

✅ **Active Configuration**:
- Trial Days: **30 days**
- Last Updated: 2026-04-11
- Updated By: yasmanijguillen@gmail.com

✅ **Verification Passed**:
- Configuration service working correctly
- New institutions will receive 30 days of trial
- Trial end date calculation: Current date + 30 days
- Example: Institution created on 12/4/2026 → Trial ends 12/5/2026

## Usage Flow

### For New Institutions
1. User completes onboarding at `/onboard`
2. System calls `getTrialDays()` to fetch current configuration
3. Institution is created with `trialEndsAt = now + trialDays`
4. User gets access for the configured trial period

### For Administrators
1. Navigate to `/suscripciones` page
2. See "Configuración de Período de Prueba" card
3. Modify trial days (1-365)
4. Click "Guardar" to save
5. Changes apply to all new institutions immediately

## Scripts

### Initialize Configuration
```bash
npx dotenv -e .env.local -- npx tsx scripts/init-trial-config.ts
```

Creates default configuration (15 days) if not exists.

### Verify Configuration
```bash
npx dotenv -e .env.local -- npx tsx scripts/verify-trial-config.ts
```

Verifies that trial configuration is working correctly and shows current settings.

## Benefits

1. **Flexibility**: Change trial period without code deployment
2. **Business Control**: Marketing/sales can adjust trial length
3. **Audit Trail**: Track who changed configuration and when
4. **Consistency**: Single source of truth for trial period
5. **No Downtime**: Changes take effect immediately

## Migration Notes

- Existing institutions keep their current `trialEndsAt` dates
- Only NEW institutions created after configuration change use new trial period
- To modify existing institutions, use "Extender Trial" feature in subscriptions page

## Testing

To test the dynamic configuration:

1. Check current config:
```bash
curl https://app.flip.org.pe/api/public/trial-days
```

2. Update config (as admin):
```bash
curl -X POST https://app.flip.org.pe/api/admin/config/trial \
  -H "Content-Type: application/json" \
  -d '{"trialDays": 45}'
```

3. Create new institution and verify `trialEndsAt` is 45 days from now

## Files Modified

- ✅ `apps/web/src/app/api/institutions/onboard/route.ts` - Use dynamic trial days
- ✅ `apps/web/scripts/init-trial-config.ts` - Added dotenv configuration

## Files Already Implemented (No Changes Needed)

- `apps/web/src/lib/trial-config.ts` - Configuration service
- `apps/web/src/app/api/admin/config/trial/route.ts` - Admin API
- `apps/web/src/app/api/public/trial-days/route.ts` - Public API
- `apps/web/src/features/subscriptions/components/trial-config-card.tsx` - Admin UI
- `apps/web/src/app/(dashboard)/suscripciones/page.tsx` - Subscriptions page

## Security

- Admin endpoints require authentication and superadmin role
- Public endpoint is read-only and cached
- Configuration changes are logged with user email
- Input validation prevents invalid values (1-365 days)

## Future Enhancements

Possible improvements:
- Email notification when trial period is changed
- History log of configuration changes
- Different trial periods per institution type
- A/B testing different trial lengths
- Analytics on trial conversion rates
