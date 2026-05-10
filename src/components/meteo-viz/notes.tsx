
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotesIcon } from "../icons";
import { useLanguage } from "@/context/language-context";

export function Notes({ locationId }: { locationId: string }) {
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const storageKey = `agroclima_notes_${locationId}`;

  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(storageKey);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    } catch (e) {
      console.error("Failed to read notes from localStorage", e);
    }
  }, [storageKey]);

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, notes);
      toast({
        title: t('notes.saveSuccessTitle'),
        description: t('notes.saveSuccessDescription'),
      });
    } catch (e) {
      console.error("Failed to save notes to localStorage", e);
      toast({
        variant: "destructive",
        title: t('notes.saveErrorTitle'),
        description: t('notes.saveErrorDescription'),
      });
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <NotesIcon /> {t('notes.title')}
        </CardTitle>
        <CardDescription>
          {t('notes.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={t('notes.placeholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          className="text-base"
        />
        <Button onClick={handleSave}>
          {t('notes.saveButton')}
        </Button>
      </CardContent>
    </Card>
  );
}
