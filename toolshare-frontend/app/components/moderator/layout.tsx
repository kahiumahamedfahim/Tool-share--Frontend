import RoleGuard from "@/app/components/RoleGuard";

export default function ModeratorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleGuard allowedRoles={["MODERATOR"]}>
      {children}
    </RoleGuard>
  );
}