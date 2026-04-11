/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import { UserProfile } from '../../types';
import { useLanguageStore } from '../../store/languageStore';
import { Button } from '../ui/Button';
import { Shield, ShieldAlert, User, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { motion, AnimatePresence } from 'motion/react';

export const UserManagementTab = () => {
  const { language } = useLanguageStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setUpdatingUid(user.uid);
    try {
      await userService.updateUserRole(user.uid, newRole);
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
      setSuccessMessage(language === 'he' ? 'ההרשאות עודכנו בהצלחה' : 'Permissions updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update role', error);
      alert(language === 'he' ? 'עדכון ההרשאות נכשל' : 'Failed to update permissions');
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u as any).displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-ink-400" />
        <p className="text-sm font-bold uppercase tracking-widest text-ink-400">
          {language === 'he' ? 'טוען משתמשים...' : 'Loading users...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-ink-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-peach-darker" />
              {language === 'he' ? 'ניהול משתמשים והרשאות' : 'User Management'}
            </h3>
            <p className="text-xs text-ink-500">
              {language === 'he' 
                ? 'נהל את רשימת המשתמשים והענק הרשאות ניהול.' 
                : 'Manage users and grant administrative permissions.'}
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder={language === 'he' ? 'חפש לפי אימייל או שם...' : 'Search by email or name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-peach text-sm"
            />
          </div>
        </div>

        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-hidden border border-black/5 rounded-xl">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-ink-500 border-b border-black/5">
              <tr>
                <th className="px-4 py-3">{language === 'he' ? 'משתמש' : 'User'}</th>
                <th className="px-4 py-3">{language === 'he' ? 'תפקיד' : 'Role'}</th>
                <th className="px-4 py-3 text-center">{language === 'he' ? 'פעולות' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-peach/20 flex items-center justify-center text-accent-peach-darker">
                          {(user as any).photoURL ? (
                            <img src={(user as any).photoURL} alt="" className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-ink-900 truncate">{(user as any).displayName || 'Anonymous'}</p>
                          <p className="text-[10px] text-ink-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest",
                        user.role === 'admin' 
                          ? "bg-accent-peach/10 text-accent-peach-darker" 
                          : "bg-gray-100 text-ink-400"
                      )}>
                        {user.role === 'admin' ? <ShieldAlert className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {user.role === 'admin' ? (language === 'he' ? 'מנהל' : 'Admin') : (language === 'he' ? 'משתמש' : 'User')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleRole(user)}
                        isLoading={updatingUid === user.uid}
                        className={cn(
                          "h-8 px-3 text-[10px]",
                          user.role === 'admin' ? "text-red-500 hover:bg-red-50" : "text-accent-peach-darker hover:bg-accent-peach/10"
                        )}
                        disabled={user.email === 'shay4383@gmail.com'} // Prevent self-demotion of super admin
                      >
                        {user.role === 'admin' 
                          ? (language === 'he' ? 'הסר ניהול' : 'Remove Admin') 
                          : (language === 'he' ? 'הפוך למנהל' : 'Make Admin')}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-ink-400 italic">
                    {language === 'he' ? 'לא נמצאו משתמשים' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
