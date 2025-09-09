import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Play, UserCheck, Clock, AlertTriangle, Building2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Case } from '@/types/case';
import { cn } from '@/utils/cn';
import { UserSelectionModal } from './UserSelectionModal';

interface PendingCasesTableProps {
  cases: Case[];
  isLoading?: boolean;
  onUpdateStatus?: (caseId: string, status: string) => void;
  onAssignCase?: (caseId: string, userId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: number | string) => {
  const p = Number(priority);
  if (p >= 4) return 'bg-red-100 text-red-800';
  if (p >= 3) return 'bg-orange-100 text-orange-800';
  if (p >= 2) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

const getPriorityLabel = (priority: number | string) => {
  const p = Number(priority);
  if (p >= 5) return 'Critical';
  if (p >= 4) return 'Urgent';
  if (p >= 3) return 'High';
  if (p >= 2) return 'Medium';
  return 'Low';
};

const getTimeElapsed = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'N/A';
  }
};

const isOverdue = (assignedAt?: string) => {
  if (!assignedAt) return false;
  const assigned = new Date(assignedAt);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - assigned.getTime()) / (1000 * 60 * 60));
  return diffInHours > 48; // More than 2 days
};

export const PendingCasesTable: React.FC<PendingCasesTableProps> = ({
  cases,
  isLoading,
  onUpdateStatus,
  onAssignCase,
}) => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<Case | null>(null);

  const handleOpenUserModal = (caseItem: Case) => {
    setSelectedCaseForAssignment(caseItem);
    setIsUserModalOpen(true);
  };

  const handleUserSelection = (userId: string, userName: string) => {
    if (selectedCaseForAssignment && onAssignCase) {
      onAssignCase(selectedCaseForAssignment.id, userId);
    }
    setIsUserModalOpen(false);
    setSelectedCaseForAssignment(null);
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Verification Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Time Elapsed</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((item) => (
              <TableRow key={item}>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Cases</h3>
        <p className="text-gray-500">
          All cases have been completed or there are no cases assigned yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Verification Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Time Elapsed</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((caseItem) => {
              const overdue = isOverdue(caseItem.assignedAt);
              
              return (
                <TableRow 
                  key={caseItem.id}
                  className={cn(
                    overdue && 'bg-red-50 border-l-4 border-l-red-500'
                  )}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/cases/${caseItem.caseId || caseItem.id}`}
                        className="text-primary hover:underline"
                      >
                        #{caseItem.caseId || caseItem.id?.slice(-8) || 'N/A'}
                      </Link>
                      {overdue && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {caseItem.customerName || 'N/A'}
                      </div>
                      {caseItem.customerPhone && (
                        <div className="text-sm text-gray-500">
                          {caseItem.customerPhone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {caseItem.clientName || 'N/A'}
                        </div>
                        {caseItem.clientCode && (
                          <div className="text-sm text-gray-500">
                            {caseItem.clientCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {caseItem.verificationTypeName || caseItem.verificationType || 'N/A'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(caseItem.status)}>
                      {caseItem.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getPriorityColor(caseItem.priority)}>
                      {getPriorityLabel(caseItem.priority)} ({caseItem.priority})
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {caseItem.assignedToName || 'Unassigned'}
                        </div>
                        {caseItem.assignedAt && (
                          <div className="text-sm text-gray-500">
                            Assigned {getTimeElapsed(caseItem.assignedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className={cn(
                      "text-sm",
                      overdue ? "text-red-600 font-medium" : "text-gray-500"
                    )}>
                      {getTimeElapsed(caseItem.assignedAt)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to={`/cases/${caseItem.caseId || caseItem.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {caseItem.status === 'PENDING' && onUpdateStatus && (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(caseItem.id, 'IN_PROGRESS')}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start Progress
                          </DropdownMenuItem>
                        )}
                        {onAssignCase && (
                          <DropdownMenuItem
                            onClick={() => handleOpenUserModal(caseItem)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reassign
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* User Selection Modal */}
      <UserSelectionModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedCaseForAssignment(null);
        }}
        onSelectUser={handleUserSelection}
        title="Reassign Case"
      />
    </>
  );
};
