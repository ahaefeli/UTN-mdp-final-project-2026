'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import tournamentService from '../../../../services/tournamentService';
import userService from '../../../../services/userService';
import styles from '../../nuevo/page.module.css';

export default function TorneoEditarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
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

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Datos del torneo
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PRIMERA');
  const [branch, setBranch] = useState('FEMALE');
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState('PREPARATION');
  
  // Stages (Fechas)
  const [originalStages, setOriginalStages] = useState([]);
  const [stages, setStages] = useState([]);

  // Carga de datos del torneo y sus fechas
  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN' && id) {
      const loadTournamentData = async () => {
        try {
          setIsLoading(true);
          setError('');
          
          // Obtener torneo
          const resTournament = await tournamentService.getTournamentById(id);
          const t = resTournament.data;
          if (t) {
            setName(t.name || '');
            setCategory(t.category || 'PRIMERA');
            setBranch(t.branch || 'FEMALE');
            setYear(t.year || new Date().getFullYear());
            setStatus(t.status || 'PREPARATION');
          }
          
          // Obtener fechas del torneo
          const resStages = await tournamentService.getStages(id);
          const loadedStages = resStages.data || [];
          setOriginalStages(JSON.parse(JSON.stringify(loadedStages)));
          setStages(loadedStages.map((s, index) => ({
            id: s.id,
            name: s.name || `Fecha ${index + 1}`,
            date: s.date ? s.date.substring(0, 10) : ''
          })));
        } catch (err) {
          console.error('Error al cargar datos del torneo:', err);
          setError('Error al cargar los datos del torneo o sus fechas.');
        } finally {
          setIsLoading(false);
        }
      };
      loadTournamentData();
    }
  }, [isAuthenticated, role, id]);

  const handleAddStage = () => {
    const nextNum = stages.length + 1;
    setStages([...stages, { name: `Fecha ${nextNum}`, date: '' }]);
  };

  const handleRemoveStage = (index) => {
    if (index === 0) return; // Al menos una fecha es requerida
    const newStages = stages.filter((_, i) => i !== index);
    const updatedStages = newStages.map((s, i) => ({
      id: s.id,
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

  const handleSaveTournament = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, ingresa el nombre del torneo.');
      return;
    }
    if (!stages[0] || !stages[0].date) {
      setError('La Fecha 1 es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Actualizar datos generales del torneo
      const payload = {
        name: name.trim(),
        year,
        category,
        branch,
        status
      };
      await tournamentService.updateTournament(id, payload);

      // 2. Procesar las fechas (stages)
      // Encontrar las fechas que estaban originalmente pero ya no están en la lista actual
      const stagesToDelete = originalStages.filter(orig => 
        !stages.some(curr => curr.id === orig.id)
      );

      // Encontrar fechas nuevas o modificadas
      const stagesToAdd = stages.filter(curr => !curr.id);
      
      const stagesToUpdate = stages.filter(curr => {
        if (!curr.id) return false;
        const orig = originalStages.find(o => o.id === curr.id);
        return orig && (orig.name !== curr.name || orig.date.substring(0, 10) !== curr.date.substring(0, 10));
      });

      // Procesar eliminaciones
      for (const stage of stagesToDelete) {
        await tournamentService.deleteStage(stage.id);
      }

      // Procesar modificaciones: eliminamos y volvemos a agregar ya que no hay PUT de fechas
      for (const stage of stagesToUpdate) {
        try {
          await tournamentService.deleteStage(stage.id);
        } catch (delErr) {
          console.warn(`No se pudo eliminar stage ${stage.id} para actualización. Reintentando como adición directa.`, delErr);
        }
        await tournamentService.addStage({
          tournament_id: id,
          name: stage.name,
          date: stage.date
        });
      }

      // Procesar nuevas adiciones
      for (const stage of stagesToAdd) {
        await tournamentService.addStage({
          tournament_id: id,
          name: stage.name,
          date: stage.date
        });
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error al guardar torneo:', err);
      setError(err?.response?.data?.error || err.message || 'Error al guardar los cambios del torneo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN' || isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ border: '2px solid rgba(0, 47, 135, 0.1)', width: '1.5rem', height: '1.5rem', borderRadius: '50%', borderLeftColor: '#002F87', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm my-8">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-6 mb-8 text-center">
        <h1 className="text-2xl font-black text-[#002F87] tracking-tight uppercase italic">Editar Torneo</h1>
        <p className="text-slate-500 text-xs font-semibold mt-1">Modifique los datos generales y el cronograma de fechas del torneo.</p>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-[#002F87] uppercase italic">¡Torneo Guardado Exitosamente!</h2>
            <p className="text-slate-500 text-xs font-semibold">Los cambios se han registrado correctamente en la plataforma.</p>
          </div>

          <div className="flex gap-4 max-w-sm mx-auto pt-4">
            <button
              type="button"
              onClick={() => router.push('/torneos')}
              className="w-full py-3.5 rounded-xl bg-[#002F87] hover:bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              Volver a Gestión
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveTournament} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 block uppercase">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#002F87] transition-all"
                >
                  <option value="FEMALE">Femenino</option>
                  <option value="MALE">Masculino</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 block uppercase">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#002F87] transition-all"
                >
                  <option value="PREPARATION">En Preparación</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="FINISHED">Finalizado</option>
                  <option value="CANCELLED">Cancelado</option>
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

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push('/torneos')}
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-extrabold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-xl bg-[#002F87] hover:bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
