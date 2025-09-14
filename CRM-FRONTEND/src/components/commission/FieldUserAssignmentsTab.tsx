import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { commissionManagementApi } from '../../services/commissionManagementApi';
import { FieldUserCommissionAssignment, CreateFieldUserCommissionAssignmentData } from '../../types/commission';
import { User } from '../../types/user';
import { RateType } from '../../types/rateType';
import { userApi } from '../../services/userApi';
import { rateTypeApi } from '../../services/rateTypeApi';

interface FieldUserAssignmentFormData {
  userId: string;
  rateTypeId: number;
  commissionAmount: number;
  currency: string;
  clientId?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export const FieldUserAssignmentsTab: React.FC = () => {
  const [assignments, setAssignments] = useState<FieldUserCommissionAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rateTypes, setRateTypes] = useState<RateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<FieldUserCommissionAssignment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterRateTypeId, setFilterRateTypeId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState<FieldUserAssignmentFormData>({
    userId: '',
    rateTypeId: 0,
    commissionAmount: 0,
    currency: 'INR'
  });

  useEffect(() => {
    loadData();
  }, [currentPage, searchTerm, filterUserId, filterRateTypeId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load assignments with filters
      const assignmentsResponse = await commissionManagementApi.getFieldUserCommissionAssignments({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        userId: filterUserId || undefined,
        rateTypeId: filterRateTypeId ? Number(filterRateTypeId) : undefined
      });

      setAssignments(assignmentsResponse.data);
      setTotalPages(assignmentsResponse.pagination.totalPages);

      // Load users and rate types for dropdowns
      const [usersResponse, rateTypesResponse] = await Promise.all([
        userApi.getUsers({ role: 'FIELD_AGENT', limit: 1000 }),
        rateTypeApi.getRateTypes({ isActive: true })
      ]);

      setUsers(usersResponse.data);
      setRateTypes(rateTypesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assignmentData: CreateFieldUserCommissionAssignmentData = {
        userId: formData.userId,
        rateTypeId: formData.rateTypeId,
        commissionAmount: formData.commissionAmount,
        currency: formData.currency,
        clientId: formData.clientId,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo
      };

      if (editingAssignment) {
        // Update logic would go here when implemented
        console.log('Update not implemented yet');
      } else {
        await commissionManagementApi.createFieldUserCommissionAssignment(assignmentData);
      }

      setShowForm(false);
      setEditingAssignment(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      rateTypeId: 0,
      commissionAmount: 0,
      currency: 'INR'
    });
  };

  const handleEdit = (assignment: FieldUserCommissionAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      userId: assignment.user_id,
      rateTypeId: assignment.rate_type_id,
      commissionAmount: Number(assignment.commission_amount),
      currency: assignment.currency,
      clientId: assignment.client_id || undefined,
      effectiveFrom: assignment.effective_from ? new Date(assignment.effective_from).toISOString().split('T')[0] : undefined,
      effectiveTo: assignment.effective_to ? new Date(assignment.effective_to).toISOString().split('T')[0] : undefined
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await commissionManagementApi.deleteFieldUserCommissionAssignment(id);
        loadData();
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  const exportData = () => {
    const csvContent = [
      ['User Name', 'Rate Type', 'Commission Amount', 'Currency', 'Effective From', 'Effective To', 'Status'].join(','),
      ...assignments.map(assignment => [
        assignment.user_name || '',
        assignment.rate_type_name || '',
        assignment.commission_amount,
        assignment.currency,
        assignment.effective_from ? new Date(assignment.effective_from).toLocaleDateString() : '',
        assignment.effective_to ? new Date(assignment.effective_to).toLocaleDateString() : '',
        assignment.is_active ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-user-assignments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Field User Commission Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <select
                value={filterRateTypeId}
                onChange={(e) => setFilterRateTypeId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Rate Types</option>
                {rateTypes.map(rateType => (
                  <option key={rateType.id} value={rateType.id}>{rateType.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingAssignment(null);
                  resetForm();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Assignment
              </button>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{assignment.user_name}</div>
                        <div className="text-sm text-gray-500">{assignment.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.rate_type_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.currency} {assignment.commission_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>From: {assignment.effective_from ? new Date(assignment.effective_from).toLocaleDateString() : 'N/A'}</div>
                        <div>To: {assignment.effective_to ? new Date(assignment.effective_to).toLocaleDateString() : 'Ongoing'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        assignment.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {assignment.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(assignment)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(String(assignment.id))}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field User</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type</label>
                <select
                  value={formData.rateTypeId}
                  onChange={(e) => setFormData({ ...formData, rateTypeId: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Select Rate Type</option>
                  {rateTypes.map(rateType => (
                    <option key={rateType.id} value={rateType.id}>{rateType.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.commissionAmount}
                  onChange={(e) => setFormData({ ...formData, commissionAmount: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAssignment(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAssignment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
