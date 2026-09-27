import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../services/storage';
import { attendanceService } from '../../services/attendanceService';
import { StudentUser } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { StudentProfileModal } from '../../components/common/StudentProfileModal';
import { RiskBadge } from '../../components/common/RiskBadge';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const AdminStudentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<StudentUser> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);
  const [inspectedStudentId, setInspectedStudentId] = useState<string | null>(null);

  const departments = storage.getDepartments();

  const loadStudents = () => {
    const users = storage.getUsers();
    const st = users.filter((u) => u.role === 'student') as StudentUser[];
    st.sort((a, b) => (a.rollNumber > b.rollNumber ? 1 : -1));
    setStudents(st);
  };

  useEffect(() => {
    loadStudents();
    const unsubscribe = storage.subscribe(() => loadStudents());
    return () => unsubscribe();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (deptFilter !== 'ALL' && s.department.toLowerCase() !== deptFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesRoll = s.rollNumber.toLowerCase().includes(q);
        const matchesEmail = s.email.toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesEmail) return false;
      }
      return true;
    });
  }, [students, deptFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingStudent({
      name: '',
      email: '',
      rollNumber: `21CS0${Math.floor(Math.random() * 90 + 10)}`,
      department: departments[0]?.name || 'Computer Science & Engineering',
      semester: 5,
      section: 'A',
      phone: '',
      role: 'student',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (student: StudentUser) => {
    setEditingStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const handleSaveStudent = () => {
    if (!editingStudent?.name || !editingStudent?.email || !editingStudent?.rollNumber) {
      showToast('Please fill in Name, Email, and Roll Number.', 'error');
      return;
    }

    const id = editingStudent.id || `student_${Date.now()}`;
    const userToSave: StudentUser = {
      id,
      name: editingStudent.name,
      email: editingStudent.email.trim().toLowerCase(),
      rollNumber: editingStudent.rollNumber.trim().toUpperCase(),
      department: editingStudent.department || departments[0]?.name || 'Computer Science & Engineering',
      semester: Number(editingStudent.semester) || 5,
      section: (editingStudent.section || 'A').toUpperCase(),
      phone: editingStudent.phone || '',
      role: 'student',
      createdAt: editingStudent.createdAt || new Date().toISOString(),
    };

    storage.saveUser(userToSave);
    setIsEditModalOpen(false);
    showToast(`Student ${userToSave.name} saved successfully.`, 'success');
  };

  const handleDeleteStudent = () => {
    if (!studentToDelete) return;
    storage.deleteUser(studentToDelete.id);
    setIsDeleteOpen(false);
    showToast(`Student ${studentToDelete.name} deleted.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            Student Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manage Students
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, update, search, and audit student cohort enrollments.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name, roll number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3.5 px-4 w-32">Roll No</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-3">Department & Cohort</th>
                <th className="py-3.5 px-3 text-center">Attendance</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {filteredStudents.map((st) => {
                const stats = attendanceService.getStudentAttendance(st.id);
                return (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {st.rollNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {st.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {st.email}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-slate-700 dark:text-slate-300 font-medium block">
                        {st.department}
                      </span>
                      <span className="text-xs text-slate-400">
                        Semester {st.semester} • Section {st.section}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {stats ? `${stats.percentage.toFixed(1)}%` : '—'}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {stats && <RiskBadge risk={stats.risk} size="sm" />}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectedStudentId(st.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Attendance Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setStudentToDelete(st);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingStudent?.id ? 'Edit Student Record' : 'Register New Student'}
        subtitle="Manage student biographical and department enrollment data"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                value={editingStudent?.name || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="e.g. Anas Ahmad"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Roll Number *
              </label>
              <input
                type="text"
                value={editingStudent?.rollNumber || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, rollNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                placeholder="e.g. 21CS042"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address *
            </label>
            <input
              type="email"
              value={editingStudent?.email || ''}
              onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              placeholder="e.g. anas@smartattend.edu"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Department *
            </label>
            <select
              value={editingStudent?.department || departments[0]?.name}
              onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Semester *
              </label>
              <select
                value={editingStudent?.semester || 5}
                onChange={(e) => setEditingStudent({ ...editingStudent, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    Semester {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Section *
              </label>
              <select
                value={editingStudent?.section || 'A'}
                onChange={(e) => setEditingStudent({ ...editingStudent, section: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveStudent}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Save Student Record
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteStudent}
        title="Delete Student Record"
        message={`Are you sure you want to permanently delete ${studentToDelete?.name} (${studentToDelete?.rollNumber})? This will detach related attendance records.`}
        confirmLabel="Yes, Delete"
        isDestructive={true}
      />

      {/* Profile Modal */}
      <StudentProfileModal
        studentId={inspectedStudentId}
        isOpen={Boolean(inspectedStudentId)}
        onClose={() => setInspectedStudentId(null)}
      />
    </div>
  );
};
