# Clinic Logo Replacement Guide

## Current Logo
The billing invoice print feature uses a clinic logo located at:
```
client/public/clinic-logo.jpg
```

## How to Replace the Logo

### Option 1: Replace the existing file
1. Prepare your new logo image file (recommended formats: JPG, PNG)
2. Rename your logo file to `clinic-logo.jpg` 
3. Replace the file at `client/public/clinic-logo.jpg` with your new logo
4. The logo will automatically appear on printed invoices

### Option 2: Use a different filename
1. Place your logo file in `client/public/` directory
2. Update the image path in `/client/src/components/PrintableInvoice.tsx`
3. Find the line: `<img src="/clinic-logo.jpg" ...`
4. Change it to: `<img src="/your-logo-filename.jpg" ...`

## Logo Specifications

### Recommended Dimensions
- Display size: 128x128 pixels (as configured in the invoice template)
- Source image: 300-500 pixels for high-quality printing
  - The larger source will be scaled down for display but maintain quality when printed
- Aspect ratio: Square or slightly rectangular

### File Format
- Preferred: JPG or PNG
- Maximum file size: 500KB (for faster loading)

### Design Guidelines
- Use high-resolution images (300-500px) for clear printing
- The image will be displayed at 128x128px but using a higher resolution source ensures crisp output
- Ensure good contrast against white background
- Simple, professional designs work best for medical invoices
- Avoid overly complex or detailed logos that may not print clearly

## Current Logo Source
The current logo was sourced from:
```
attached_assets/Logo-Clinic_1762148237143.jpeg
```

## Testing Your New Logo
1. After replacing the logo, run the development server
2. Navigate to Billing page
3. Open a visit with services
4. Click "Print Invoice" 
5. Check the print preview to verify the logo appears correctly
6. Verify the logo prints clearly at the intended size

## Troubleshooting

### Logo not appearing
- Check that the file path is correct
- Verify the image file is in `client/public/` directory
- Clear browser cache and refresh the page
- Check browser console for any image loading errors

### Logo too large or too small
- Adjust the logo dimensions in PrintableInvoice.tsx
- Find the div with class: `w-32 h-32` (width and height in Tailwind units)
- Change to desired size (e.g., `w-40 h-40` for larger, `w-24 h-24` for smaller)

### Logo quality issues
- Use a higher resolution source image
- Ensure the image file is not compressed too heavily
- Try using PNG format for better quality with transparent backgrounds
