"use client";

import { useState, useEffect } from 'react';

export interface Teammate {
  name: string;
  phone: string;
  email: string;
  college: string;
  degree: string;
  branch: string;
  gender: string;
  year: string;
  linkedin: string;
}

export interface RegistrationData {
  teamName: string;
  leader: {
    name: string;
    email: string;
    phone: string;
    college: string;
    degree: string;
    branch: string;
    gender: string;
    year: string;
    linkedin: string;
    github: string;
  };
  teammates: Teammate[];
}

export interface SubmissionData {
  problemStatement: string;
  abstract: string;
  pptUrl?: string;
  submittedAt?: string;
}

const STORAGE_KEY = 'hackathon_horizon_store';

export function useHackathonStore() {
  const [state, setState] = useState<{
    isAuthenticated: boolean;
    registration: RegistrationData | null;
    submission: SubmissionData | null;
  }>({
    isAuthenticated: false,
    registration: null,
    submission: null,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setState(JSON.parse(saved));
    }
  }, []);

  const save = (newState: any) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const login = (data: RegistrationData) => {
    save({ ...state, isAuthenticated: true, registration: data });
  };

  const logout = () => {
    save({ isAuthenticated: false, registration: null, submission: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  const submitProject = (data: SubmissionData) => {
    save({ ...state, submission: { ...data, submittedAt: new Date().toISOString() } });
  };

  return { ...state, login, logout, submitProject };
}
