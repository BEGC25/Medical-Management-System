// components/ClinicHeader.tsx
export default function ClinicHeader({ title }: { title: string }) {
  return (
    <div className="text-center border-b border-gray-300 pb-4 mb-6">
      <h1 className="text-2xl font-extrabold tracking-wide text-medical-blue">
        BAHR EL GHAZAL CLINIC
      </h1>
      <p className="text-sm italic text-gray-700">Your Health, Our Priority</p>
      <p className="text-xs text-gray-600 mt-1">
        Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com
      </p>
      <p className="text-lg font-semibold text-medical-green mt-3">{title}</p>
    </div>
  );
}