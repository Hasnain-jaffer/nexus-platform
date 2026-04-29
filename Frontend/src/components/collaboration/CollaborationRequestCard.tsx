import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, MessageCircle } from 'lucide-react';
import { CollaborationRequest } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  request: CollaborationRequest;
  onStatusUpdate?: (requestId: string, status: 'accepted' | 'rejected') => void;
}

export const CollaborationRequestCard: React.FC<Props> = ({ request, onStatusUpdate }) => {
  const navigate = useNavigate();

  // FIX: was using findUserById(request.investorId) from mock data.
  // Now the API populates investor object directly on the request.
  const investor = request.investor;

  if (!investor) return null;

  const handleAccept  = () => onStatusUpdate?.(request.id, 'accepted');
  const handleReject  = () => onStatusUpdate?.(request.id, 'rejected');
  const handleMessage = () => navigate(`/chat/${investor.id}`);
  const handleProfile = () => navigate(`/profile/investor/${investor.id}`);

  const statusBadge = {
    pending:  <Badge variant="warning">Pending</Badge>,
    accepted: <Badge variant="success">Accepted</Badge>,
    rejected: <Badge variant="error">Declined</Badge>,
  }[request.status] ?? null;

  return (
    <Card className="transition-all duration-300">
      <CardBody className="flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <Avatar
              src={investor.avatarUrl}
              alt={investor.name}
              size="md"
              status={investor.isOnline ? 'online' : 'offline'}
              className="mr-3"
            />
            <div>
              <h3 className="text-md font-semibold text-gray-900">{investor.name}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          {statusBadge}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">{request.message}</p>
        </div>
      </CardBody>

      <CardFooter className="border-t border-gray-100 bg-gray-50">
        {request.status === 'pending' ? (
          <div className="flex justify-between w-full">
            <div className="space-x-2">
              <Button variant="outline" size="sm" leftIcon={<X size={16} />} onClick={handleReject}>Decline</Button>
              <Button variant="success" size="sm" leftIcon={<Check size={16} />} onClick={handleAccept}>Accept</Button>
            </div>
            <Button variant="primary" size="sm" leftIcon={<MessageCircle size={16} />} onClick={handleMessage}>Message</Button>
          </div>
        ) : (
          <div className="flex justify-between w-full">
            <Button variant="outline" size="sm" leftIcon={<MessageCircle size={16} />} onClick={handleMessage}>Message</Button>
            <Button variant="primary" size="sm" onClick={handleProfile}>View Profile</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
