// lib/BranchContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const [me, setMe] = useState(null);       // { role, branchId, fullName }
  const [branches, setBranches] = useState([]); // ລາຍຊື່ສາຂາ (admin ເທົ່ານັ້ນທີ່ຈະໄດ້ຫຼາຍກວ່າ 1)
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [loading, setLoading] = useState(true);

  function fetchMe() {
    setLoading(true);
    fetch('/api/me')
      .then((res) => res.json())
      .then((json) => {
        setMe(json.profile || null);
        setBranches(json.branches || []);
        if (json.profile?.role === 'staff') {
          setSelectedBranchId(json.profile.branchId);
        } else if (json.profile?.role === 'admin') {
          const saved = localStorage.getItem('selected_branch_id');
          const validSaved = json.branches?.some((b) => b.id === saved) ? saved : json.branches?.[0]?.id;
          setSelectedBranchId(validSaved || null);
        } else {
          setSelectedBranchId(null);
        }
      })
      .catch(() => {
        setMe(null);
        setBranches([]);
        setSelectedBranchId(null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchMe(); // ດຶງທັນທີ (ເຜື່ອ login ຢູ່ແລ້ວຕອນເປີດໜ້າ)

    // ✅ ຟັງ event ການ login/logout ແບບ realtime — ບໍ່ຕ້ອງ refresh ໜ້າອີກຕໍ່ໄປ
    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchMe();
      } else if (event === 'SIGNED_OUT') {
        setMe(null);
        setBranches([]);
        setSelectedBranchId(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  function changeBranch(id) {
    setSelectedBranchId(id);
    localStorage.setItem('selected_branch_id', id);
  }

  return (
    <BranchContext.Provider value={{ me, branches, selectedBranchId, changeBranch, loading }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}
