"use client";

import { Calendar as CalendarIcon, Search } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import EntryCard from "@/components/entry-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOODS } from "@/app/lib/moods";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const JournalFilters = ({ entries }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [date, setDate] = useState(null);
  const [filteredEntries, setFilteredEntries] = useState(entries);

  // Apply filters whenever filter values or entries change
  useEffect(() => {
    let filtered = entries;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query)
      );
    }
    // Apply mood filter
    if (selectedMood) {
      filtered = filtered.filter((entry) => entry.mood === selectedMood);
    }

    // Apply date filter
    if (date) {
      filtered = filtered.filter((entry) =>
        isSameDay(new Date(entry.createdAt), date)
      );
    }

    setFilteredEntries(filtered);
    
  }, [entries, searchQuery, selectedMood, date]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMood("");
    setDate(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Mood Filter */}
        <Select value={selectedMood} onValueChange={setSelectedMood}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by mood" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(MOODS).map((mood) => (
              <SelectItem key={mood.id} value={mood.id}>
                <span className="flex items-center gap-2">
                  {mood.emoji} {mood.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Calendar */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {(searchQuery || selectedMood || date) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-orange-600"
          >
            Clear Filters
          </Button>
        )}
      </div>
      <div className="text-sm text-gray-500">
        Showing Showing {filteredEntries.length} of {entries.length} entries
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500">No entries found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </>
  );
};

export default JournalFilters;
