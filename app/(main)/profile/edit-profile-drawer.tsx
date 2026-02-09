'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EditProfileDrawerProps {
  userId: string;
  currentName: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileDrawer({ userId, currentName, open, onClose, onSaved }: EditProfileDrawerProps) {
  const [fullName, setFullName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty');
      return;
    }
    setSaving(true);
    const { error } = await getSupabase()
      .from('profiles')
      .update({ full_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', userId);
    setSaving(false);
    if (error) {
      toast.error('Could not update profile');
      return;
    }
    toast.success('Profile updated');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-6 space-y-5 animate-slide-up safe-bottom">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-sm font-semibold text-foreground">Edit Profile</h2>
          <button onClick={onClose} className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-body-sm font-medium text-foreground">Full Name</label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="h-12 text-body-sm"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 border-cream-300">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 h-12">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
