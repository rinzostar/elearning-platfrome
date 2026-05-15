import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadHierarchy, saveHierarchy } from './hierarchy';

const HierarchyContext = createContext(null);

export function HierarchyProvider({ children }) {
  const [lists, setLists] = useState({ faculty: [], department: [], program: [], year: [], semester: [], subject: [] });

  const refresh = useCallback(() => {
    setLists(loadHierarchy());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener('hierarchy-updated', onStorage);
    return () => window.removeEventListener('hierarchy-updated', onStorage);
  }, [refresh]);

  const addItem = useCallback((key, item) => {
    const data = loadHierarchy();
    console.log('[HierarchyContext] addItem - current data:', JSON.stringify(data).substring(0, 200));
    const newData = { ...data, [key]: [...(data[key] || []), item] };
    console.log('[HierarchyContext] addItem - new data:', JSON.stringify(newData).substring(0, 200));
    saveHierarchy(newData);
    setLists(newData);
    window.dispatchEvent(new CustomEvent('hierarchy-updated'));
  }, []);

  const updateItem = useCallback((key, id, updates) => {
    const data = loadHierarchy();
    const newData = { ...data, [key]: (data[key] || []).map(x => x.id === id ? { ...x, ...updates } : x) };
    saveHierarchy(newData);
    setLists(newData);
    window.dispatchEvent(new CustomEvent('hierarchy-updated'));
  }, []);

  const deleteItem = useCallback((key, id) => {
    const data = loadHierarchy();
    const cascades = { faculty: 'department', department: 'program', program: 'year', year: 'semester', semester: 'subject' };
    const idMap = { department: 'facultyId', program: 'departmentId', year: 'programId', semester: 'yearId', subject: 'semesterId' };
    const newData = { ...data, [key]: (data[key] || []).filter(x => x.id !== id) };
    let child = cascades[key];
    while (child) {
      const f = idMap[child];
      if (f) newData[child] = (newData[child] || []).filter(x => x[f] !== id);
      else newData[child] = [];
      child = cascades[child];
    }
    saveHierarchy(newData);
    setLists(newData);
    window.dispatchEvent(new CustomEvent('hierarchy-updated'));
  }, []);

  return (
    <HierarchyContext.Provider value={{ lists, addItem, updateItem, deleteItem, refresh }}>
      {children}
    </HierarchyContext.Provider>
  );
}

export function useHierarchy() {
  const ctx = useContext(HierarchyContext);
  if (!ctx) throw new Error('useHierarchy must be used inside HierarchyProvider');
  return ctx;
}