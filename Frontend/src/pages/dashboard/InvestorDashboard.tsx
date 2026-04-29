import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Filter, Search, PlusCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { Entrepreneur, CollaborationRequest } from '../../types';
import { userService } from '../../services/userService';
import { collaborationService } from '../../services/collaborationService';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [entrepreneurs, setEntrepreneurs]   = useState<Entrepreneur[]>([]);
  const [sentRequests, setSentRequests]     = useState<CollaborationRequest[]>([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [entr, reqs] = await Promise.all([
          userService.getEntrepreneurs(),
          collaborationService.getRequests(),
        ]);
        setEntrepreneurs(entr);
        setSentRequests(reqs);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

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

  const industries = Array.from(new Set(entrepreneurs.map(e => e.industry)));

  const filtered = entrepreneurs.filter(e => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      e.name.toLowerCase().includes(q) ||
      e.startupName.toLowerCase().includes(q) ||
      e.industry.toLowerCase().includes(q) ||
      e.pitchSummary.toLowerCase().includes(q);
    const matchIndustry = selectedIndustries.length === 0 || selectedIndustries.includes(e.industry);
    return matchSearch && matchIndustry;
  });

  const toggleIndustry = (ind: string) =>
    setSelectedIndustries(prev =>
      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        <Link to="/entrepreneurs">
          <Button leftIcon={<PlusCircle size={18} />}>View All Startups</Button>
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search startups, industries, or keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>
        <div className="w-full md:w-1/3 flex items-center space-x-2 flex-wrap gap-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {industries.map(ind => (
            <Badge
              key={ind}
              variant={selectedIndustries.includes(ind) ? 'primary' : 'gray'}
              className="cursor-pointer"
              onClick={() => toggleIndustry(ind)}
            >{ind}</Badge>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Your Connections</p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {sentRequests.filter(r => r.status === 'accepted').length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Entrepreneurs grid */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
        </CardHeader>
        <CardBody>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(e => (
                <EntrepreneurCard key={e.id} entrepreneur={e} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No startups match your filters</p>
              <Button variant="outline" className="mt-2" onClick={() => { setSearchQuery(''); setSelectedIndustries([]); }}>
                Clear filters
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
