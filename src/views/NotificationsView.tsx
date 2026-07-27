import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';
import { formatDate, titleCase, getColor } from '../lib/format';
import {
  Bell, AlertTriangle, Calendar, ShieldAlert, FileText, Users,
  Clock, Mail, MessageSquare, Smartphone, X,
} from 'lucide-react';

const TYPE_ICONS: Record<string, typeof Bell> = {
  closed_season: Calendar,
  weather_warning: AlertTriangle,
  illegal_fishing: ShieldAlert,
  license_renewal: FileText,
  new_regulation: FileText,
  conservation_notice: Bell,
  meeting_notice: Users,
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  low: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

const CHANNEL_ICONS: Record<string, typeof Bell> = {
  sms: Smartphone,
  email: Mail,
  in_app: MessageSquare,
};

export default function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [selected, setSelected] = useState<Notification | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('notifications').select('*').order('sent_at', { ascending: false });
      setNotifications(data || []);
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

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'critical') return n.priority === 'critical';
    return true;
  });

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">Closed seasons, weather warnings, illegal fishing alerts, and license reminders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Bell className="w-4 h-4" />
            <span className="text-xs font-medium">Total Notifications</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{notifications.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Mail className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium">Unread</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{unreadCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'critical', label: 'Critical' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as 'all' | 'unread' | 'critical')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-cyan-500 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.map(n => {
          const Icon = TYPE_ICONS[n.notification_type] || Bell;
          const colors = PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.medium;
          return (
            <div
              key={n.id}
              onClick={() => {
                setSelected(n);
                if (!n.read) markAsRead(n.id);
              }}
              className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                n.read ? 'bg-white border-slate-200' : `${colors.bg} ${colors.border}`
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                      )}
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${getColor(n.priority)}15`, color: getColor(n.priority) }}
                    >
                      {titleCase(n.priority)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(n.sent_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {titleCase(n.target_audience)}
                    </span>
                    <div className="flex items-center gap-1">
                      {n.delivery_channels.map(ch => {
                        const ChannelIcon = CHANNEL_ICONS[ch] || MessageSquare;
                        return <ChannelIcon key={ch} className="w-3 h-3" />;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Notification Detail</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Title</div>
                <div className="text-lg font-semibold text-slate-900">{selected.title}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Message</div>
                <div className="text-sm text-slate-700">{selected.message}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Type</div>
                  <div className="text-sm text-slate-700">{titleCase(selected.notification_type)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Priority</div>
                  <div className="text-sm text-slate-700">{titleCase(selected.priority)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Target Audience</div>
                  <div className="text-sm text-slate-700">{titleCase(selected.target_audience)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Sent At</div>
                  <div className="text-sm text-slate-700">{formatDate(selected.sent_at)}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-2">Delivery Channels</div>
                <div className="flex gap-2">
                  {selected.delivery_channels.map(ch => {
                    const ChannelIcon = CHANNEL_ICONS[ch] || MessageSquare;
                    return (
                      <div key={ch} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-700">
                        <ChannelIcon className="w-3.5 h-3.5" />
                        {ch.replace('_', ' ')}
                      </div>
                    );
                  })}
                </div>
              </div>
              {selected.created_by && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">Created By</div>
                  <div className="text-sm text-slate-700">{selected.created_by}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
