import AdminShell from "@/components/admin/AdminShell";

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground">Admin Settings</h1>
        <p className="mt-2 text-muted">Platform configuration for Habari Connect AI.</p>

        <div className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <h2 className="font-medium text-foreground">Security</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-muted">
              <li>Change default admin password before production</li>
              <li>TODO: Enable MFA for admin accounts</li>
              <li>TODO: Add audit logs for admin actions</li>
              <li>TODO: Rate limiting on admin login</li>
            </ul>
          </div>
          <div>
            <h2 className="font-medium text-foreground">File storage</h2>
            <p className="mt-2 text-sm text-muted">
              Uploads are stored locally in <code className="text-foreground">/public/uploads</code>.
              TODO: Use S3, Azure Blob Storage, or SharePoint in production.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground">Permissions</h2>
            <p className="mt-2 text-sm text-muted">
              TODO: Advanced permissions for manager-level content editing.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
