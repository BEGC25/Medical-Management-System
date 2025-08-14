interface ClinicHeaderProps {
  title: string;
}

export default function ClinicHeader({ title }: ClinicHeaderProps) {
  return (
    <div className="text-center border-b pb-4 mb-6">
      <h1 className="text-2xl font-bold text-medical-blue">
        BAHR EL GHAZAL CLINIC
      </h1>
      <p className="text-sm text-gray-600">
        Your Health, Our Priority
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Phone: +211 91 762 3881 | +211 92 220 0691 | Email: bahr.ghazal.clinic@gmail.com
      </p>
      <p className="text-lg font-semibold text-medical-green mt-2">
        {title}
      </p>
    </div>
  );
}