import React, { useState, useEffect } from 'react';
import { Search, Loader } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { Investor } from '../../types';
import { userService } from '../../services/userService';

export const InvestorsPage: React.FC = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [stages, setStages]       = useState<string[]>([]);
  const [selStage, setSelStage]   = useState('');

  useEffect(() => {
    userService.getInvestors()
      .then(data => {
        setInvestors(data);
        const allStages = Array.from(new Set(data.flatMap(i => i.investmentStage)));
        setStages(allStages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = investors.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q || inv.name.toLowerCase().includes(q) || inv.bio.toLowerCase().includes(q) ||
      inv.investmentInterests.some(i => i.toLowerCase().includes(q));
    const matchStage = !selStage || inv.investmentStage.includes(selStage);
    return matchSearch && matchStage;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader size={28} className="animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input placeholder="Search investors..." value={search} onChange={e => setSearch(e.target.value)} fullWidth startAdornment={<Search size={18} />} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Stage:</span>
          {['', ...stages].map(s => (
            <Badge
              key={s || 'all'}
              variant={selStage === s ? 'primary' : 'gray'}
              className="cursor-pointer"
              onClick={() => setSelStage(s)}
            >{s || 'All'}</Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(inv => <InvestorCard key={inv.id} investor={inv} />)}
      </div>

      {filtered.length === 0 && (
        <Card><CardBody className="text-center py-12 text-gray-500">No investors match your search.</CardBody></Card>
      )}
    </div>
  );
};
