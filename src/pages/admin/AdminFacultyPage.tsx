import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../services/storage';
import { FacultyUser, Subject } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Mail,
  Building2,
} from 'lucide-react';

export const AdminFacultyPage: React.FC = () => {
  const { showToast } = useToast();
  const [facultyList, setFacultyList] = useState<FacultyUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Partial<FacultyUser> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState<FacultyUser | null>(null);

  const departments = storage.getDepartments();

  const loadData = () => {
    const users = storage.getUsers();
    const fac = users.filter((u) => u.role === 'faculty') as FacultyUser[];
    setFacultyList(fac);
    setSubjects(storage.getSubjects());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storage.subscribe(() => loadData());
    return () => unsubscribe();
  }, []);

  const filteredFaculty = useMemo(() => {
    return facultyList.filter((f) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesEmail = f.email.toLowerCase().includes(q);
        const matchesDept = f.department.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept) return false;
      }
      return true;
    });
  }, [facultyList, searchQuery]);

  const handleOpenAdd = () => {
    setEditingFaculty({
      name: '',
      email: '',
      department: departments[0]?.name || 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      assignedSubjects: [],
      role: 'faculty',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (faculty: FacultyUser) => {
    setEditingFaculty({ ...faculty });
    setIsEditModalOpen(true);
  };

  const handleSaveFaculty = () => {
    if (!editingFaculty?.name || !editingFaculty?.email) {
      showToast('Please fill in Name and Email.', 'error');
      return;
    }

    const id = editingFaculty.id || `fac_${Date.now()}`;
    const userToSave: FacultyUser = {
      id,
      name: editingFaculty.name,
      email: editingFaculty.email.trim().toLowerCase(),
      department: editingFaculty.department || departments[0]?.name || 'Computer Science & Engineering',
      designation: editingFaculty.designation || 'Assistant Professor',
      assignedSubjects: editingFaculty.assignedSubjects || [],
      role: 'faculty',
      createdAt: editingFaculty.createdAt || new Date().toISOString(),
    };

    storage.saveUser(userToSave);
    setIsEditModalOpen(false);
    showToast(`Faculty member ${userToSave.name} saved successfully.`, 'success');
  };

  const handleDeleteFaculty = () => {
    if (!facultyToDelete) return;
    storage.deleteUser(facultyToDelete.id);
    setIsDeleteOpen(false);
    showToast(`Faculty member ${facultyToDelete.name} deleted.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Faculty Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manage Faculty & Professors
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Assign instructors to departments and courses across campus.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Faculty Member
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty by name, department, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFaculty.map((fac) => {
          const taughtSubjects = subjects.filter((s) => s.facultyId === fac.id);

          return (
            <div
              key={fac.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {fac.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {fac.name}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {fac.designation || 'Instructor'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(fac)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Faculty"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setFacultyToDelete(fac);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Faculty"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{fac.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{fac.email}</span>
                  </div>
                </div>
              </div>

              {/* Taught Subjects Tags */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Courses ({taughtSubjects.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {taughtSubjects.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No courses currently assigned</span>
                  ) : (
                    taughtSubjects.map((sub) => (
                      <span
                        key={sub.id}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold"
                      >
                        {sub.code}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingFaculty?.id ? 'Edit Faculty Record' : 'Register New Faculty'}
        subtitle="Manage professor appointment and department affiliation"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Full Name *
            </label>
            <input
              type="text"
              value={editingFaculty?.name || ''}
              onChange={(e) => setEditingFaculty({ ...editingFaculty, name: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              placeholder="e.g. Dr. Rajesh Kumar"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address *
            </label>
            <input
              type="email"
              value={editingFaculty?.email || ''}
              onChange={(e) => setEditingFaculty({ ...editingFaculty, email: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              placeholder="e.g. rajesh.kumar@smartattend.edu"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Designation *
            </label>
            <input
              type="text"
              value={editingFaculty?.designation || ''}
              onChange={(e) => setEditingFaculty({ ...editingFaculty, designation: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              placeholder="e.g. Associate Professor & HOD"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Department *
            </label>
            <select
              value={editingFaculty?.department || departments[0]?.name}
              onChange={(e) => setEditingFaculty({ ...editingFaculty, department: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveFaculty}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Save Faculty Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteFaculty}
        title="Delete Faculty Member"
        message={`Are you sure you want to remove ${facultyToDelete?.name}? Subjects currently assigned to them will require reassignment.`}
        confirmLabel="Yes, Remove"
        isDestructive={true}
      />
    </div>
  );
};
