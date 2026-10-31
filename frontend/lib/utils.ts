import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, fmt = 'MMM d, yyyy') {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date | null | undefined) {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function timeAgo(date: string | Date | null | undefined) {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'USD'
) {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(n: number | string | null | undefined) {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  return new Intl.NumberFormat('en-US').format(num);
}

export function truncate(str: string, length = 80) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '…' : str;
}

export function getInitials(name: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    // General
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-600',
    // CRM
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    qualified: 'bg-indigo-100 text-indigo-800',
    proposal: 'bg-orange-100 text-orange-800',
    negotiation: 'bg-yellow-100 text-yellow-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    // Projects
    planning: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    // Tasks
    todo: 'bg-gray-100 text-gray-700',
    in_review: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    // Finance
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-purple-100 text-purple-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    partially_paid: 'bg-orange-100 text-orange-800',
    void: 'bg-gray-100 text-gray-500',
    // Support
    open: 'bg-blue-100 text-blue-800',
    pending_client: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-amber-100 text-amber-800',
    closed: 'bg-gray-100 text-gray-600',
    resolved: 'bg-green-100 text-green-800',
    // Priority
    critical: 'bg-red-100 text-red-800',
    high: 'bg-amber-100 text-amber-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-700',
    // HR
    applied: 'bg-blue-100 text-blue-800',
    screening: 'bg-indigo-100 text-indigo-800',
    shortlisted: 'bg-purple-100 text-purple-800',
    interview: 'bg-purple-100 text-purple-800',
    interview_1: 'bg-purple-100 text-purple-800',
    interview_2: 'bg-purple-100 text-purple-800',
    technical_test: 'bg-blue-100 text-blue-800',
    offer: 'bg-emerald-100 text-emerald-800',
    hired: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-600',
    full_time: 'bg-slate-100 text-slate-700',
    part_time: 'bg-slate-100 text-slate-700',
    contract: 'bg-slate-100 text-slate-700',
    internship: 'bg-slate-100 text-slate-700',
    freelance: 'bg-slate-100 text-slate-700',
  };
  return map[status?.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
}

export function extractApiError(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'An unexpected error occurred'
  );
}

export function buildQueryString(params: Record<string, any>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  return query.toString();
}
