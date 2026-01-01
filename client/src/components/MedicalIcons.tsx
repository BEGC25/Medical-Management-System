// Medical Icons - Proper Medical Symbols
// Clean line art style with consistent stroke width
// Teal/blue color (#14b8a6) for medical context

interface IconProps {
  className?: string;
  size?: number;
}

// Laboratory - Test tubes/flask icon
export function LaboratoryIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9 3V10.5L4.5 18C3.5 19.5 4.5 21 6 21H18C19.5 21 20.5 19.5 19.5 18L15 10.5V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 3H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 16C7 16 8.5 14.5 12 14.5C15.5 14.5 17 16 17 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// X-Ray - Chest x-ray/radiograph icon (ribcage)
export function XRayIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ribcage outline */}
      <rect
        x="8"
        y="4"
        width="8"
        height="16"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ribs */}
      <path
        d="M8 7H6M8 10H6M8 13H6M8 16H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 7H18M16 10H18M16 13H18M16 16H18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Central spine */}
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Ultrasound - Ultrasound probe/transducer icon (NOT radar!)
export function UltrasoundIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Probe handle */}
      <rect
        x="10"
        y="2"
        width="4"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Probe head */}
      <path
        d="M9 12C9 12 8 14 8 16C8 18.2 9.8 20 12 20C14.2 20 16 18.2 16 16C16 14 15 12 15 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sound waves */}
      <path
        d="M12 12V15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="16"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

// Pharmacy - Medicine bottles/pills icon
export function PharmacyIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Pill bottle */}
      <rect
        x="7"
        y="8"
        width="10"
        height="13"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottle cap */}
      <path
        d="M8 8V6C8 5.4 8.4 5 9 5H15C15.6 5 16 5.4 16 6V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cross symbol */}
      <path
        d="M12 11V17M9 14H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Consultation - Stethoscope icon (already using 🩺, but provide SVG alternative)
export function ConsultationIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="18"
        cy="12"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M18 14C18 14 18 16 16 18C14 20 12 20 12 20C12 20 12 20 10 20C8 20 6 18 6 16C6 14 8 12 10 12H12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12V8C12 6 13 4 15 4C17 4 18 5 18 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Helper function to get the appropriate medical icon component
export function getMedicalIcon(type: string, props?: IconProps) {
  const iconProps = { className: "text-teal-500", size: 20, ...props };
  
  switch (type.toLowerCase()) {
    case 'lab_test_item':
    case 'laboratory':
      return <LaboratoryIcon {...iconProps} />;
    case 'xray_exam':
    case 'radiology':
    case 'xray':
      return <XRayIcon {...iconProps} />;
    case 'ultrasound_exam':
    case 'ultrasound':
      return <UltrasoundIcon {...iconProps} />;
    case 'pharmacy_order':
    case 'pharmacy':
      return <PharmacyIcon {...iconProps} />;
    case 'consultation':
      return <ConsultationIcon {...iconProps} />;
    default:
      return null;
  }
}
