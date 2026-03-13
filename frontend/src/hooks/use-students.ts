"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type {
  StudentListItem,
  StudentResponse,
  StudentCreate,
  StudentUpdate,
  StudentProfileUpdate,
  ValidationResponse,
  PredictionResponse,
  PredictionHistoryResponse,
  ExplanationResponse,
  ExplanationHistoryResponse,
} from "@/lib/types";

export function useStudents() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<StudentListItem[]>("/api/students");
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  const createStudent = useCallback(
    async (data: StudentCreate) => {
      const created = await api.post<StudentResponse>("/api/students", data);
      await fetchStudents();
      return created;
    },
    [fetchStudents],
  );

  return { students, loading, error, fetchStudents, createStudent };
}

export function useStudent(studentId: string) {
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<StudentResponse>(
        `/api/students/${studentId}`,
      );
      setStudent(data);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const updateStudent = useCallback(
    async (data: StudentUpdate) => {
      const updated = await api.put<StudentResponse>(
        `/api/students/${studentId}`,
        data,
      );
      setStudent((prev) => (prev ? { ...prev, ...updated } : prev));
      return updated;
    },
    [studentId],
  );

  const updateProfile = useCallback(
    async (data: StudentProfileUpdate) => {
      await api.put(`/api/students/${studentId}/profile`, data);
      await fetchStudent();
    },
    [studentId, fetchStudent],
  );

  const fetchValidation = useCallback(async () => {
    const data = await api.get<ValidationResponse>(
      `/api/students/${studentId}/validation`,
    );
    setValidation(data);
    return data;
  }, [studentId]);

  const runPrediction = useCallback(async () => {
    const result = await api.post<PredictionResponse>(
      `/api/students/${studentId}/predict`,
    );
    await fetchStudent();
    return result;
  }, [studentId, fetchStudent]);

  const fetchPredictions = useCallback(async () => {
    return api.get<PredictionHistoryResponse>(
      `/api/students/${studentId}/predictions`,
    );
  }, [studentId]);

  const fetchLatestExplanation = useCallback(async () => {
    return api.get<ExplanationResponse>(
      `/api/students/${studentId}/explanations/latest`,
    );
  }, [studentId]);

  const fetchExplanations = useCallback(async () => {
    return api.get<ExplanationHistoryResponse>(
      `/api/students/${studentId}/explanations`,
    );
  }, [studentId]);

  return {
    student,
    validation,
    loading,
    fetchStudent,
    updateStudent,
    updateProfile,
    fetchValidation,
    runPrediction,
    fetchPredictions,
    fetchLatestExplanation,
    fetchExplanations,
  };
}
