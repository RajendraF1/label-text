import { supabase, isSupabaseConfigured } from '../lib/supabase';
import Papa from 'papaparse';

function ensureSupabase() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Database Supabase belum terhubung. Pastikan VITE_SUPABASE_ANON_KEY sudah diisi.');
  }
}

// ============================================================================
// MEMBERS SERVICE
// ============================================================================
export async function getMembers() {
  ensureSupabase();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addMember(name) {
  ensureSupabase();
  const cleanName = name.trim();
  if (!cleanName) throw new Error('Nama anggota tidak boleh kosong');

  const { data, error } = await supabase
    .from('members')
    .insert([{ name: cleanName }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error(`Nama "${cleanName}" sudah terdaftar!`);
    throw error;
  }
  return data;
}

export async function deleteMember(id) {
  ensureSupabase();
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================================================
// ASSIGNMENTS & DATA DISTRIBUTION
// ============================================================================
export async function getAssignments(filterName = null) {
  ensureSupabase();
  let query = supabase.from('assignments').select('*').order('created_at', { ascending: true });
  if (filterName) {
    query = query.eq('member_name', filterName);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function distributeDataset(rawRows, recordIdCol, textCol, membersList) {
  ensureSupabase();
  if (!membersList || membersList.length === 0) {
    throw new Error('Tidak ada anggota yang terdaftar untuk menerima distribusi data.');
  }
  if (!rawRows || rawRows.length === 0) {
    throw new Error('Dataset CSV kosong.');
  }

  const numMembers = membersList.length;
  const totalRows = rawRows.length;
  const baseCount = Math.floor(totalRows / numMembers);
  const remainder = totalRows % numMembers;

  const assignmentsToInsert = [];
  let currentIndex = 0;

  for (let m = 0; m < numMembers; m++) {
    const member = membersList[m];
    const countForMember = baseCount + (m < remainder ? 1 : 0);

    for (let i = 0; i < countForMember; i++) {
      if (currentIndex >= totalRows) break;
      const row = rawRows[currentIndex];
      
      let recordId = row[recordIdCol];
      if (recordId === undefined || recordId === null || String(recordId).trim() === '') {
        recordId = `rec_${currentIndex + 1}`;
      } else {
        recordId = String(recordId).trim();
      }

      const textVal = row[textCol] !== undefined && row[textCol] !== null 
        ? String(row[textCol]).trim() 
        : '';

      assignmentsToInsert.push({
        record_id: recordId,
        member_id: member.id,
        member_name: member.name,
        text: textVal,
        manual_label: null,
        labeled_at: null,
      });

      currentIndex++;
    }
  }

  // Clear old assignments first
  const { error: delError } = await supabase
    .from('assignments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) console.warn('Note deleting assignments:', delError);

  // Insert in batches of 300 to avoid payload limits
  const batchSize = 300;
  for (let i = 0; i < assignmentsToInsert.length; i += batchSize) {
    const batch = assignmentsToInsert.slice(i, i + batchSize);
    const { error: insError } = await supabase.from('assignments').insert(batch);
    if (insError) throw insError;
  }

  return {
    totalDistributed: assignmentsToInsert.length,
    numMembers,
    distributionSummary: membersList.map((m, idx) => ({
      name: m.name,
      count: baseCount + (idx < remainder ? 1 : 0),
    })),
  };
}

export async function updateManualLabel(recordId, label) {
  ensureSupabase();
  const normalizedLabel = label.toUpperCase();
  if (normalizedLabel !== 'POSITIVE' && normalizedLabel !== 'NEGATIVE') {
    throw new Error('Label harus POSITIVE atau NEGATIVE');
  }

  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from('assignments')
    .update({
      manual_label: normalizedLabel,
      labeled_at: nowIso,
    })
    .eq('record_id', recordId);
  if (error) throw error;
}

export async function getMonitoringStats() {
  ensureSupabase();
  const members = await getMembers();
  const assignments = await getAssignments();

  const total = assignments.length;
  const labeled = assignments.filter(a => a.manual_label !== null && a.manual_label !== '').length;
  const unlabeled = total - labeled;

  const memberProgress = members.map(m => {
    const memberTasks = assignments.filter(a => a.member_name === m.name);
    const memTotal = memberTasks.length;
    const memDone = memberTasks.filter(a => a.manual_label !== null && a.manual_label !== '').length;
    const memRemaining = memTotal - memDone;
    const percent = memTotal > 0 ? Math.round((memDone / memTotal) * 100) : 0;
    return {
      id: m.id,
      name: m.name,
      total: memTotal,
      done: memDone,
      remaining: memRemaining,
      percent,
    };
  });

  return {
    total,
    labeled,
    unlabeled,
    overallPercent: total > 0 ? Math.round((labeled / total) * 100) : 0,
    memberProgress,
  };
}

export async function exportManualCsv() {
  ensureSupabase();
  const assignments = await getAssignments();
  const rows = assignments.map(a => ({
    record_id: a.record_id,
    text: a.text,
    assigned_member: a.member_name,
    manual_label: a.manual_label || '',
    labeled_at: a.labeled_at || '',
  }));

  const csv = Papa.unparse(rows);
  downloadBlob(csv, 'manual_labeled_results.csv', 'text/csv;charset=utf-8;');
}

// ============================================================================
// LLM RESULTS & COMPARISON
// ============================================================================
export async function importLlmResults(rawRows, recordIdCol, labelCol) {
  ensureSupabase();
  const assignments = await getAssignments();
  const existingRecordIds = new Set(assignments.map(a => String(a.record_id).trim()));

  const validLlmResults = [];
  let matchedCount = 0;
  let unmatchedCount = 0;
  let invalidLabelCount = 0;

  for (const row of rawRows) {
    const rawId = row[recordIdCol];
    if (rawId === undefined || rawId === null) continue;
    const recId = String(rawId).trim();

    const rawLabel = row[labelCol];
    if (!rawLabel) continue;

    const lower = String(rawLabel).trim().toLowerCase();
    let normLabel = null;
    if (lower.startsWith('pos') || lower === '1') {
      normLabel = 'POSITIVE';
    } else if (lower.startsWith('neg') || lower === '0' || lower === '-1') {
      normLabel = 'NEGATIVE';
    }

    if (!normLabel) {
      invalidLabelCount++;
      continue;
    }

    if (existingRecordIds.has(recId)) {
      matchedCount++;
    } else {
      unmatchedCount++;
    }

    validLlmResults.push({
      record_id: recId,
      llm_label: normLabel,
    });
  }

  // Clear old LLM results and insert
  const { error: delError } = await supabase
    .from('llm_results')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) console.warn('Note deleting old LLM results:', delError);

  const batchSize = 300;
  for (let i = 0; i < validLlmResults.length; i += batchSize) {
    const batch = validLlmResults.slice(i, i + batchSize);
    const { error: insError } = await supabase.from('llm_results').insert(batch);
    if (insError) throw insError;
  }

  return {
    totalImported: validLlmResults.length,
    matchedCount,
    unmatchedCount,
    invalidLabelCount,
  };
}

export async function getComparisonData() {
  ensureSupabase();
  const assignments = await getAssignments();
  const { data: llmResults, error } = await supabase.from('llm_results').select('*');
  if (error) throw error;

  const llmMap = new Map();
  for (const item of (llmResults || [])) {
    llmMap.set(String(item.record_id).trim(), item.llm_label);
  }

  let match = 0;
  let mismatch = 0;
  let pending = 0;

  let manPosLlmPos = 0;
  let manPosLlmNeg = 0;
  let manNegLlmPos = 0;
  let manNegLlmNeg = 0;

  const items = assignments.map(a => {
    const recId = String(a.record_id).trim();
    const manualLabel = a.manual_label ? a.manual_label.toUpperCase() : null;
    const llmLabel = llmMap.get(recId) || null;

    let comparisonStatus = 'PENDING';
    if (!manualLabel || !llmLabel) {
      comparisonStatus = 'PENDING';
      pending++;
    } else if (manualLabel === llmLabel) {
      comparisonStatus = 'MATCH';
      match++;
    } else {
      comparisonStatus = 'MISMATCH';
      mismatch++;
    }

    if (manualLabel && llmLabel) {
      if (manualLabel === 'POSITIVE' && llmLabel === 'POSITIVE') manPosLlmPos++;
      else if (manualLabel === 'POSITIVE' && llmLabel === 'NEGATIVE') manPosLlmNeg++;
      else if (manualLabel === 'NEGATIVE' && llmLabel === 'POSITIVE') manNegLlmPos++;
      else if (manualLabel === 'NEGATIVE' && llmLabel === 'NEGATIVE') manNegLlmNeg++;
    }

    return {
      record_id: a.record_id,
      text: a.text,
      assigned_member: a.member_name,
      manual_label: manualLabel || '-',
      llm_label: llmLabel || '-',
      comparison_status: comparisonStatus,
    };
  });

  const totalComparable = match + mismatch;
  const agreementRate = totalComparable > 0 
    ? ((match / totalComparable) * 100).toFixed(1) 
    : '0.0';

  return {
    items,
    stats: {
      total: items.length,
      totalComparable,
      match,
      mismatch,
      pending,
      agreementRate,
      confusionMatrix: {
        manPosLlmPos,
        manPosLlmNeg,
        manNegLlmPos,
        manNegLlmNeg,
        totalManualPos: manPosLlmPos + manPosLlmNeg,
        totalManualNeg: manNegLlmPos + manNegLlmNeg,
        totalLlmPos: manPosLlmPos + manNegLlmPos,
        totalLlmNeg: manPosLlmNeg + manNegLlmNeg,
      },
    },
  };
}

export async function exportComparisonCsv(items) {
  const rows = items.map(item => ({
    record_id: item.record_id,
    text: item.text,
    assigned_member: item.assigned_member,
    manual_label: item.manual_label,
    llm_label: item.llm_label,
    comparison_status: item.comparison_status,
  }));

  const csv = Papa.unparse(rows);
  downloadBlob(csv, 'comparison_manual_vs_llm.csv', 'text/csv;charset=utf-8;');
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
