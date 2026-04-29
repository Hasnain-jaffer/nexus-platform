import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle, Loader } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CollaborationRequestCard } from '../../components/collaboration/CollaborationRequestCard';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import { CollaborationRequest, Investor } from '../../types';
import { collaborationService } from '../../services/collaborationService';
import { userService } from '../../services/userService';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests]     = useState<CollaborationRequest[]>([]);
  const [investors, setInvestors]   = useState<Investor[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [reqs, invs] = await Promise.all([
          collaborationService.getRequests(),
          userService.getInvestors(),
        ]);
        setRequests(reqs);
        setInvestors(invs.slice(0, 3));
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleRequestStatusUpdate = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await collaborationService.updateStatus(requestId, status);
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
    } catch {
      // toast already shown by service interceptor
    }
  };

  if (!user) return null;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={32} className="animate-spin text-primary-600" />
    </div>
  );

  if (error) return (
    <div className="text-center py-12 text-red-500">
      <AlertCircle size={32} className="mx-auto mb-2" />
      <p>{error}</p>
    </div>
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />}>Find Investors</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Requests</p>
                <h3 className="text-xl font-semibold text-primary-900">{pendingRequests.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {requests.filter(r => r.status === 'accepted').length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">2</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-success-50 border border-success-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <TrendingUp size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Profile Views</p>
                <h3 className="text-xl font-semibold text-success-900">24</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Collaboration Requests</h2>
              <Badge variant="primary">{pendingRequests.length} pending</Badge>
            </CardHeader>
            <CardBody>
              {requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map(req => (
                    <CollaborationRequestCard
                      key={req.id}
                      request={req}
                      onStatusUpdate={handleRequestStatusUpdate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No collaboration requests yet</p>
                  <p className="text-sm text-gray-500 mt-1">When investors are interested, their requests will appear here</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
              <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </CardHeader>
            <CardBody className="space-y-4">
              {investors.map(inv => (
                <InvestorCard key={inv.id} investor={inv} showActions={false} />
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
