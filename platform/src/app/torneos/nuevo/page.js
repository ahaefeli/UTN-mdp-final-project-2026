'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import teamService from '../../../services/teamService';
import tournamentService from '../../../services/tournamentService';
import enrollmentService from '../../../services/enrollmentService';
import userService from '../../../services/userService';
import styles from './page.module.css';

export default function TorneosNuevoPage() {
  const router = useRouter();
  const { user, role, isAuthenticated, isInitialized } = useAuth();

  // Redirección si no es ADMIN
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  const [userOrgId, setUserOrgId] = useState(null);

  // Obtener la organización del administrador
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const fetchUserOrg = async () => {
        try {
          const res = await userService.getUserById(user.id);
          const orgId = res.data?.organization || res.data?.organization_id;
          setUserOrgId(orgId);
        } catch (err) {
          console.error('Error al obtener organización del usuario:', err);
        }
      };
      fetchUserOrg();
    }
  }, [isAuthenticated, user]);

  // Estados del Wizard
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PRIMERA');
  const [branch, setBranch] = useState('FEMALE');
  
  // Stages (Fechas)
  const [stages, setStages] = useState([{ name: 'Fecha 1', date: '' }]);
  
  // Equipos del Paso 2
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const handleAddStage = () => {
    const nextNum = stages.length + 1;
    setStages([...stages, { name: `Fecha ${nextNum}`, date: '' }]);
  };

  const handleRemoveStage = (index) => {
    if (index === 0) return; // Fecha 1 obligatoria
    const newStages = stages.filter((_, i) => i !== index);
    const updatedStages = newStages.map((s, i) => ({
      name: `Fecha ${i + 1}`,
      date: s.date
    }));
    setStages(updatedStages);
  };

  const handleStageDateChange = (index, value) => {
    const newStages = [...stages];
    newStages[index].date = value;
    setStages(newStages);
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, ingresa el nombre del torneo.');
      return;
    }
    if (!stages[0].date) {
      setError('La Fecha 1 es obligatoria.');
      return;
    }
    setError('');
    setIsLoadingTeams(true);
    setStep(2);
    try {
      const response = await teamService.getTeamsByCategoryAndBranch(category, branch);
      setTeams(response.data || []);
      setSelectedTeams([]);
    } catch (err) {
      console.error('Error al cargar equipos:', err);
      setError('Error al obtener equipos de la categoría y rama elegidas.');
      setStep(1);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleToggleTeam = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleCreateTournament = async () => {
    setIsSubmitting(true);
    setError('');
    setErrorMessage(null);
    try {
      const year = new Date().getFullYear();
      const payload = {
        name: name.trim(),
        year,
        category,
        branch,
        organization_id: userOrgId || user?.organization_id || user?.organization,
        stages: stages.filter(s => s.date)
      };
      
      const resTournament = await tournamentService.createTournament(payload);
      const createdTournament = resTournament.data;
      
      // Inscripción de los equipos seleccionados
      if (createdTournament && createdTournament.id && selectedTeams.length > 0) {
        await Promise.all(
          selectedTeams.map(teamId => 
            enrollmentService.createEnrollment(createdTournament.id, teamId)
          )
        );
      }
      
      setSuccess(true);
      setStep(3); // Success Screen
    } catch (err) {
      console.error('Error al crear el torneo:', err);
      if (err?.response?.status === 400) {
        setErrorMessage(err.response.data?.error || 'Error al procesar la creación del torneo.');
      } else {
        setError(err?.response?.data?.error || 'Error al procesar la creación del torneo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setCategory('PRIMERA');
    setBranch('FEMALE');
    setStages([{ name: 'Fecha 1', date: '' }]);
    setTeams([]);
    setSelectedTeams([]);
    setStep(1);
    setSuccess(false);
    setError('');
    setErrorMessage(null);
  };

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ border: '2px solid rgba(0, 47, 135, 0.1)', width: '1.5rem', height: '1.5rem', borderRadius: '50%', borderLeftColor: '#002F87', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm">
        
        {/* Header */}
        <div className="border-b border-slate-100 pb-6 mb-8 text-center">
          <h1 className="text-2xl font-black text-[#002F87] tracking-tight uppercase italic">Creación de Torneo</h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">Configure las fechas y asocie los equipos federados al nuevo torneo.</p>
        </div>

        {/* Steps Indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-4 mb-8 select-none">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 1 ? 'bg-[#002F87] text-white' : 'bg-slate-100 text-slate-400'}`}>1</span>
              <span className={`text-xs font-bold ${step === 1 ? 'text-[#002F87]' : 'text-slate-400'}`}>Datos Generales</span>
            </div>
            <div className="w-12 h-[1px] bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 2 ? 'bg-[#002F87] text-white' : 'bg-slate-100 text-slate-400'}`}>2</span>
              <span className={`text-xs font-bold ${step === 2 ? 'text-[#002F87]' : 'text-slate-400'}`}>Inscribir Equipos</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Paso 1: Configuración de Torneo */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 block uppercase">Nombre del Torneo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Apertura Sub-18 Femenino 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#002F87] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 block uppercase">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#002F87] transition-all"
                  >
                    <option value="SUB_14">Sub 14</option>
                    <option value="SUB_16">Sub 16</option>
                    <option value="SUB_18">Sub 18</option>
                    <option value="SUB_21">Sub 21</option>
                    <option value="PRIMERA">Primera</option>
                    <option value="MAXI">Maxi</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 block uppercase">Rama</label>
                  <select
                    value={branch}
                    onChange={(e) => {
                      setBranch(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#002F87] transition-all"
                  >
                    <option value="FEMALE">Femenino</option>
                    <option value="MALE">Masculino</option>
                  </select>
                </div>
              </div>

              {/* Fechas del Torneo */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Cronograma de Fechas</h3>
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="text-[#002F87] font-black text-xs hover:underline uppercase"
                  >
                    + Agregar Fecha
                  </button>
                </div>

                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-16">{stage.name}</span>
                      <input
                        type="date"
                        required={index === 0}
                        value={stage.date}
                        onChange={(e) => handleStageDateChange(index, e.target.value)}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#002F87] transition-all"
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(index)}
                          className="text-rose-500 hover:text-rose-600 p-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-[#002F87] hover:bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md"
              >
                Continuar a Selección de Equipos
              </button>
            </div>
          </form>
        )}

        {/* Paso 2: Inscripción de Equipos */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-600">Resumen del Torneo:</h3>
              <p className="text-sm font-extrabold text-[#002F87] mt-1">{name}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Categoría: {category} | Rama: {branch} | Fechas: {stages.length}</p>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-500 tracking-wider mb-3 uppercase">Equipos Disponibles ({category} - {branch})</h3>
              
              {isLoadingTeams ? (
                <div className="flex justify-center py-8">
                  <div style={{ border: '2px solid rgba(0, 47, 135, 0.1)', width: '1.5rem', height: '1.5rem', borderRadius: '50%', borderLeftColor: '#002F87', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-slate-150 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400">No se encontraron equipos registrados para esta categoría y rama.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {teams.map((team) => {
                    const isSelected = selectedTeams.includes(team.id);
                    return (
                      <div
                        key={team.id}
                        onClick={() => handleToggleTeam(team.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer select-none transition-all ${
                          isSelected ? 'border-[#002F87] bg-blue-50/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          isSelected ? 'bg-[#002F87] border-[#002F87]' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-black text-slate-700">{team.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {errorMessage && (
              <div className={styles.errorAlert}>
                {errorMessage}
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-extrabold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCreateTournament}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-xl bg-[#002F87] hover:bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Procesando...' : 'Crear Torneo'}
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Éxito */}
        {step === 3 && success && (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black text-[#002F87] uppercase italic">¡Torneo Creado Exitosamente!</h2>
              <p className="text-slate-500 text-xs font-semibold">El torneo ha sido registrado correctamente con su cronograma de fechas e inscripciones.</p>
            </div>

            <div className="flex gap-4 max-w-sm mx-auto pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Crear Otro Torneo
              </button>
              <button
                type="button"
                onClick={() => router.push('/torneos')}
                className="flex-1 py-3.5 rounded-xl bg-[#002F87] hover:bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Volver a Gestión
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
