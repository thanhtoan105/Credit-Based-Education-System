# Sonner Toast Usage Examples

This document shows how to use the new Sonner toast system in your project.

## Import

```typescript
import { toast } from '@/lib/toast';
```

## Basic Usage

### Success Toast
```typescript
toast.success({
  title: 'Success!',
  description: 'Operation completed successfully.',
});
```

### Error Toast
```typescript
toast.error({
  title: 'Error',
  description: 'Something went wrong. Please try again.',
});
```

### Warning Toast
```typescript
toast.warning({
  title: 'Warning',
  description: 'Please check your input and try again.',
});
```

### Info Toast
```typescript
toast.info({
  title: 'Information',
  description: 'Here is some useful information.',
});
```

## Advanced Usage

### With Custom Duration
```typescript
toast.success({
  title: 'Success!',
  description: 'This toast will disappear in 2 seconds.',
  duration: 2000,
});
```

### With Action Button
```typescript
toast.error({
  title: 'Error',
  description: 'Failed to save changes.',
  action: {
    label: 'Retry',
    onClick: () => {
      // Retry logic here
      console.log('Retrying...');
    },
  },
});
```

### Promise Toast (for async operations)
```typescript
const saveData = async () => {
  const promise = fetch('/api/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  toast.promise(promise, {
    loading: 'Saving data...',
    success: 'Data saved successfully!',
    error: 'Failed to save data.',
  });
};
```

### Generic Message Toast
```typescript
toast.message({
  title: 'Custom Toast',
  description: 'This is a generic toast without specific styling.',
});
```

## Dismissing Toasts

### Dismiss All Toasts
```typescript
toast.dismiss();
```

### Dismiss Specific Toast
```typescript
const toastId = toast.success({
  title: 'Success!',
  description: 'This can be dismissed programmatically.',
});

// Later, dismiss this specific toast
toast.dismiss(toastId);
```

## Features

- **Rich Colors**: Automatically styled with appropriate colors for each type
- **Close Button**: Each toast has a close button
- **Icons**: Automatic icons for each toast type (CheckCircle, AlertTriangle, Info)
- **Position**: Toasts appear in the top-right corner
- **Expandable**: Toasts can expand to show more content
- **Responsive**: Works well on all screen sizes
- **Accessible**: Follows accessibility best practices

## Migration from Old Toast

### Before (Old System)
```typescript
toast({
  title: 'Success',
  description: 'Operation completed.',
  variant: 'default', // or 'destructive'
});
```

### After (New Sonner System)
```typescript
// For success
toast.success({
  title: 'Success',
  description: 'Operation completed.',
});

// For errors
toast.error({
  title: 'Error',
  description: 'Something went wrong.',
});
```

The new system is more intuitive and provides better visual feedback with rich colors and icons.
