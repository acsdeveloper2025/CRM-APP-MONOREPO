# Cascading Location Management System

## Overview

The Cascading Location Management System implements a hierarchical 5-level geographic dropdown workflow for pincode creation and editing. This system ensures users can only select valid combinations following the geographic hierarchy: **Country → State → City → Pincode → Areas**.

## Geographic Hierarchy

```
Country (Level 1)
├── State (Level 2)
    ├── City (Level 3)
        ├── Pincode (Level 4)
            └── Areas (Level 5)
```

## Components

### 1. CascadingLocationSelector

**File**: `acs-web/src/components/locations/CascadingLocationSelector.tsx`

**Purpose**: Core reusable component that handles the cascading dropdown logic.

**Features**:
- Dynamic filtering based on parent selections
- Automatic clearing of dependent fields when parent changes
- Loading states for each dropdown
- Support for both create and edit modes
- Configurable field names and visibility

**Props**:
```typescript
interface CascadingLocationSelectorProps {
  form: any;                    // React Hook Form instance
  countryField?: string;        // Default: 'countryId'
  stateField?: string;          // Default: 'stateId'
  cityField?: string;           // Default: 'cityId'
  pincodeField?: string;        // Default: 'pincodeCode'
  areasField?: string;          // Default: 'areas'
  mode: 'create' | 'edit';      // Form mode
  showPincodeInput?: boolean;   // Default: true
  showAreasSelect?: boolean;    // Default: true
  disabled?: boolean;           // Default: false
  onLocationChange?: (location) => void; // Callback for changes
}
```

### 2. CascadingCreatePincodeDialog

**File**: `acs-web/src/components/locations/CascadingCreatePincodeDialog.tsx`

**Purpose**: Dialog for creating new pincodes with full geographic hierarchy selection.

**Workflow**:
1. User selects Country
2. State dropdown populates with states from selected country
3. City dropdown populates with cities from selected state
4. User enters new pincode code (6-digit input)
5. Areas multi-select allows choosing areas for the pincode

**Schema**:
```typescript
const cascadingCreatePincodeSchema = z.object({
  countryId: z.string().min(1, 'Country selection is required'),
  stateId: z.string().min(1, 'State selection is required'),
  cityId: z.string().min(1, 'City selection is required'),
  pincodeCode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  areas: z.array(z.string()).min(1).max(15, 'Maximum 15 areas allowed'),
});
```

### 3. CascadingEditPincodeDialog

**File**: `acs-web/src/components/locations/CascadingEditPincodeDialog.tsx`

**Purpose**: Dialog for editing existing pincodes with ability to change location hierarchy.

**Features**:
- Pre-populates all fields based on existing pincode data
- Fetches city details to determine state and country
- Allows changing any level of the hierarchy
- Updates dependent dropdowns when parent selections change

**Data Flow**:
1. Fetch pincode's city details
2. Determine state from city data
3. Determine country from city data
4. Pre-populate all form fields
5. Enable cascading updates when user changes selections

## API Integration

### Required API Endpoints

The system leverages existing API endpoints:

```typescript
// Countries
GET /api/countries?limit=100

// States filtered by country
GET /api/states?country={countryName}&limit=100

// Cities filtered by state
GET /api/cities?state={stateName}&limit=100

// Pincodes filtered by city (for edit mode)
GET /api/cities/{cityId}/pincodes

// Areas (standalone)
GET /api/areas/standalone
```

### Data Transformation

**Frontend to Backend**:
```typescript
// Cascading form data
{
  countryId: "1",
  stateId: "2", 
  cityId: "3",
  pincodeCode: "400001",
  areas: ["1", "2", "3"]
}

// Transformed to backend format
{
  code: "400001",
  cityId: "3",
  areas: ["1", "2", "3"]
}
```

## User Interface

### Location Management Page Updates

**File**: `acs-web/src/pages/LocationsPage.tsx`

**Changes**:
- Added "Add Pincode" button (cascading) alongside "Quick Add" (original)
- Imported and integrated `CascadingCreatePincodeDialog`
- Maintains backward compatibility with existing quick create dialog

### Pincode Table Updates

**File**: `acs-web/src/components/locations/PincodesTable.tsx`

**Changes**:
- Added "Edit Location" option alongside "Quick Edit"
- Integrated `CascadingEditPincodeDialog`
- Updated dropdown menu with both edit options

## User Experience

### Create Workflow

1. **Country Selection**: User selects from available countries
2. **State Selection**: Dropdown populates with states from selected country
3. **City Selection**: Dropdown populates with cities from selected state
4. **Pincode Entry**: User enters 6-digit pincode code
5. **Area Selection**: Multi-select dropdown for choosing areas (max 15)

### Edit Workflow

1. **Pre-population**: All fields auto-populate based on existing pincode
2. **Hierarchy Changes**: User can change any level (country, state, city)
3. **Dependent Updates**: Lower-level dropdowns update when parent changes
4. **Area Management**: Update associated areas for the pincode

### Loading States

- Each dropdown shows loading spinner while fetching data
- Disabled state when parent selection is required
- Placeholder text guides user through the process

### Error Handling

- Form validation at each level
- Required field validation
- Format validation (6-digit pincode)
- Maximum area limit enforcement (15 areas)

## Technical Implementation

### Form Management

Uses React Hook Form with Zod validation:
```typescript
const form = useForm<CascadingFormData>({
  resolver: zodResolver(cascadingSchema),
  defaultValues: { /* ... */ }
});
```

### State Management

- React Query for API data fetching and caching
- Form state managed by React Hook Form
- Local state for dialog visibility

### Performance Optimizations

- Query caching with React Query
- Conditional API calls (enabled only when parent selected)
- Debounced search in area multi-select
- Lazy loading of dependent data

## Backward Compatibility

The system maintains full backward compatibility:

- **Quick Add/Edit**: Original simple forms still available
- **API Compatibility**: No changes to existing API endpoints
- **Data Format**: Backend receives data in same format
- **Existing Features**: All current functionality preserved

## Future Enhancements

### Potential Improvements

1. **Bulk Operations**: Bulk pincode creation with cascading selection
2. **Search Integration**: Search across the hierarchy
3. **Favorites**: Save frequently used location combinations
4. **Validation**: Real-time pincode validation against postal services
5. **Import/Export**: CSV import with hierarchy validation

### Scalability Considerations

- **Virtualization**: For large datasets (thousands of cities/areas)
- **Pagination**: Server-side pagination for large location lists
- **Caching**: Enhanced caching strategies for location data
- **Search**: Full-text search across location hierarchy

## Testing

### Test Scenarios

1. **Create Flow**: Complete country→state→city→pincode→areas workflow
2. **Edit Flow**: Pre-population and hierarchy changes
3. **Validation**: Required fields, format validation, limits
4. **Error Handling**: Network errors, invalid selections
5. **Performance**: Large datasets, multiple concurrent users

### Edge Cases

- Empty states/cities for selected parent
- Network timeouts during cascading loads
- Invalid existing data during edit
- Concurrent modifications by multiple users

## Conclusion

The Cascading Location Management System provides a comprehensive, user-friendly interface for managing geographic hierarchies while maintaining backward compatibility and ensuring data integrity through proper validation and error handling.
