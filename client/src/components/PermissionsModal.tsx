import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPermissionsByRole, Permissions } from "@/lib/permissions";
import { Check, X, Users, FlaskConical, Stethoscope, DollarSign, Settings, Pill } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    fullName?: string | null;
    username: string;
    role: string;
  };
}

interface PermissionItemProps {
  label: string;
  granted: boolean;
}

function PermissionItem({ label, granted }: PermissionItemProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-3 rounded-md hover:bg-muted/50 transition-colors">
      {granted ? (
        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
      )}
      <span className={cn(
        "text-sm",
        granted 
          ? "text-foreground font-medium" 
          : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}

interface PermissionCategoryProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
}

function PermissionCategory({ title, icon, iconColor, children }: PermissionCategoryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <div className={cn("p-2 rounded-lg", iconColor)}>
          {icon}
        </div>
        <h3 className="font-semibold text-base">{title}</h3>
      </div>
      <div className="space-y-0.5 pl-2">
        {children}
      </div>
    </div>
  );
}

export function PermissionsModal({ open, onOpenChange, user }: PermissionsModalProps) {
  const permissions = getPermissionsByRole(user.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            User Permissions - {user.fullName || user.username} ({user.role})
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Below are all the permissions granted to this user based on their role.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Patient Management */}
          <PermissionCategory
            title="Patient Management"
            icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            iconColor="bg-blue-100 dark:bg-blue-900/30"
          >
            <PermissionItem label="View patients" granted={permissions.patientManagement.view} />
            <PermissionItem label="Create patients" granted={permissions.patientManagement.create} />
            <PermissionItem label="Edit patients" granted={permissions.patientManagement.edit} />
            <PermissionItem label="Delete patients" granted={permissions.patientManagement.delete} />
          </PermissionCategory>

          {/* Diagnostics */}
          <PermissionCategory
            title="Diagnostics"
            icon={<FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            iconColor="bg-purple-100 dark:bg-purple-900/30"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Laboratory</p>
              <PermissionItem label="View lab orders" granted={permissions.diagnostics.laboratory.view} />
              <PermissionItem label="Create lab orders" granted={permissions.diagnostics.laboratory.create} />
              
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 mt-3">X-Ray</p>
              <PermissionItem label="View X-ray orders" granted={permissions.diagnostics.xray.view} />
              <PermissionItem label="Create X-ray orders" granted={permissions.diagnostics.xray.create} />
              
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 mt-3">Ultrasound</p>
              <PermissionItem label="View ultrasound orders" granted={permissions.diagnostics.ultrasound.view} />
              <PermissionItem label="Create ultrasound orders" granted={permissions.diagnostics.ultrasound.create} />
            </div>
          </PermissionCategory>

          {/* Clinical */}
          <PermissionCategory
            title="Clinical"
            icon={<Stethoscope className="w-5 h-5 text-green-600 dark:text-green-400" />}
            iconColor="bg-green-100 dark:bg-green-900/30"
          >
            <PermissionItem label="Treatment access (view/manage treatments)" granted={permissions.clinical.treatment} />
            <PermissionItem label="Pharmacy access (view/dispense medications)" granted={permissions.clinical.pharmacy} />
            <PermissionItem label="Prescribe medications" granted={permissions.clinical.prescribe} />
          </PermissionCategory>

          {/* Financial */}
          <PermissionCategory
            title="Financial"
            icon={<DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            iconColor="bg-emerald-100 dark:bg-emerald-900/30"
          >
            <PermissionItem label="View daily cash reports" granted={permissions.financial.viewReports} />
            <PermissionItem label="Process payments" granted={permissions.financial.processPayments} />
            <PermissionItem label="View invoices" granted={permissions.financial.viewInvoices} />
            <PermissionItem label="Create invoices" granted={permissions.financial.createInvoices} />
            <PermissionItem label="Generate financial reports" granted={permissions.financial.generateReports} />
          </PermissionCategory>

          {/* User Management */}
          <PermissionCategory
            title="User Management"
            icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            iconColor="bg-indigo-100 dark:bg-indigo-900/30"
          >
            <PermissionItem label="View users" granted={permissions.userManagement.view} />
            <PermissionItem label="Create users" granted={permissions.userManagement.create} />
            <PermissionItem label="Edit users" granted={permissions.userManagement.edit} />
            <PermissionItem label="Delete users" granted={permissions.userManagement.delete} />
          </PermissionCategory>

          {/* Settings & Administration */}
          <PermissionCategory
            title="Settings & Administration"
            icon={<Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
            iconColor="bg-orange-100 dark:bg-orange-900/30"
          >
            <PermissionItem label="Service management" granted={permissions.settings.serviceManagement} />
            <PermissionItem label="Billing settings access" granted={permissions.settings.billingSettings} />
            <PermissionItem label="System settings access" granted={permissions.settings.systemSettings} />
          </PermissionCategory>
        </div>

        {/* Footer with summary */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              This is a read-only view of permissions. To modify permissions, change the user's role.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
