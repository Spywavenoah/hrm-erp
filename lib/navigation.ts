import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  CalendarDays,
  Wallet,
  Target,
  Package,
  Briefcase,
  GraduationCap,
  Settings,
  Building2,
  FileText,
  ShieldCheck,
  ChartBar,
  Network,
  UserCog,
  Mail,
  CreditCard,
  Palette,
  Layers,
  Wrench,
  ClipboardList,
  ArrowRightLeft,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavSection {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Employees',
    icon: Users,
    items: [
      { label: 'All Employees', href: '/employees', icon: Users },
      { label: 'Departments', href: '/organization/departments', icon: Building2 },
      { label: 'Positions', href: '/organization/positions', icon: Network },
      { label: 'Onboarding', href: '/employees/onboarding', icon: UserPlus },
    ],
  },
  {
    label: 'Recruitment',
    icon: Briefcase,
    items: [
      { label: 'Job Postings', href: '/recruitment', icon: Briefcase },
      { label: 'Candidates', href: '/recruitment/candidates', icon: UserPlus },
    ],
  },
  {
    label: 'Attendance',
    icon: Clock,
    items: [
      { label: 'Clock In/Out', href: '/attendance', icon: Clock },
      { label: 'Timesheets', href: '/attendance/timesheets', icon: ClipboardList },
    ],
  },
  {
    label: 'Leave',
    icon: CalendarDays,
    items: [
      { label: 'Leave Requests', href: '/leave', icon: CalendarDays },
      { label: 'Leave Types', href: '/leave/types', icon: Settings },
      { label: 'Holidays', href: '/leave/holidays', icon: CalendarDays },
    ],
  },
  {
    label: 'Payroll',
    icon: Wallet,
    items: [
      { label: 'Payroll Runs', href: '/payroll', icon: Wallet },
      { label: 'Pay Components', href: '/payroll/components', icon: Layers },
      { label: 'Payslips', href: '/payroll/payslips', icon: FileText },
    ],
  },
  {
    label: 'Performance',
    icon: Target,
    items: [
      { label: 'Reviews', href: '/performance', icon: Target },
      { label: 'Goals', href: '/performance/goals', icon: Target },
    ],
  },
  {
    label: 'Training',
    icon: GraduationCap,
    items: [
      { label: 'Courses', href: '/training', icon: GraduationCap },
      { label: 'Enrollments', href: '/training/enrollments', icon: UserPlus },
    ],
  },
  {
    label: 'Assets',
    icon: Package,
    items: [
      { label: 'Asset Catalog', href: '/assets', icon: Package },
      { label: 'Assignments', href: '/assets/assignments', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Reports',
    icon: ChartBar,
    items: [
      { label: 'Dashboards', href: '/reports', icon: ChartBar },
      { label: 'Report Builder', href: '/reports/builder', icon: Wrench },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    items: [
      { label: 'Branding', href: '/settings/branding', icon: Palette },
      { label: 'Company Profile', href: '/settings/company', icon: Building2 },
      { label: 'Payments', href: '/settings/payments', icon: CreditCard },
      { label: 'Email (SMTP)', href: '/settings/smtp', icon: Mail },
      { label: 'Mail Templates', href: '/settings/templates', icon: FileText },
      { label: 'Field Builder', href: '/settings/fields', icon: Wrench },
      { label: 'Workflows', href: '/settings/workflows', icon: ArrowRightLeft },
      { label: 'Onboarding Templates', href: '/settings/onboarding-templates', icon: UserPlus },
      { label: 'Security', href: '/settings/security', icon: ShieldCheck },
      { label: 'Audit Log', href: '/settings/audit-log', icon: ClipboardList },
    ],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);
