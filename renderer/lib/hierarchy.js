const STORAGE_KEY = 'adminHierarchy';

const DEFAULT_HIERARCHY = {
  faculty: [],
  department: [],
  program: [],
  year: [],
  semester: [],
  subject: []
};

export function loadHierarchy() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    console.log('[loadHierarchy] raw from localStorage:', raw);
    if (!raw || raw === '{}') {
      return { ...DEFAULT_HIERARCHY };
    }
    const data = JSON.parse(raw);
    return {
      ...DEFAULT_HIERARCHY,
      ...data,
      faculty: data.faculty || [],
      department: data.department || [],
      program: data.program || [],
      year: data.year || [],
      semester: data.semester || [],
      subject: data.subject || []
    };
  } catch (e) {
    console.error('[loadHierarchy] error:', e);
    return { ...DEFAULT_HIERARCHY };
  }
}

export function saveHierarchy(data) {
  const toSave = {
    ...data,
    faculty: data.faculty || [],
    department: data.department || [],
    program: data.program || [],
    year: data.year || [],
    semester: data.semester || [],
    subject: data.subject || []
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(toSave)
    }));
    window.dispatchEvent(new CustomEvent('hierarchy-updated'));
  }
}

export function broadcastHierarchyUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hierarchy-updated'));
  }
}