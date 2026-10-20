# Unit 02: Global Attribute Library

> **Historical implementation spec (Units 01–08).** This spec describes the original local-JSON/filesystem implementation. Those units are retained as historical records; the current runtime uses Supabase PostgreSQL, server-side data access, Auth/RLS, and Supabase Storage. Do not implement filesystem persistence or JSON writes from this spec. Use `context/architecture.md` and `context/progress-tracker.md` for current architecture/status.

## 1. Overview
The Global Attribute Library is a centralized page (`/attributes`) where taxonomy planners can define and manage attributes that will later be linked to categories.

## 2. Requirements
- **Display**: A responsive data table or card grid listing all existing attributes.
- **CRUD Operations**: Create, Read, Update, and Delete attributes.
- **Fields**:
  - `name_ar` (Arabic Name) - Required
  - `name_en` (English Name) - Optional
  - `data_type` (Data Type) - Required (number, enum, string, boolean)
  - `filter_type` (Filter Type) - Required (range, checkbox, select, toggle, color_swatch, button_group)
  - `unit` (Unit of measurement) - Optional
- **UI UX**:
  - "Add Attribute" button opening a modal or side panel.
  - Inline editing or modal editing for existing attributes.
  - Delete confirmation.
  - RTL design with Arabic as primary language.
- **Data Layer**: Use `readAttributes` and `writeAttributes` from `lib/data/attributes.ts`.
- **Mutations**: Next.js Server Actions with Zod validation.

## 3. Architecture & Components
- `app/attributes/page.tsx`: Server component fetching data and rendering the layout.
- `components/attributes/AttributeList.tsx`: Client or Server component mapping over the attributes.
- `components/attributes/AttributeForm.tsx`: Client component form using Server Actions for submission.
- `lib/actions/attributes.ts`: Server Actions for `createAttribute`, `updateAttribute`, `deleteAttribute`.

## 4. Verification Plan
- Verify navigating to `/attributes` works.
- Verify creating a new attribute persists to `data/attributes.json`.
- Verify updating and deleting works.
- Verify TypeScript compilation passes without errors.
