import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CreateCustomerOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItemPayload {
  id: string; // temp id for UI
  item_id: string;
  location_id: string;
  batch_id: string;
  quantity_requested: string;
}

export function CreateCustomerOrderModal({ isOpen, onClose, onSuccess }: CreateCustomerOrderModalProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  
  const [customerReference, setCustomerReference] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItemPayload[]>([
    { id: crypto.randomUUID(), item_id: '', location_id: '', batch_id: '', quantity_requested: '' }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFormData();
    }
  }, [isOpen]);

  const fetchFormData = async () => {
    try {
      const [locationsRes, itemsRes, batchesRes] = await Promise.all([
        api.get('/locations'),
        api.get('/items'),
        api.get('/batches')
      ]);
      setLocations(locationsRes.data.data || []);
      setItems(itemsRes.data.data || []);
      setBatches(batchesRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch form data', err);
      setError('Failed to load form data.');
    }
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      { id: crypto.randomUUID(), item_id: '', location_id: '', batch_id: '', quantity_requested: '' }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof OrderItemPayload, value: string) => {
    setOrderItems(orderItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!customerReference) {
      setError('Customer reference is required.');
      return;
    }

    if (orderItems.length === 0) {
      setError('At least one item is required.');
      return;
    }

    for (const item of orderItems) {
      if (!item.item_id || !item.location_id || !item.batch_id || !item.quantity_requested) {
        setError('All item fields are required for each item.');
        return;
      }
    }

    try {
      setIsLoading(true);
      await api.post('/orders', {
        customer_reference: customerReference,
        items: orderItems.map(item => ({
          item_id: item.item_id,
          location_id: item.location_id,
          batch_id: item.batch_id,
          quantity_requested: Number(item.quantity_requested)
        }))
      });
      
      onSuccess();
      onClose();
      // Reset form
      setCustomerReference('');
      setOrderItems([{ id: crypto.randomUUID(), item_id: '', location_id: '', batch_id: '', quantity_requested: '' }]);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to create customer order.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Customer Order" className="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Customer Reference</label>
          <Input
            value={customerReference}
            onChange={(e) => setCustomerReference(e.target.value)}
            placeholder="CUST-1001 or PO-9923"
            required
          />
        </div>

        <div className="border-t border-border pt-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-text-primary">Order Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {orderItems.map((item) => (
              <div key={item.id} className="bg-surface border border-border p-3 rounded-md relative flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Item</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={item.item_id}
                    onChange={(e) => handleItemChange(item.id, 'item_id', e.target.value)}
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Location</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={item.location_id}
                    onChange={(e) => handleItemChange(item.id, 'location_id', e.target.value)}
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Batch</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={item.batch_id}
                    onChange={(e) => handleItemChange(item.id, 'batch_id', e.target.value)}
                    required
                  >
                    <option value="">Select Batch</option>
                    {batches
                      .filter(b => !item.item_id || b.item_id === item.item_id)
                      .map((batch) => (
                      <option key={batch.id} value={batch.id}>{batch.batch_number}</option>
                    ))}
                  </select>
                </div>

                <div className="w-[100px]">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Quantity</label>
                  <Input
                    type="number"
                    value={item.quantity_requested}
                    onChange={(e) => handleItemChange(item.id, 'quantity_requested', e.target.value)}
                    min="1"
                    required
                  />
                </div>
                
                {orderItems.length > 1 && (
                  <button 
                    type="button" 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-3 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
