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

interface UserOption { id: string; name: string; username: string; }
interface MacRow { id: string; macAddress: string; label?: string; isApproved: boolean; createdAt?: string; }
interface DeviceRow { id: string; deviceId: string; platform?: string; model?: string; isApproved?: boolean; lastActiveAt?: string; userName?: string; username?: string; }

export const DeviceAndMacManagementPage: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [macs, setMacs] = useState<MacRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);

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
      }
      try {
        const devRes = await api.get(`/api/devices?userId=${selectedUserId}`, { headers });
        setDevices(devRes.data?.data?.items || devRes.data?.data || []);
      } catch (e) {
        console.error('Failed to load devices', e);
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
    } catch (e) {
      console.error('Failed to add MAC', e);
    }
  };

  const removeMac = async (id: string) => {
    try {
      await api.delete(`/api/security/mac-addresses/${id}`, { headers });
      setMacs(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error('Failed to remove MAC', e);
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
              {macs.map(m => (
                <div key={m.id} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono">{m.macAddress}</div>
                    {m.label && <div className="text-sm text-gray-600">{m.label}</div>}
                  </div>
                  <button className="text-red-600" onClick={() => removeMac(m.id)}>Remove</button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-medium mb-2">Registered Devices</h2>
            <div className="border rounded divide-y">
              {devices.length === 0 && <div className="p-3 text-sm text-gray-600">No devices found.</div>}
              {devices.map(d => (
                <div key={d.id} className="p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono">{d.deviceId}</div>
                    <div className="text-sm text-gray-600">{d.platform || 'UNKNOWN'} {d.model || ''}</div>
                    <div className="text-xs">Approved: {d.isApproved ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!d.isApproved && (
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={async () => {
                          try {
                            await api.post(`/api/devices/${d.id}/approve`, {}, { headers });
                            const devRes = await api.get(`/api/devices?userId=${selectedUserId}`, { headers });
                            setDevices(devRes.data?.data?.items || devRes.data?.data?.devices || []);
                          } catch (e) {
                            console.error('Approve failed', e);
                          }
                        }}
                      >
                        Approve
                      </button>
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
                              } catch (e) {
                                console.error('Reject failed', e);
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

