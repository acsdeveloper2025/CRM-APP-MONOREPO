import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

interface UserOption { id: string; name: string; username: string; }
interface MacRow { id: string; macAddress: string; label?: string; isApproved: boolean; createdAt?: string; }
interface DeviceRow { id: string; deviceId: string; platform?: string; model?: string; isApproved?: boolean; lastActiveAt?: string; userName?: string; username?: string; }

export const DeviceAndMacManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [macs, setMacs] = useState<MacRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);

  const [macSearch, setMacSearch] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');

  const [newMac, setNewMac] = useState<{ macAddress: string; label?: string }>({ macAddress: '', label: '' });

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  useEffect(() => {
    // Load minimal users list for selection
    (async () => {
      try {
        const res = await api.get('/api/users?limit=100&page=1', { headers });
        const rows = res.data?.data?.users || res.data?.data || [];
        setUsers(rows.map((u: any) => ({ id: u.id, name: u.name, username: u.username })));
      } catch (e) {
        console.error('Failed to load users', e);
      }
    })();
  }, [headers]);

  useEffect(() => {
    if (!selectedUserId) return;
    (async () => {
      try {
        const macRes = await api.get(`/api/security/mac-addresses/${selectedUserId}`, { headers });
        setMacs(macRes.data?.data || []);
      } catch (e) {
        console.error('Failed to load MACs', e);
        toast.error('Failed to load MAC addresses');
      }
      try {
        const devRes = await api.get(`/api/devices?userId=${selectedUserId}`, { headers });
        setDevices(devRes.data?.data?.items || devRes.data?.data || []);
      } catch (e) {
        console.error('Failed to load devices', e);
        toast.error('Failed to load devices');
      }
    })();
  }, [selectedUserId, headers]);

  const addMac = async () => {
    if (!selectedUserId || !newMac.macAddress) return;
    try {
      await api.post('/api/security/mac-addresses', { userId: selectedUserId, macAddress: newMac.macAddress, label: newMac.label }, { headers });
      setNewMac({ macAddress: '', label: '' });
      const macRes = await api.get(`/api/security/mac-addresses/${selectedUserId}`, { headers });
      setMacs(macRes.data?.data || []);
      toast.success('MAC address added');
    } catch (e) {
      console.error('Failed to add MAC', e);
      toast.error('Failed to add MAC');
    }
  };

  const removeMac = async (id: string) => {
    try {
      await api.delete(`/api/security/mac-addresses/${id}`, { headers });
      setMacs(prev => prev.filter(m => m.id !== id));
      toast.success('MAC address removed');
    } catch (e) {
      console.error('Failed to remove MAC', e);
      toast.error('Failed to remove MAC');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Device & MAC Management</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Select User</label>
        <select className="border rounded px-3 py-2 w-full max-w-md" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
          <option value="">-- Choose a user --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
          ))}
        </select>
      </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                className="border rounded px-3 py-2 flex-1"
                placeholder="Search MAC (supports partial)"
                value={macSearch}
                onChange={e => setMacSearch(e.target.value)}
              />
            </div>


      {selectedUserId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="font-medium mb-2">Whitelisted MAC Addresses</h2>
            <div className="flex gap-2 mb-4">
              <input
                className="border rounded px-3 py-2 flex-1"
                placeholder="Enter MAC (e.g., AA:BB:CC:DD:EE:FF)"
                value={newMac.macAddress}
                onChange={e => setNewMac(n => ({ ...n, macAddress: e.target.value }))}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Label (optional)"
                value={newMac.label}
                onChange={e => setNewMac(n => ({ ...n, label: e.target.value }))}
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={addMac}>Add</button>
            </div>
            <div className="border rounded divide-y">
              {macs.length === 0 && <div className="p-3 text-sm text-gray-600">No MACs registered.</div>}
            <div className="flex items-center gap-2 mb-2">
              <input
                className="border rounded px-3 py-2 flex-1"
                placeholder="Search device ID/model/platform"
                value={deviceSearch}
                onChange={e => setDeviceSearch(e.target.value)}
              />
              <select
                className="border rounded px-2 py-2"
                value={deviceFilter}
                onChange={e => setDeviceFilter(e.target.value as any)}
              >
                <option value="ALL">All</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

              {macs
                .filter(m => !macSearch || m.macAddress.toLowerCase().includes(macSearch.toLowerCase()) || (m.label || '').toLowerCase().includes(macSearch.toLowerCase()))
                .map(m => (
                <div key={m.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono flex items-center gap-2">
                      {m.macAddress}
                      <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => { navigator.clipboard.writeText(m.macAddress); toast.success('MAC copied'); }}
                      >Copy</button>
                    </div>
                    {m.label && <div className="text-sm text-gray-600">{m.label}</div>}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-red-600">Remove</button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove MAC {m.macAddress}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove this MAC address from the user's whitelist.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => removeMac(m.id)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-medium mb-2">Registered Devices</h2>
            <div className="border rounded divide-y">
              {devices.length === 0 && <div className="p-3 text-sm text-gray-600">No devices found.</div>}
              {devices
                .filter(d => deviceFilter === 'ALL' || (deviceFilter === 'APPROVED' ? !!d.isApproved : !d.isApproved))
                .filter(d => !deviceSearch ||
                  d.deviceId.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                  (d.platform || '').toLowerCase().includes(deviceSearch.toLowerCase()) ||
                  (d.model || '').toLowerCase().includes(deviceSearch.toLowerCase())
                )
                .map(d => (
                <div key={d.id} className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono flex items-center gap-2">
                      {d.deviceId}
                      <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => { navigator.clipboard.writeText(d.deviceId); toast.success('Device ID copied'); }}
                      >Copy</button>
                    </div>
                    <div className="text-sm text-gray-600">{d.platform || 'UNKNOWN'} {d.model || ''}</div>
                    <div className="text-xs">Approved: {d.isApproved ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!d.isApproved && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Approve device {d.deviceId}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will approve this device for {d.userName || d.username || 'the user'} and grant access for future logins.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-green-600 hover:bg-green-700"
                              onClick={async () => {
                                try {
                                  await api.post(`/api/devices/${d.id}/approve`, {}, { headers });
                                  const devRes = await api.get(`/api/devices?userId=${selectedUserId}`, { headers });
                                  setDevices(devRes.data?.data?.items || devRes.data?.data?.devices || []);
                                  toast.success('Device approved');
                                } catch (e) {
                                  console.error('Approve failed', e);
                                  toast.error('Failed to approve device');
                                }
                              }}
                            >
                              Approve Device
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject device {d.deviceId}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will deactivate and revoke this device's access for {d.userName || d.username || 'the user'}. You can provide an optional reason below.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="mt-2">
                          <label className="block text-sm mb-1">Reason (optional)</label>
                          <textarea id={`reject-reason-${d.id}`} className="w-full border rounded px-3 py-2" placeholder="Enter a reason" />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={async () => {
                              const el = document.getElementById(`reject-reason-${d.id}`) as HTMLTextAreaElement | null;
                              const reason = el?.value || '';
                              try {
                                await api.post(`/api/devices/${d.id}/reject`, { reason }, { headers });
                                const devRes = await api.get(`/api/devices?userId=${selectedUserId}`, { headers });
                                setDevices(devRes.data?.data?.items || devRes.data?.data?.devices || []);
                                toast.success('Device rejected');
                              } catch (e) {
                                console.error('Reject failed', e);
                                toast.error('Failed to reject device');
                              }
                            }}
                          >
                            Reject Device
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

