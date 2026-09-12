import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onUpdate: () => void;
}

export function CustomerOrderDetailsModal({ isOpen, onClose, orderId, onUpdate }: CustomerOrderDetailsModalProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservingId, setReservingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    } else {
      setOrder(null);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await api.get(`/customer-orders/${orderId}`);
      setOrder(res.data.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch order details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserve = async (itemId: string) => {
    try {
      setReservingId(itemId);
      await api.post(`/customer-orders/${orderId}/reserve`, {
        order_item_id: itemId
      });
      // Re-fetch details to see the new reservation and status
      await fetchOrderDetails();
      // Notify parent to refresh the main list if status changed
      onUpdate();
    } catch (err: any) {
      console.error('Reservation failed', err);
      alert(err.response?.data?.error?.message || 'Failed to reserve inventory.');
    } finally {
      setReservingId(null);
    }
  };

  if (!isOpen || !orderId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Order Details" className="max-w-4xl">
      {isLoading && !order ? (
        <div className="py-8 text-center text-text-secondary">Loading order details...</div>
      ) : error ? (
        <div className="py-4 text-red-500 text-center">{error}</div>
      ) : order ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-surface border border-border p-4 rounded-md">
            <div>
              <p className="text-xs text-text-secondary uppercase">Order Reference</p>
              <p className="font-medium text-text-primary">{order.customer_reference}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase">Status</p>
              <div className="mt-1">
                <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'info'}>
                  {order.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase">Created By</p>
              <p className="text-sm text-text-primary">{order.creator?.name}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase">Date</p>
              <p className="text-sm text-text-primary">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-text-primary mb-3">Order Items</h3>
            {order.items && order.items.length > 0 ? (
              <div className="border border-border rounded-md overflow-hidden bg-surface">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Location</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">Batch</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">Quantity</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-text-secondary uppercase">Status</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-text-primary">{item.item?.name}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{item.location?.name}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{item.batch?.batch_number}</td>
                        <td className="px-4 py-3 text-sm text-text-primary text-right">{item.quantity_requested}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Badge variant={item.status === 'RESERVED' ? 'success' : 'warning'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'OPERATIONS') ? (
                            <Button 
                              variant="primary" 
                              size="sm"
                              isLoading={reservingId === item.id}
                              onClick={() => handleReserve(item.id)}
                            >
                              Reserve
                            </Button>
                          ) : item.status === 'RESERVED' ? (
                            <span className="text-xs text-green-500 font-medium">Reserved ✓</span>
                          ) : (
                            <span className="text-xs text-text-secondary">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No items found for this order.</p>
            )}
          </div>

          <div className="pt-4 flex justify-end border-t border-border">
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
