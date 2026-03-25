"use client";

import { cn } from "@/lib/utils";

interface MobileClassroomPillsProps {
  classrooms: any[];
  selectedClassroomId: string;
  onClassroomChange: (classroomId: string) => void;
}

export function MobileClassroomPills({ 
  classrooms, 
  selectedClassroomId, 
  onClassroomChange 
}: MobileClassroomPillsProps) {
  const activeClassrooms = classrooms.filter(c => c.active);

  return (
    <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto scrollbar-hide">
      {activeClassrooms.map(classroom => (
        <button
          key={classroom.id}
          onClick={() => onClassroomChange(classroom.id)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
            selectedClassroomId === classroom.id
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground"
          )}
        >
          {classroom.name}
        </button>
      ))}
    </div>
  );
}
