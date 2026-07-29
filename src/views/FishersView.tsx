import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Fisher, Vessel, LandingSite, FishingLicense, BoatOwner, CrewMember } from '../types';
import { formatDate, titleCase } from '../lib/format';
import {
  Users, Search, Phone, MapPin, Shield, Anchor, X, Calendar,
  User, Briefcase, AlertCircle, Fish, Award, XCircle, CheckCircle2,
} from 'lucide-react';

export default function FishersView() {
  const [fishers, setFishers] = useState<Fisher[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [landingSites, setLandingSites] = useState<LandingSite[]>([]);
  const [licenses, setLicenses] = useState<FishingLicense[]>([]);
  const [boatOwners, setBoatOwners] = useState<BoatOwner[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFisher, setSelectedFisher] = useState<Fisher | null>(null);
  const [activeTab, setActiveTab] = useState<'fishers' | 'licenses' | 'owners'>('fishers');

  useEffect(() => {
    async function fetchData() {
      const [f, v, ls, lic, bo, cr] = await Promise.all([
        supabase.from('fishers').select('*').order('full_name'),
        supabase.from('vessels').select('*'),
        supabase.from('landing_sites').select('*'),
        supabase.from('fishing_licenses').select('*').order('issue_date', { ascending: false }),
        supabase.from('boat_owners').select('*'),
        supabase.from('crew_members').select('*'),
      ]);
      setFishers(f.data || []);
      setVessels(v.data || []);
      setLandingSites(ls.data || []);
      setLicenses(lic.data || []);
      setBoatOwners(bo.data || []);
      setCrewMembers(cr.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredFishers = fishers.filter(f =>
    f.full_name.toLowerCase().includes(search.toLowerCase()) ||
    f.bmu?.toLowerCase().includes(search.toLowerCase()) ||
    f.national_id?.includes(search)
  );

  const getVessel = (id: string | null) => vessels.find(v => v.id === id);
  const getLandingSite = (id: string | null) => landingSites.find(ls => ls.id === id);
  const getLicensesForFisher = (fisherId: string) => licenses.filter(l => l.fisher_id === fisherId);
  const getCrewForVessel = (vesselId: string) => crewMembers.filter(c => c.vessel_id === vesselId);
  const getOwnerForVessel = (vesselId: string) => boatOwners.find(bo => bo.vessel_id === vesselId);

  const activeLicenses = licenses.filter(l => l.status === 'active').length;
  const expiredLicenses = licenses.filter(l => l.status === 'expired').length;
  const suspendedLicenses = licenses.filter(l => l.status === 'suspended' || l.status === 'revoked').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fisher Registration</h1>
        <p className="text-sm text-slate-500">Fisher profiles, vessel ownership, crew, and fishing licenses at Kilifi Old Ferry hub</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Registered Fishers</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{fishers.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium">Active Licenses</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{activeLicenses}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium">Expired Licenses</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{expiredLicenses}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium">Suspended/Revoked</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{suspendedLicenses}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: 'fishers', label: 'Fisher Profiles', icon: Users },
          { key: 'licenses', label: 'Fishing Licenses', icon: Award },
          { key: 'owners', label: 'Boat Owners', icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'fishers' | 'licenses' | 'owners')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'fishers' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, BMU, or national ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 outline-none text-sm"
            />
          </div>

          {/* Fisher Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFishers.map((fisher) => {
              const vessel = getVessel(fisher.vessel_id);
              const landingSite = getLandingSite(fisher.landing_site_id);
              return (
                <button
                  key={fisher.id}
                  onClick={() => setSelectedFisher(fisher)}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-cyan-300 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{fisher.full_name}</div>
                      <div className="text-xs text-slate-500">{fisher.bmu}</div>
                    </div>
                    {fisher.active ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Active</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">Inactive</span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {vessel && (
                      <div className="flex items-center gap-2">
                        <Anchor className="w-3.5 h-3.5 text-slate-400" />
                        <span>{vessel.vessel_name} · {vessel.registration_id}</span>
                      </div>
                    )}
                    {landingSite && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{landingSite.name}</span>
                      </div>
                    )}
                    {fisher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fisher.phone}</span>
                      </div>
                    )}
                    {fisher.bmu_role && (
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>BMU Role: {fisher.bmu_role}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'licenses' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">License #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Fisher/Vessel</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Issue Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Expiry</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Fee (KES)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {licenses.map((lic) => {
                const fisher = fishers.find(f => f.id === lic.fisher_id);
                const vessel = vessels.find(v => v.id === lic.vessel_id);
                return (
                  <tr key={lic.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{lic.license_number}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{titleCase(lic.license_type)}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {fisher?.full_name || vessel?.vessel_name || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{formatDate(lic.issue_date)}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{formatDate(lic.expiry_date)}</td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            lic.status === 'active' ? '#dcfce7' :
                            lic.status === 'expired' ? '#fef3c7' :
                            '#fee2e2',
                          color:
                            lic.status === 'active' ? '#16a34a' :
                            lic.status === 'expired' ? '#d97706' :
                            '#dc2626',
                        }}
                      >
                        {titleCase(lic.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{lic.fee_paid?.toLocaleString() || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'owners' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Owner Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">National ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vessel</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Ownership %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {boatOwners.map((owner) => {
                const vessel = getVessel(owner.vessel_id);
                return (
                  <tr key={owner.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{owner.full_name}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{owner.national_id || '—'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{owner.phone || '—'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {vessel ? `${vessel.vessel_name} (${vessel.registration_id})` : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{owner.ownership_percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fisher Detail Modal */}
      {selectedFisher && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFisher(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Fisher Profile</h2>
              <button onClick={() => setSelectedFisher(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <FisherDetailSection fisher={selectedFisher} vessel={getVessel(selectedFisher.vessel_id)} landingSite={getLandingSite(selectedFisher.landing_site_id)} licenses={getLicensesForFisher(selectedFisher.id)} crew={selectedFisher.vessel_id ? getCrewForVessel(selectedFisher.vessel_id) : []} owner={selectedFisher.vessel_id ? getOwnerForVessel(selectedFisher.vessel_id) : undefined} fishers={fishers} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FisherDetailSection({
  fisher, vessel, landingSite, licenses, crew, owner, fishers,
}: {
  fisher: Fisher;
  vessel?: Vessel;
  landingSite?: LandingSite;
  licenses: FishingLicense[];
  crew: CrewMember[];
  owner?: BoatOwner;
  fishers: Fisher[];
}) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
          <User className="w-8 h-8 text-cyan-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{fisher.full_name}</h3>
          <div className="text-sm text-slate-500">
            {fisher.bmu} · {fisher.bmu_role || 'Member'}
          </div>
          {fisher.active && (
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              Active Fisher
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DetailItem icon={Phone} label="Phone" value={fisher.phone} />
        <DetailItem icon={User} label="National ID" value={fisher.national_id} />
        <DetailItem icon={Calendar} label="Date of Birth" value={fisher.date_of_birth ? formatDate(fisher.date_of_birth) : null} />
        <DetailItem icon={Fish} label="Experience" value={fisher.fishing_experience_years ? `${fisher.fishing_experience_years} years` : null} />
      </div>

      {/* Vessel Info */}
      {vessel && (
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Anchor className="w-4 h-4 text-cyan-600" />
            <h4 className="text-sm font-semibold text-slate-900">Vessel Assignment</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900">{vessel.vessel_name}</span></div>
            <div><span className="text-slate-500">Registration:</span> <span className="font-medium text-slate-900">{vessel.registration_id}</span></div>
            <div><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-900">{titleCase(vessel.vessel_type)}</span></div>
            <div><span className="text-slate-500">License:</span> <span className="font-medium text-slate-900">{titleCase(vessel.license_status)}</span></div>
          </div>
          {owner && (
            <div className="mt-2 pt-2 border-t border-slate-200 text-sm">
              <span className="text-slate-500">Owner:</span> <span className="font-medium text-slate-900">{owner.full_name} ({owner.ownership_percentage}%)</span>
            </div>
          )}
        </div>
      )}

      {/* Landing Site */}
      {landingSite && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500">Landing Site:</span>
          <span className="font-medium text-slate-900">{landingSite.name}</span>
          <span className="text-slate-400">· {landingSite.bmu}</span>
        </div>
      )}

      {/* Emergency Contact */}
      {fisher.emergency_contact_name && (
        <div className="bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-semibold text-red-900">Emergency Contact</h4>
          </div>
          <div className="text-sm text-slate-700">
            <div><span className="font-medium">{fisher.emergency_contact_name}</span> ({fisher.emergency_contact_relation})</div>
            <div className="text-slate-500">{fisher.emergency_contact_phone}</div>
          </div>
        </div>
      )}

      {/* Licenses */}
      {licenses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-cyan-600" />
            <h4 className="text-sm font-semibold text-slate-900">Fishing Licenses</h4>
          </div>
          <div className="space-y-2">
            {licenses.map(lic => (
              <div key={lic.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                <div>
                  <div className="font-medium text-slate-900">{lic.license_number}</div>
                  <div className="text-xs text-slate-500">{titleCase(lic.license_type)} · {formatDate(lic.issue_date)} → {formatDate(lic.expiry_date)}</div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: lic.status === 'active' ? '#dcfce7' : lic.status === 'expired' ? '#fef3c7' : '#fee2e2',
                    color: lic.status === 'active' ? '#16a34a' : lic.status === 'expired' ? '#d97706' : '#dc2626',
                  }}
                >
                  {titleCase(lic.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crew */}
      {crew.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyan-600" />
            <h4 className="text-sm font-semibold text-slate-900">Crew Members</h4>
          </div>
          <div className="space-y-1">
            {crew.map(c => {
              const crewFisher = fishers.find(f => f.id === c.fisher_id);
              return (
                <div key={c.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-slate-900">{crewFisher?.full_name || 'Unknown'}</span>
                  <span className="text-slate-500">{c.role || 'Crew'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium text-slate-900">{value || '—'}</div>
    </div>
  );
}
