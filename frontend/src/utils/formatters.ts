import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'dd MMM yyyy');
};

export const formatDateTime = (dateTimeString: string): string => {
  return format(new Date(dateTimeString), 'dd MMM yyyy, HH:mm');
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getStatusColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'inflow':
      return 'text-success bg-success/10';
    case 'outflow':
      return 'text-danger bg-danger/10';
    default:
      return 'text-slate-500 bg-slate-100';
  }
};
