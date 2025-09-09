import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, MapPin, User, Calendar, Clock, PlayCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Case } from '@/types/case';

interface InProgressCaseTableProps {
  cases: Case[];
  isLoading?: boolean;
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1:
      return 'bg-gray-100 text-gray-800';
    case 2:
      return 'bg-blue-100 text-blue-800';
    case 3:
      return 'bg-yellow-100 text-yellow-800';
    case 4:
      return 'bg-orange-100 text-orange-800';
    case 5:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityLabel = (priority: number) => {
  switch (priority) {
    case 1:
      return 'Low';
    case 2:
      return 'Normal';
    case 3:
      return 'Medium';
    case 4:
      return 'High';
    case 5:
      return 'Critical';
    default:
      return 'Unknown';
  }
};

const getTimeElapsed = (dateString?: string, pendingDurationSeconds?: number) => {
  // Use pendingDurationSeconds if available (from backend calculation)
  if (pendingDurationSeconds !== undefined && pendingDurationSeconds !== null) {
    const hours = Math.floor(pendingDurationSeconds / 3600);
    const minutes = Math.floor((pendingDurationSeconds % 3600) / 60);
    
    if (hours < 1) {
      return `${minutes}m in progress`;
    } else if (hours < 24) {
      return `${hours}h in progress`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h in progress` : `${days}d in progress`;
    }
  }
  
  // Fallback to original date calculation
  if (!dateString) return 'N/A';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'N/A';
  }
};

export const InProgressCaseTable: React.FC<InProgressCaseTableProps> = ({
  cases,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12">
        <PlayCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No in progress cases</h3>
        <p className="mt-1 text-sm text-gray-500">
          All cases are either pending or completed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map((caseItem) => {
        const pendingDurationSeconds = (caseItem as any).pendingDurationSeconds;
        const isLongRunning = pendingDurationSeconds && pendingDurationSeconds > 172800; // More than 2 days
        const isHighPriority = caseItem.priority >= 4;
        
        return (
          <Card 
            key={caseItem.id} 
            className={cn(
              "transition-all duration-200 hover:shadow-md",
              isLongRunning && isHighPriority ? "border-red-200 bg-red-50" :
              isLongRunning ? "border-orange-200 bg-orange-50" :
              isHighPriority ? "border-yellow-200 bg-yellow-50" : ""
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="font-mono">
                        #{caseItem.caseId}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {caseItem.customerName}
                        </h3>
                        <Badge className={cn("text-xs", getPriorityColor(caseItem.priority))}>
                          {getPriorityLabel(caseItem.priority)}
                        </Badge>
                        {isLongRunning && (
                          <Badge variant="destructive" className="text-xs">
                            Long Running
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{caseItem.assignedToName || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-xs">{caseItem.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Created {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center space-x-4">
                        {caseItem.assignedAt && (
                          <div className="text-sm text-gray-500">
                            Assigned {getTimeElapsed(caseItem.assignedAt, (caseItem as any).pendingDurationSeconds)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className={cn(
                      "text-sm",
                      isLongRunning && isHighPriority ? "text-red-700 font-bold" :
                      isLongRunning ? "text-orange-600 font-medium" :
                      isHighPriority ? "text-yellow-600 font-medium" : "text-gray-500"
                    )}>
                      {getTimeElapsed(caseItem.assignedAt, (caseItem as any).pendingDurationSeconds)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      In Progress
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Navigate to case details
                      console.log('View case:', caseItem.id);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
