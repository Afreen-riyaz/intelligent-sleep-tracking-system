import React, { useState } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Sun, Moon, LogOut, AlertTriangle, X } from 'lucide-react';

interface AccountSettingsModalProps {
  onClose: () => void;
  profilePic: string | null;
  setProfilePic: (pic: string | null) => void;
  showAlert: boolean;
  setShowAlert: (show: boolean) => void;
  theme: string;
  setTheme: (theme: string) => void;
  handleLogout: () => void;
}

export default function AccountSettingsModal({
  onClose,
  profilePic,
  setProfilePic,
  showAlert,
  setShowAlert,
  theme,
  setTheme,
  handleLogout,
}: AccountSettingsModalProps) {
  const [tab, setTab] = useState<'info' | 'password' | 'picture'>('info');
  // Placeholder state for form fields
  const [name, setName] = useState('Afreen Taj');
  const [email, setEmail] = useState('afreen.riyaz789@gmail.com');
  const [contact, setContact] = useState('+91 7795923422');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleProfilePicChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfilePic(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Account Settings</DialogTitle>
        <DialogDescription>
          Manage your account information, password, and profile picture.
        </DialogDescription>
      </DialogHeader>
      {/* Alert notification inside modal */}
      {showAlert && (
        <div className="mb-4 p-3 rounded bg-orange-50 border border-orange-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-orange-800 font-medium">Active Alert:</span>
            <span className="text-orange-700">Low SpO2 Level - Oxygen level below 95%</span>
          </div>
          <button onClick={() => setShowAlert(false)} className="ml-2 p-1 rounded hover:bg-orange-100">
            <X className="h-4 w-4 text-orange-600" />
          </button>
        </div>
      )}
      {/* Theme toggle and logout */}
      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1" /> Log Out
        </Button>
      </div>
      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'info' ? 'default' : 'outline'} onClick={() => setTab('info')}>Profile Info</Button>
        <Button variant={tab === 'password' ? 'default' : 'outline'} onClick={() => setTab('password')}>Change Password</Button>
        <Button variant={tab === 'picture' ? 'default' : 'outline'} onClick={() => setTab('picture')}>Profile Picture</Button>
      </div>
      {tab === 'info' && (
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full border rounded p-2" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input className="w-full border rounded p-2" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact</label>
            <input className="w-full border rounded p-2" value={contact} onChange={e => setContact(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => alert('Profile updated (placeholder)')}>Save</Button>
          </DialogFooter>
        </form>
      )}
      {tab === 'password' && (
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Old Password</label>
            <input type="password" className="w-full border rounded p-2" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input type="password" className="w-full border rounded p-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input type="password" className="w-full border rounded p-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => alert('Password changed (placeholder)')}>Change Password</Button>
          </DialogFooter>
        </form>
      )}
      {tab === 'picture' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-gray-400">?</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleProfilePicChange} />
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => alert('Profile picture updated (placeholder)')}>Save Picture</Button>
          </DialogFooter>
        </div>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
} 