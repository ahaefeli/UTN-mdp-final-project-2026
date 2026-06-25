'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

const adaptMatchesForUI = (apiMatches) => {
  return apiMatches.map(match => {
    let localSetsWon = 0;
    let visitorSetsWon = 0;
    const localSetPoints = [];
    const visitorSetPoints = [];
    
    const sets = match.sets || (match.sets_data && match.sets_data.sets) || [];
    const sortedSets = [...sets].sort((a, b) => (a.set_number || 0) - (b.set_number || 0));
    
    sortedSets.forEach(set => {
      const lScore = set.local_points !== undefined ? set.local_points : (set.local_score || 0);
      const vScore = set.visitor_points !== undefined ? set.visitor_points : (set.visitor_score || 0);
      localSetPoints.push(lScore);
      visitorSetPoints.push(vScore);
      if (lScore > vScore) {
        localSetsWon += 1;
      } else if (vScore > lScore) {
        visitorSetsWon += 1;
      }
    });
    
    return {
      id: match.id,
      category: match.category || match.tournament_stage_name || "Fase Regular",
      location: match.court_name || match.location || "Sede a confirmar",
      status: match.status === "IN_PROGRESS" ? "live" : match.status?.toLowerCase(),
      statusText: match.status === "IN_PROGRESS" ? "EN VIVO" : match.status === "FINISHED" ? "Finalizado" : "Próximamente",
      team1: {
        name: match.local_team_name,
        logo: match.local_club_logo_url || null,
        initials: (match.local_team_name || "L").substring(0,3).toUpperCase(),
        setsWon: localSetsWon,
        setPoints: localSetPoints
      },
      team2: {
        name: match.visitor_team_name,
        logo: match.visitor_club_logo_url || null,
        initials: (match.visitor_team_name || "V").substring(0,3).toUpperCase(),
        setsWon: visitorSetsWon,
        setPoints: visitorSetPoints
      },
      progressLabel: "Set Progress",
      progressPercent: 50
    };
  });
};

const adaptStandingsForUI = (apiStandings) => {
  return apiStandings.map((team, index) => ({
    pos: index + 1,
    name: team.team_name,
    logo: team.club_logo_url,
    initials: (team.team_name || "T").substring(0,3).toUpperCase(),
    pts: team.puntos,
    pj: team.pj,
    pg: team.pg,
    pp: team.pp
  }));
};

const BRANCH_TRANSLATIONS = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
};

const CATEGORY_TRANSLATIONS = {
  PRIMERA: 'Primera División',
  'SUB-18': 'Sub-18',
  'SUB-16': 'Sub-16',
  'SUB-14': 'Sub-14',
  'SUB_14': 'Sub-14',
  'SUB_16': 'Sub-16',
  'SUB_18': 'Sub-18',
  'SUB_21': 'Sub-21',
  'MAXI': 'Maxi',
};


export default function ResultadosPosicionesPage() {
  const { isAuthenticated, isInitialized } = useAuth();
  
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState('');

  // 1. Obtener lista de torneos al cargar la vista
  useEffect(() => {
    if (isAuthenticated) {
      const fetchTournaments = async () => {
        try {
          setIsLoadingTournaments(true);
          setError('');
          const token = typeof window !== 'undefined' ? localStorage.getItem('lnv_token') : '';
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          
          const response = await fetch(`${baseUrl}/internal/torneos/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Error al obtener torneos');
          }
          
          const json = await response.json();
          const list = json.data || [];
          setTournaments(list);
          
          if (list.length > 0) {
            setSelectedTournamentId(list[0].id);
          }
        } catch (err) {
          console.error(err);
          setError('Ocurrió un error al cargar la lista de torneos.');
        } finally {
          setIsLoadingTournaments(false);
        }
      };
      
      fetchTournaments();
    }
  }, [isAuthenticated]);

  // 2. Obtener partidos y posiciones al seleccionar un torneo
  useEffect(() => {
    if (isAuthenticated && selectedTournamentId) {
      const fetchTournamentData = async () => {
        try {
          setIsLoadingData(true);
          setError('');
          const token = typeof window !== 'undefined' ? localStorage.getItem('lnv_token') : '';
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
          
          const [matchesRes, standingsRes] = await Promise.all([
            fetch(`${baseUrl}/internal/torneos/partidos/?tournament_id=${selectedTournamentId}`, { headers }),
            fetch(`${baseUrl}/internal/torneos/${selectedTournamentId}/posiciones/`, { headers })
          ]);
          
          if (!matchesRes.ok || !standingsRes.ok) {
            throw new Error('Error al obtener resultados o posiciones.');
          }
          
          const rawMatchesData = await matchesRes.json();
          const rawStandingsData = await standingsRes.json();
          
          setMatches(adaptMatchesForUI(rawMatchesData.data || []));
          setStandings(adaptStandingsForUI(Array.isArray(rawStandingsData) ? rawStandingsData : (rawStandingsData.data || [])));
        } catch (err) {
          console.error(err);
          setError('Error al obtener los partidos o la tabla de posiciones del torneo.');
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchTournamentData();
    }
  }, [isAuthenticated, selectedTournamentId]);

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 select-none">
          <div>
            <h1 className="text-3xl font-black text-[#001F54] tracking-tight uppercase italic">
              Resultados y Posiciones
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              Consulte el fixture y la clasificación de los torneos de su organización.
            </p>
          </div>

          {/* Selector de Torneos */}
          {!isLoadingTournaments && tournaments.length > 0 && (
            <div className="flex flex-col w-full md:w-96">
              <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 uppercase">
                Torneo
              </label>
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="w-full bg-white border border-slate-200 hover:border-slate-350 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 appearance-none outline-none focus:border-[#002F87] transition-all cursor-pointer shadow-sm"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} - Categoría: {CATEGORY_TRANSLATIONS[t.category] || t.category} - Rama: {BRANCH_TRANSLATIONS[t.branch] || t.branch}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 font-bold text-xs p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="w-8 h-8 border-4 border-[#002F87] border-t-transparent rounded-full animate-spin"></span>
            <p className="text-slate-500 font-bold text-sm">Cargando información del torneo...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMNA PARTIDOS (8/12) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex items-center justify-between select-none">
                <h2 className="text-2xl font-black text-[#001F54] tracking-tight">
                  Últimos Partidos
                </h2>
              </div>

              {matches.length > 0 ? (
                matches.map((match) => {
                  const isLive = match.status === "live";
                  const setsTeam1 = match.team1.setPoints;
                  const setsTeam2 = match.team2.setPoints;

                  let p1Percent = 50;
                  let p2Percent = 50;
                  if (isLive && setsTeam1.length > 0) {
                    const lastIndex = setsTeam1.length - 1;
                    const p1 = setsTeam1[lastIndex] || 0;
                    const p2 = setsTeam2[lastIndex] || 0;
                    const total = p1 + p2;
                    if (total > 0) {
                      p1Percent = Math.round((p1 / total) * 100);
                      p2Percent = 100 - p1Percent;
                    }
                  }

                  return (
                    <div
                      key={match.id}
                      className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden flex flex-col gap-5"
                    >
                      <div className="flex flex-col gap-2.5 select-none">
                        <div className="flex justify-start">
                          <span
                            className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase ${
                              isLive
                                ? "bg-[#F97316] text-white animate-pulse"
                                : "bg-slate-100 text-slate-500 font-bold"
                            }`}
                          >
                            {isLive ? "EN VIVO" : "Finalizado"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                            {match.category || "Primera División"}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {match.location || "Sede oficial"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {/* Equipo 1 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            {match.team1.logo ? (
                              <img
                                src={match.team1.logo}
                                alt={match.team1.name}
                                className="w-10 h-10 rounded-full border border-slate-100 object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center flex-shrink-0 select-none">
                                {match.team1.initials}
                              </div>
                            )}
                            <span className="font-bold text-[#001F54] text-base md:text-lg">
                              {match.team1.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 select-none">
                              {setsTeam1.map((pts, idx) => {
                                const isLast = idx === setsTeam1.length - 1;
                                return (
                                  <span
                                    key={idx}
                                    className={isLive && isLast ? "text-[#001F54] font-black text-sm" : "text-slate-400"}
                                  >
                                    {pts}
                                  </span>
                                );
                              })}
                            </div>
                            <span className="text-3xl font-black text-[#001F54] w-6 text-right select-none">
                              {match.team1.setsWon}
                            </span>
                          </div>
                        </div>

                        {/* Equipo 2 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            {match.team2.logo ? (
                              <img
                                src={match.team2.logo}
                                alt={match.team2.name}
                                className="w-10 h-10 rounded-full border border-slate-100 object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#001F54] text-white font-black text-xs flex items-center justify-center flex-shrink-0 select-none">
                                {match.team2.initials}
                              </div>
                            )}
                            <span className="font-bold text-[#001F54] text-base md:text-lg">
                              {match.team2.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 select-none">
                              {setsTeam2.map((pts, idx) => {
                                const isLast = idx === setsTeam2.length - 1;
                                return (
                                  <span
                                    key={idx}
                                    className={isLive && isLast ? "text-[#001F54] font-black text-sm" : "text-slate-400"}
                                  >
                                    {pts}
                                  </span>
                                );
                              })}
                            </div>
                            <span className="text-3xl font-black text-[#001F54] w-6 text-right select-none">
                              {match.team2.setsWon}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isLive && (
                        <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 select-none">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            Progreso Set Actual
                          </span>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                            <div
                              className="bg-[#001F54] h-full transition-all duration-500"
                              style={{ width: `${p1Percent}%` }}
                            ></div>
                            <div
                              className="bg-[#F97316] h-full transition-all duration-500"
                              style={{ width: `${p2Percent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white border border-slate-200/60 rounded-3xl select-none shadow-sm flex flex-col items-center justify-center gap-3">
                  <p className="text-slate-500 font-bold text-sm">No hay partidos registrados en este torneo.</p>
                </div>
              )}
            </div>

            {/* COLUMNA TABLA DE POSICIONES (4/12) */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 flex flex-col gap-6">
                <h2 className="text-2xl font-black text-[#001F54] tracking-tight select-none">
                  Tabla de Posiciones
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 select-none">
                        <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase w-8">POS</th>
                        <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase">EQUIPO</th>
                        <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase text-center w-10">PTS</th>
                        <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase text-center w-8">PJ</th>
                        <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase text-center w-8">PG</th>
                        <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase text-center w-8">PP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.length > 0 ? (
                        standings.map((team) => (
                          <tr key={team.pos} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 font-black text-[#001F54] text-xs sm:text-sm select-none">{team.pos}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                {team.logo ? (
                                  <img
                                    src={team.logo}
                                    alt={team.name}
                                    className="w-6 h-6 rounded-full border border-slate-100 object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[8px] flex-shrink-0 select-none bg-slate-200 text-slate-700">
                                    {team.initials}
                                  </div>
                                )}
                                <span className="font-bold text-[#001F54] text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-none">
                                  {team.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 font-black text-[#001F54] text-xs sm:text-sm text-center select-none">{team.pts ?? 0}</td>
                            <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">{team.pj ?? 0}</td>
                            <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">{team.pg ?? 0}</td>
                            <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">{team.pp ?? 0}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-xs text-slate-400 italic">No hay posiciones registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}
        
      </div>
    </div>
  );
}
