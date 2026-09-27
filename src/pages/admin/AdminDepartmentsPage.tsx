import React, { useState, useEffect } from 'react';
import { storage } from '../../services/storage';
import { Department } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
} from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  const loadDepts = () => {
    setDepartments(storage.getDepartments());
  };

  useEffect(() => {
    loadDepts();
    const unsubscribe = storage.subscribe(() => loadDepts());
    return () => unsubscribe();
  }, []);

  const handleOpenAdd = () => {
    setEditingDept({
      name: '',
      code: '',
      headOfDepartment: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept({ ...dept });
    setIsEditModalOpen(true);
  };

  const handleSaveDept = () => {
    if (!editingDept?.name || !editingDept?.code) {
      showToast('Please provide Department Name and Code.', 'error');
      return;
    }

    const id = editingDept.id || `dept_${Date.now()}`;
    const deptToSave: Department = {
      id,
      name: editingDept.name.trim(),
      code: editingDept.code.trim().toUpperCase(),
      headOfDepartment: editingDept.headOfDepartment?.trim() || 'Department Chair',
    };

    storage.saveDepartment(deptToSave);
    setIsEditModalOpen(false);
    showToast(`Department ${deptToSave.code} saved successfully.`, 'success');
  };

  const handleDeleteDept = () => {
    if (!deptToDelete) return;
    storage.deleteDepartment(deptToDelete.id);
    setIsDeleteOpen(false);
    showToast(`Department ${deptToDelete.name} deleted.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Institutional Structure
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Departments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure institutional faculties, acronym codes, and designated department heads.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const allUsers = storage.getUsers();
          const studentCount = allUsers.filter(
            (u) => u.role === 'student' && (u as any).department?.toLowerCase() === dept.name.toLowerCase()
          ).length;
          const facultyCount = allUsers.filter(
            (u) => u.role === 'faculty' && (u as any).department?.toLowerCase() === dept.name.toLowerCase()
          ).length;

          return (
            <div
              key={dept.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                      {dept.code}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {dept.name}
                      </h4>
                      <span className="text-xs text-slate-400">
                        HOD: {dept.headOfDepartment || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit Department"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeptToDelete(dept);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Enrolled Students</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                      {studentCount}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Faculty Members</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                      {facultyCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Code: {dept.code}</span>
                <span className="text-emerald-500 font-semibold">Verified Division</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingDept?.id ? 'Edit Department' : 'Create Department'}
        subtitle="Manage academic department name, code abbreviation, and chair"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Department Name *
            </label>
            <input
              type="text"
              value={editingDept?.name || ''}
              onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              placeholder="e.g. Mechanical Engineering"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Department Code Acronym *
            </label>
            <input
              type="text"
              value={editingDept?.code || ''}
              onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
              placeholder="e.g. ME"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Head of Department (HOD)
            </label>
            <input
              type="text"
              value={editingDept?.headOfDepartment || ''}
              onChange={(e) => setEditingDept({ ...editingDept, headOfDepartment: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              placeholder="e.g. Dr. Robert Chen"
            />
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
              onClick={handleSaveDept}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Save Department
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteDept}
        title="Delete Department"
        message={`Are you sure you want to remove ${deptToDelete?.name} (${deptToDelete?.code})?`}
        confirmLabel="Yes, Delete"
        isDestructive={true}
      />
    </div>
  );
};
