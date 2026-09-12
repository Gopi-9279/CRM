import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { api } from '../lib/axios';
import { Activity, ClipboardList, Send, ShoppingCart } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    pendingOrders: 0,
    requestedTransfers: 0,
    assignedWorkOrders: 0,
    isLoading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, transfersRes, workOrdersRes] = await Promise.all([
          api.get('/orders'),
          api.get('/transfers'),
          api.get('/work-orders')
        ]);
        
        // Count statuses on frontend since we don't know for sure if all endpoints support filtering reliably
        const pendingOrders = ordersRes.data.data.filter((o: any) => o.status === 'PENDING').length;
        const requestedTransfers = transfersRes.data.data.filter((t: any) => t.status === 'REQUESTED').length;
        const assignedWorkOrders = workOrdersRes.data.data.filter((w: any) => w.status === 'ASSIGNED').length;

        setStats({
          pendingOrders,
          requestedTransfers,
          assignedWorkOrders,
          isLoading: false
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
        setStats(s => ({ ...s, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Mini CRP
            </h1>
            <nav className="flex space-x-4">
              <Link to="/inventory" className="text-sm font-medium text-text-secondary hover:text-primary">Inventory</Link>
              <Link to="/work-orders" className="text-sm font-medium text-text-secondary hover:text-primary">Work Orders</Link>
              <Link to="/internal-transfers" className="text-sm font-medium text-text-secondary hover:text-primary">Internal Transfers</Link>
              <Link to="/customer-orders" className="text-sm font-medium text-text-secondary hover:text-primary">Customer Orders</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-secondary">
              Logged in as {user?.name} ({user?.role})
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Welcome back, {user?.name}</h2>
          
          {stats.isLoading ? (
            <div className="text-text-secondary">Loading statistics...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <Link to="/customer-orders" className="block p-6 bg-surface border border-border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-md">
                    <ShoppingCart className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary uppercase">Pending Orders</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.pendingOrders}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-blue-500 flex items-center gap-1 font-medium">
                  View Customer Orders &rarr;
                </div>
              </Link>

              <Link to="/internal-transfers" className="block p-6 bg-surface border border-border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-md">
                    <Send className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary uppercase">Requested Transfers</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.requestedTransfers}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-orange-500 flex items-center gap-1 font-medium">
                  View Internal Transfers &rarr;
                </div>
              </Link>

              <Link to="/work-orders" className="block p-6 bg-surface border border-border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-md">
                    <ClipboardList className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary uppercase">Assigned Work Orders</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.assignedWorkOrders}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-purple-500 flex items-center gap-1 font-medium">
                  View Work Orders &rarr;
                </div>
              </Link>

            </div>
          )}

          <div className="mt-12 p-8 bg-surface border border-border rounded-lg">
            <h3 className="text-lg font-bold text-text-primary mb-2">Getting Started</h3>
            <p className="text-text-secondary mb-4">
              Use the navigation bar at the top to access the different modules of the Operations ERP. 
              Depending on your role ({user?.role}), you will have varying levels of access to create and process orders.
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-2">
              <li><strong>Inventory:</strong> View real-time stock levels across all locations and batches.</li>
              <li><strong>Work Orders:</strong> Consume materials to build finished goods.</li>
              <li><strong>Internal Transfers:</strong> Dispatch and receive goods between physical warehouse locations.</li>
              <li><strong>Customer Orders:</strong> View incoming sales orders and reserve inventory for fulfillment.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
