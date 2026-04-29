import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, DollarSign, TrendingUp, Briefcase, Loader } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Investor } from '../../types';
import { userService } from '../../services/userService';

export const InvestorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!id) return;
    userService.getUserById(id)
      .then(u => setInvestor(u as Investor))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={32} className="animate-spin text-primary-600" />
    </div>
  );

  if (!investor || investor.role !== 'investor') return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900">Investor not found</h2>
      <Link to="/dashboard/entrepreneur">
        <Button variant="outline" className="mt-4">Back to Dashboard</Button>
      </Link>
    </div>
  );

  const isCurrentUser = currentUser?.id === investor.id;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={investor.avatarUrl}
              alt={investor.name}
              size="xl"
              status={investor.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{investor.name}</h1>
              <p className="text-gray-600 mt-1">Investor · {investor.totalInvestments} investments</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {investor.investmentStage.map(s => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
              <p className="mt-4 text-gray-600 max-w-xl">{investor.bio}</p>
            </div>
          </div>
          {!isCurrentUser && (
            <div className="mt-6 sm:mt-0">
              <Button
                leftIcon={<MessageCircle size={18} />}
                onClick={() => navigate(`/chat/${investor.id}`)}
              >
                Message
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Focus</h2></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
              <div className="flex flex-wrap gap-2">
                {investor.investmentInterests.map(i => <Badge key={i} variant="primary">{i}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Stage</p>
              <div className="flex flex-wrap gap-2">
                {investor.investmentStage.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Details</h2></CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ['Total Investments', investor.totalInvestments],
                ['Min Ticket', investor.minimumInvestment],
                ['Max Ticket', investor.maximumInvestment],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
            {investor.portfolioCompanies?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Portfolio</p>
                <div className="flex flex-wrap gap-2">
                  {investor.portfolioCompanies.map(c => <Badge key={c} variant="gray">{c}</Badge>)}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
