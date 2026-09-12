import { useState, useEffect } from 'react';
import { api } from '../../lib/axios';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateWorkOrderModal({ isOpen, onClose, onSuccess }: CreateWorkOrderModalProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFormData();
    }
  }, [isOpen]);

  const fetchFormData = async () => {
    try {
      const [locationsRes, itemsRes, usersRes] = await Promise.all([
        api.get('/locations'),
        api.get('/items'),
        api.get('/users')
      ]);
      setLocations(locationsRes.data.data || []);
      setItems(itemsRes.data.data || []);
      // Filter for OPERATIONS users
      const opsUsers = (usersRes.data.data || []).filter((u: any) => u.role?.name === 'OPERATIONS' || u.role?.name === 'ADMIN');
      setUsers(opsUsers);
    } catch (err) {
      console.error('Failed to fetch form data', err);
      setError('Failed to load form data.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedLocation || !selectedItem || !selectedUser || !quantity) {
      setError('All fields are required.');
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/work-orders', {
        location_id: selectedLocation,
        item_id: selectedItem,
        assigned_user_id: selectedUser,
        required_quantity: Number(quantity)
      });
      onSuccess();
      onClose();
      // Reset form
      setSelectedLocation('');
      setSelectedItem('');
      setSelectedUser('');
      setQuantity('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || 'Failed to create work order.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Work Order">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Item</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            required
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Location</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            required
          >
            <option value="">Select Location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Assign To</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
          >
            <option value="">Select Operator</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name} ({user.role?.name})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Quantity Required</label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            required
          />
        </div>

        <div className="pt-4 flex justify-end space-x-3 border-t border-border mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Work Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
