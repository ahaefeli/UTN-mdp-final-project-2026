"use client";

import React from "react";

export default function PaymentsTable({ payments }) {
  const defaultPayments = [
    { id: 1, concept: "Inscripción Anual 2024", date: "15/01/2024", amount: "$12.500", status: "PAGADO" },
    { id: 2, concept: "Curso Arbitraje Nivel 2", date: "02/03/2024", amount: "$5.200", status: "PAGADO" },
    { id: 3, concept: "Seguro Competitivo Jun-Jul", date: "01/06/2024", amount: "$3.100", status: "PENDIENTE" },
  ];

  const items = payments || defaultPayments;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase">
          HISTORIAL DE PAGOS Y ARANCELES
        </h3>
      </div>

      {/* Responsive Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-3.5">CONCEPTO</th>
              <th className="px-6 py-3.5">FECHA</th>
              <th className="px-6 py-3.5">MONTO</th>
              <th className="px-6 py-3.5 text-center">ESTADO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
            {items.map((payment) => {
              const isPaid = payment.status === "PAGADO";
              return (
                <tr
                  key={payment.id}
                  className="hover:bg-slate-50/50 transition-colors duration-150"
                >
                  {/* Concept - Bold and Blue */}
                  <td className="px-6 py-4">
                    <span className="text-[#002F87] font-black text-sm">
                      {payment.concept}
                    </span>
                  </td>
                  
                  {/* Date */}
                  <td className="px-6 py-4 text-xs text-slate-500 font-semibold">
                    {payment.date}
                  </td>
                  
                  {/* Amount */}
                  <td className="px-6 py-4 text-slate-800 font-extrabold tabular-nums">
                    {payment.amount}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                        isPaid
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-orange-100 text-orange-850"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
