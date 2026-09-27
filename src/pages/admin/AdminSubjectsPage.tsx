import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../../services/storage';
import { Subject, FacultyUser } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
} from 'lucide-react';

export const AdminSubjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const departments = storage.getDepartments();

  const loadData = () => {
    setSubjects(storage.getSubjects());
    const users = storage.getUsers();
    setFacultyList(users.filter((u) => u.role === 'faculty') as FacultyUser[]);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storage.subscribe(() => loadData());
    return () => unsubscribe();
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCode = s.code.toLowerCase().includes(q);
        const matchesDept = s.department.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDept) return false;
      }
      return true;
    });
  }, [subjects, searchQuery]);

  const handleOpenAdd = () => {
    setEditingSubject({
      name: '',
      code: `CS50${subjects.length + 1}`,
      facultyId: facultyList[0]?.id || '',
      department: departments[0]?.name || 'Computer Science & Engineering',
      semester: 5,
      section: 'A',
      totalCredits: 4,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject({ ...subject });
    setIsEditModalOpen(true);
  };

  const handleSaveSubject = () => {
    if (!editingSubject?.name || !editingSubject?.code || !editingSubject?.facultyId) {
      showToast('Please fill in Subject Name, Code, and select an Instructor.', 'error');
      return;
    }

    const assignedFaculty = facultyList.find((f) => f.id === editingSubject.facultyId);

    const id = editingSubject.id || `subj_${Date.now()}`;
    const subjectToSave: Subject = {
      id,
      name: editingSubject.name.trim(),
      code: editingSubject.code.trim().toUpperCase(),
      facultyId: editingSubject.facultyId,
      facultyName: assignedFaculty?.name || 'Faculty Instructor',
      department: editingSubject.department || departments[0]?.name || 'Computer Science & Engineering',
      semester: Number(editingSubject.semester) || 5,
      section: (editingSubject.section || 'A').toUpperCase(),
      totalCredits: Number(editingSubject.totalCredits) || 4,
      createdAt: editingSubject.createdAt || new Date().toISOString(),
    };

    storage.saveSubject(subjectToSave);
    setIsEditModalOpen(false);
    showToast(`Subject ${subjectToSave.code} saved successfully.`, 'success');
  };

  const handleDeleteSubject = () => {
    if (!subjectToDelete) return;
    storage.deleteSubject(subjectToDelete.id);
    setIsDeleteOpen(false);
    showToast(`Subject ${subjectToDelete.name} deleted.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Curriculum Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Manage Subjects & Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure course codes, allocate professors, and assign semester sections.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search course by title, code (e.g. CS503, DBMS), or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <div
            key={subject.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                    {subject.code}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {subject.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {subject.totalCredits || 3} Credits
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(subject)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit Subject"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSubjectToDelete(subject);
                      setIsDeleteOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Department:</span> {subject.department}
                </p>
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Target Cohort:</span> Semester {subject.semester} (Section {subject.section})
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {subject.facultyName}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingSubject?.id ? 'Edit Subject Course' : 'Create New Course'}
        subtitle="Configure course identifiers, instructor, and department allotment"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Course Title *
              </label>
              <input
                type="text"
                value={editingSubject?.name || ''}
                onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                placeholder="e.g. Distributed Cloud Computing"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Course Code *
              </label>
              <input
                type="text"
                value={editingSubject?.code || ''}
                onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                placeholder="e.g. CS506"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Assigned Faculty Instructor *
            </label>
            <select
              value={editingSubject?.facultyId || ''}
              onChange={(e) => setEditingSubject({ ...editingSubject, facultyId: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">Select Instructor...</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.department})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Department *
            </label>
            <select
              value={editingSubject?.department || departments[0]?.name}
              onChange={(e) => setEditingSubject({ ...editingSubject, department: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Semester *
              </label>
              <select
                value={editingSubject?.semester || 5}
                onChange={(e) => setEditingSubject({ ...editingSubject, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    Sem {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Section *
              </label>
              <select
                value={editingSubject?.section || 'A'}
                onChange={(e) => setEditingSubject({ ...editingSubject, section: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Credits
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={editingSubject?.totalCredits || 3}
                onChange={(e) => setEditingSubject({ ...editingSubject, totalCredits: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-bold"
              />
            </div>
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
              onClick={handleSaveSubject}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              Save Course
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteSubject}
        title="Delete Subject Course"
        message={`Are you sure you want to permanently remove ${subjectToDelete?.name} (${subjectToDelete?.code})? Associated attendance logs will remain archived.`}
        confirmLabel="Yes, Remove"
        isDestructive={true}
      />
    </div>
  );
};
