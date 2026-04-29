import React, { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { Entrepreneur } from '../../types';
import { userService } from '../../services/userService';

export const EntrepreneursPage: React.FC = () => {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [industries, setIndustries]       = useState<string[]>([]);
  const [selIndustry, setSelIndustry]     = useState('');

  useEffect(() => {
    userService.getEntrepreneurs()
      .then(data => {
        setEntrepreneurs(data);
        setIndustries(Array.from(new Set(data.map(e => e.industry))));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = entrepreneurs.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.startupName.toLowerCase().includes(q) ||
      e.industry.toLowerCase().includes(q) || e.pitchSummary.toLowerCase().includes(q);
    const matchIndustry = !selIndustry || e.industry === selIndustry;
    return matchSearch && matchIndustry;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={28} className="animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Entrepreneurs</h1>
        <p className="text-gray-600">Discover promising startups seeking investment</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input placeholder="Search startups..." value={search} onChange={e => setSearch(e.target.value)} fullWidth startAdornment={<Search size={18} />} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Industry:</span>
          {['', ...industries].map(ind => (
            <Badge
              key={ind || 'all'}
              variant={selIndustry === ind ? 'primary' : 'gray'}
              className="cursor-pointer"
              onClick={() => setSelIndustry(ind)}
            >{ind || 'All'}</Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(e => <EntrepreneurCard key={e.id} entrepreneur={e} />)}
      </div>

      {filtered.length === 0 && (
        <Card><CardBody className="text-center py-12 text-gray-500">No entrepreneurs match your search.</CardBody></Card>
      )}
    </div>
  );
};
