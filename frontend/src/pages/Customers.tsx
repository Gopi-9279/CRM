import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import { Badge } from '../components/ui/Badge';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/users');
      setCustomers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="primary">ADMIN</Badge>;
      case 'SALES':
        return <Badge variant="info">SALES</Badge>;
      case 'OPERATIONS':
        return <Badge variant="warning">OPERATIONS</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">Customers</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-surface shadow overflow-hidden sm:rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-text-secondary">Loading...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-text-secondary">No customers found</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{c.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{getRoleBadge(c.role?.name)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
