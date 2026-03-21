export const getPaymentStatusLabel = (status) => {
  const map = {
      'PENDING': 'payment.status.pending',
      'COMPLETED': 'payment.status.completed',
      'AUTHORIZED': 'payment.status.authorized',
      'FAILED': 'payment.status.failed',
      'REFUNDED': 'payment.status.refunded',
      'NOT_REQUIRED': 'payment.status.not_required'
  };
  return map[status] || status || 'N/D';
};

export const getBookingStatusLabel = (status) => {
  const map = {
      'PENDING': 'payment.status.pending',
      'DEPOSIT_PAID': 'payment.status.deposit_paid',
      'PAYMENT_AUTHORIZED': 'payment.status.payment_authorized',
      'COMPLETED': 'payment.status.completed',
      'CANCELLED_BY_PROVIDER': 'payment.status.cancelled_provider',
      'MODIFIED_BY_PROVIDER': 'payment.status.modified_provider',
      'REFUNDED_BY_ADMIN': 'payment.status.refunded_admin',
      'CANCELLED_BY_ADMIN': 'payment.status.cancelled_admin',
      'FULL_PAYMENT_COMPLETED': 'payment.status.full_payment_completed',
      'WAITING_PROVIDER_CONFIRMATION': 'payment.status.waiting_provider',
      'WAITING_CUSTOMER_PAYMENT': 'payment.status.waiting_customer'
  };
  return map[status] || status || 'N/D';
};

export const getStatusColor = (status) => {
    if (status === 'COMPLETED' || status === 'FULL_PAYMENT_COMPLETED' || status === 'DEPOSIT_PAID') return 'text-green-600';
    if (status === 'PENDING' || status === 'WAITING_PROVIDER_CONFIRMATION' || status === 'WAITING_CUSTOMER_PAYMENT') return 'text-orange-500';
    if (status === 'NOT_REQUIRED') return 'text-slate-400';
    if (status === 'FAILED' || status?.includes('CANCELLED')) return 'text-red-600';
    return 'text-gray-800';
};
