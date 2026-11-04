import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <div className="flex min-h-screen"><Sidebar /><div className="min-w-0 flex-1"><Topbar />{children}</div></div>; }
