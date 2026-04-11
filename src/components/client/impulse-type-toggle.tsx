"use client";

import { cn } from "@/lib/utils";
import type { ImpulseType } from "@/generated/prisma";

interface ImpulseTypeToggleProps {
  value: ImpulseType;
  onChange: (type: ImpulseType) => void;
}

const types: Array<{
  type: ImpulseType;
  label: string;
  selectedClass: string;
  selectedTextClass: string;
}> = [
  {
    type: "FEEDBACK",
    label: "Feedback",
    selectedClass: "bg-purple-500/20 border-purple-500/40",
    selectedTextClass: "text-purple-300",
  },
  {
    type: "CHANGE_REQUEST",
    label: "Änderung",
    selectedClass: "bg-orange-500/20 border-orange-500/40",
    selectedTextClass: "text-orange-300",
  },
  {
    type: "QUESTION",
    label: "Frage",
    selectedClass: "bg-cyan-500/20 border-cyan-500/40",
    selectedTextClass: "text-cyan-300",
  },
  {
    type: "IDEA",
    label: "Idee",
    selectedClass: "bg-pink-500/20 border-pink-500/40",
    selectedTextClass: "text-pink-300",
  },
];

export function ImpulseTypeToggle({ value, onChange }: ImpulseTypeToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map(({ type, label, selectedClass, selectedTextClass }) => {
        const isSelected = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              "min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer",
              isSelected
                ? cn(selectedClass, selectedTextClass)
                : "bg-dark-300 border-border text-ink-muted hover:text-surface hover:border-border/80"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
