import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import type { Fisher, Vessel, LandingSite, FishingLicense, BoatOwner, CrewMember } from '../types';
import { formatDate, titleCase } from '../lib/format';
import {
  Users, Search, Phone, MapPin, Shield, Anchor, X, Calendar,
  User, Briefcase, AlertCircle, Fish, Award, XCircle, CheckCircle2, Plus,
} from 'lucide-react';

const emptyFisherForm = {
  full_name: '',
  national_id: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  bmu: '',
  bmu_role: '',
  fishing_experience_years: '',
  vessel_id: '',
  landing_site_id: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  active: true,
};

const emptyLicenseForm = {
  license_number: '',
  license_type: '',
  fisher_id: '',
  vessel_id: '',
  zone_id: '',
  issue_date: '',
  expiry_date: '',
  status: 'active',
  fee_paid: '',
  issued_by: '',
  conditions: '',
};

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyFisherForm);
  const [licenseFormData, setLicenseFormData] = useState(emptyLicenseForm);

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

  const handleAddFisher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formData.full_name.trim()) {
      setFormError('Full name is required.');
      return;
    }

    setSaving(true);

    const payload = {
      full_name: formData.full_name.trim(),
      national_id: formData.national_id.trim() || null,
      phone: formData.phone.trim() || null,
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      bmu: formData.bmu.trim() || null,
      bmu_role: formData.bmu_role.trim() || null,
      fishing_experience_years: formData.fishing_experience_years ? Number(formData.fishing_experience_years) : null,
      vessel_id: formData.vessel_id || null,
      landing_site_id: formData.landing_site_id || null,
      emergency_contact_name: formData.emergency_contact_name.trim() || null,
      emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
      emergency_contact_relation: formData.emergency_contact_relation.trim() || null,
      active: formData.active,
    };

    const { data, error } = await supabase.from('fishers').insert([payload]).select('*').single();

    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setFishers(prev => [data as Fisher, ...prev].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    setShowAddModal(false);
    setFormData(emptyFisherForm);
  };

  const handleAddLicense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!licenseFormData.license_number.trim()) {
      setFormError('License number is required.');
      return;
    }

    if (!licenseFormData.fisher_id) {
      setFormError('Please select a fisher.');
      return;
    }

    if (!licenseFormData.issue_date || !licenseFormData.expiry_date) {
      setFormError('Issue date and expiry date are required.');
      return;
    }

    setSaving(true);

    const payload = {
      license_number: licenseFormData.license_number.trim(),
      license_type: licenseFormData.license_type || 'commercial',
      fisher_id: licenseFormData.fisher_id || null,
      vessel_id: licenseFormData.vessel_id || null,
      zone_id: licenseFormData.zone_id || null,
      issue_date: licenseFormData.issue_date,
      expiry_date: licenseFormData.expiry_date,
      status: licenseFormData.status,
      fee_paid: licenseFormData.fee_paid ? Number(licenseFormData.fee_paid) : null,
      issued_by: licenseFormData.issued_by.trim() || null,
      conditions: licenseFormData.conditions.trim() || null,
    };

    const { data, error } = await supabase.from('fishing_licenses').insert([payload]).select('*').single();

    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setLicenses(prev => [data as FishingLicense, ...prev].sort((a, b) => b.issue_date.localeCompare(a.issue_date)));
    setShowLicenseModal(false);
    setLicenseFormData(emptyLicenseForm);
  };

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, BMU, or national ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 outline-none text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4" />
              Add Fisher
            </button>
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
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setShowLicenseModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4" />
              Add License
            </button>
          </div>

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

      {showLicenseModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLicenseModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add Fishing License</h2>
              <button onClick={() => setShowLicenseModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddLicense} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">License Number</span>
                  <input
                    required
                    value={licenseFormData.license_number}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">License Type</span>
                  <select
                    value={licenseFormData.license_type}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, license_type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  >
                    <option value="">Select type</option>
                    <option value="commercial">Commercial</option>
                    <option value="artisanal">Artisanal</option>
                    <option value="recreational">Recreational</option>
                    <option value="special">Special</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Fisher</span>
                  <select
                    value={licenseFormData.fisher_id}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, fisher_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  >
                    <option value="">Select fisher</option>
                    {fishers.map(fisher => (
                      <option key={fisher.id} value={fisher.id}>{fisher.full_name}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Vessel</span>
                  <select
                    value={licenseFormData.vessel_id}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, vessel_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  >
                    <option value="">Select vessel</option>
                    {vessels.map(vessel => (
                      <option key={vessel.id} value={vessel.id}>{vessel.vessel_name}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Zone</span>
                  <select
                    value={licenseFormData.zone_id}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, zone_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  >
                    <option value="">Select zone</option>
                    <option value="marine-zone-1">Marine Zone 1</option>
                    <option value="marine-zone-2">Marine Zone 2</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Status</span>
                  <select
                    value={licenseFormData.status}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Issue Date</span>
                  <input
                    type="date"
                    required
                    value={licenseFormData.issue_date}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Expiry Date</span>
                  <input
                    type="date"
                    required
                    value={licenseFormData.expiry_date}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Fee Paid (KES)</span>
                  <input
                    type="number"
                    min="0"
                    value={licenseFormData.fee_paid}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, fee_paid: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Issued By</span>
                  <input
                    value={licenseFormData.issued_by}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, issued_by: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="font-medium text-slate-700">Conditions</span>
                  <textarea
                    rows={3}
                    value={licenseFormData.conditions}
                    onChange={(e) => setLicenseFormData(prev => ({ ...prev, conditions: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLicenseModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add New Fisher</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddFisher} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Full Name</span>
                  <input
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">National ID</span>
                  <input
                    value={formData.national_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Phone</span>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Gender</span>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Date of Birth</span>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Years of Experience</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.fishing_experience_years}
                    onChange={(e) => setFormData(prev => ({ ...prev, fishing_experience_years: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">BMU</span>
                  <input
                    value={formData.bmu}
                    onChange={(e) => setFormData(prev => ({ ...prev, bmu: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">BMU Role</span>
                  <input
                    value={formData.bmu_role}
                    onChange={(e) => setFormData(prev => ({ ...prev, bmu_role: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Landing Site</span>
                  <select
                    value={formData.landing_site_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, landing_site_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  >
                    <option value="">Select landing site</option>
                    {landingSites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Vessel</span>
                  <select
                    value={formData.vessel_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, vessel_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  >
                    <option value="">Select vessel</option>
                    {vessels.map(vessel => (
                      <option key={vessel.id} value={vessel.id}>{vessel.vessel_name} ({vessel.registration_id})</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Emergency Contact</span>
                  <input
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Emergency Phone</span>
                  <input
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>

                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="font-medium text-slate-700">Emergency Contact Relation</span>
                  <input
                    value={formData.emergency_contact_relation}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_relation: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                Active fisher
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Fisher'}
                </button>
              </div>
            </form>
          </div>
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
