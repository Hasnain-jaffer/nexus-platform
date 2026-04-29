import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Building2, MapPin, FileText, DollarSign, Send, Loader } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { Entrepreneur } from '../../types';
import { userService } from '../../services/userService';
import { collaborationService } from '../../services/collaborationService';
import toast from 'react-hot-toast';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [entrepreneur, setEntrepreneur] = useState<Entrepreneur | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [profile, reqs] = await Promise.all([
          userService.getUserById(id),
          currentUser?.role === 'investor' ? collaborationService.getRequests() : Promise.resolve([]),
        ]);
        setEntrepreneur(profile as Entrepreneur);
        if (Array.isArray(reqs)) {
          setHasRequested(reqs.some((r: any) => r.entrepreneurId === id));
        }
      } catch {
        // 404 handled below by null check
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, currentUser]);

  const handleSendRequest = async () => {
    if (!id || !currentUser) return;
    setSending(true);
    try {
      await collaborationService.createRequest(
        id,
        `I'm interested in learning more about ${entrepreneur?.startupName} and would like to explore potential investment opportunities.`
      );
      setHasRequested(true);
      toast.success('Collaboration request sent!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={32} className="animate-spin text-primary-600" />
    </div>
  );

  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
      <Link to="/dashboard/investor">
        <Button variant="outline" className="mt-4">Back to Dashboard</Button>
      </Link>
    </div>
  );

  const isCurrentUser = currentUser?.id === entrepreneur.id;
  const isInvestor    = currentUser?.role === 'investor';

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">{entrepreneur.industry}</Badge>
                <Badge variant="gray">
                  <MapPin size={14} className="mr-1" />
                  {entrepreneur.location}
                </Badge>
              </div>
              <p className="mt-4 text-gray-600 max-w-xl">{entrepreneur.bio}</p>
            </div>
          </div>

          {!isCurrentUser && (
            <div className="mt-6 sm:mt-0 flex flex-col sm:items-end gap-2">
              <Button
                leftIcon={<MessageCircle size={18} />}
                variant="outline"
                onClick={() => navigate(`/chat/${entrepreneur.id}`)}
              >
                Message
              </Button>
              {isInvestor && (
                <Button
                  leftIcon={<Send size={18} />}
                  disabled={hasRequested || sending}
                  isLoading={sending}
                  onClick={handleSendRequest}
                >
                  {hasRequested ? 'Request Sent' : 'Send Request'}
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Details</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-start">
              <FileText size={18} className="text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Pitch Summary</p>
                <p className="text-sm text-gray-600 mt-1">{entrepreneur.pitchSummary}</p>
              </div>
            </div>
            <div className="flex items-start">
              <DollarSign size={18} className="text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Funding Needed</p>
                <p className="text-sm text-gray-600 mt-1">{entrepreneur.fundingNeeded}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-medium text-gray-900">Company Info</h2></CardHeader>
          <CardBody>
            <dl className="space-y-3 text-sm">
              {[
                ['Founded', entrepreneur.foundedYear],
                ['Team Size', `${entrepreneur.teamSize} people`],
                ['Industry', entrepreneur.industry],
                ['Location', entrepreneur.location],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
