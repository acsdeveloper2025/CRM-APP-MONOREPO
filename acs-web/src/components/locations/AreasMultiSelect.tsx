import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { locationsService } from '@/services/locations';

interface Area {
  id: string;
  name: string;
}

interface AreasMultiSelectProps {
  selectedAreaIds: string[];
  onAreasChange: (areaIds: string[]) => void;
  disabled?: boolean;
  error?: string;
}

export function AreasMultiSelect({
  selectedAreaIds,
  onAreasChange,
  disabled = false,
  error,
}: AreasMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Fetch all available areas
  const { data: areasData, isLoading } = useQuery({
    queryKey: ['standalone-areas'],
    queryFn: () => locationsService.getStandaloneAreas(),
  });

  const areas = areasData?.data || [];
  const selectedAreas = areas.filter(area => selectedAreaIds.includes(area.id));

  const handleSelect = (areaId: string) => {
    if (selectedAreaIds.includes(areaId)) {
      // Remove area
      onAreasChange(selectedAreaIds.filter(id => id !== areaId));
    } else {
      // Add area
      onAreasChange([...selectedAreaIds, areaId]);
    }
  };

  const handleRemove = (areaId: string) => {
    onAreasChange(selectedAreaIds.filter(id => id !== areaId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              selectedAreaIds.length === 0 && "text-muted-foreground",
              error && "border-red-500"
            )}
            disabled={disabled}
          >
            {selectedAreaIds.length === 0
              ? "Select areas..."
              : `${selectedAreaIds.length} area${selectedAreaIds.length === 1 ? '' : 's'} selected`
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search areas..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading areas..." : "No areas found."}
              </CommandEmpty>
              <CommandGroup>
                {areas.map((area) => (
                  <CommandItem
                    key={area.id}
                    value={area.name}
                    onSelect={() => handleSelect(area.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAreaIds.includes(area.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {area.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected areas display */}
      {selectedAreas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedAreas.map((area) => (
            <Badge
              key={area.id}
              variant="secondary"
              className="text-xs"
            >
              {area.name}
              {!disabled && (
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRemove(area.id);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleRemove(area.id)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Select areas from the available list. Areas must be created in the Areas management tab first.
      </p>
    </div>
  );
}
