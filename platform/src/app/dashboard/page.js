import React from "react";
import WelcomeBanner from "./components/WelcomeBanner";
import MedicalClearanceCard from "./components/MedicalClearanceCard";
import AvailabilityCalendarCard from "./components/AvailabilityCalendarCard";
import PaymentsTable from "./components/PaymentsTable";

// MOCK DATA (ESTRICTO)
const mockDashboardData = {
  user: { name: "Marcos Valenzuela", avatar: "MV" },
  welcome: {
    title: "¡HOLA, MARCOS!",
    message: "Tu estado administrativo está al día. Tienes 3 partidos programados para este fin de semana en la categoría Sub-18.",
    nextMatch: "Vie, 19:00 hs",
    statusRef: "NIVEL PRO"
  },
  medical: { status: "VIGENTE", title: "Apto Físico 2024", expires: "15 de Noviembre, 2024", progress: 85 },
  payments: [
    { id: 1, concept: "Inscripción Anual 2024", date: "15/01/2024", amount: "$12.500", status: "PAGADO" },
    { id: 2, concept: "Curso Arbitraje Nivel 2", date: "02/03/2024", amount: "$5.200", status: "PAGADO" },
    { id: 3, concept: "Seguro Competitivo Jun-Jul", date: "01/06/2024", amount: "$3.100", status: "PENDIENTE" }
  ]
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto">
      
      {/* Grid Dashboard System */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* ROW 1: Welcome Banner (8 cols) & Medical Clearance (4 cols) */}
        <div className="col-span-12 lg:col-span-8">
          <WelcomeBanner data={mockDashboardData.welcome} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <MedicalClearanceCard data={mockDashboardData.medical} />
        </div>

        {/* ROW 2: Availability Calendar (12 cols - Full Width) */}
        <div className="col-span-12">
          <AvailabilityCalendarCard />
        </div>

        {/* ROW 3: Payments & Fees Table (12 cols - Full Width) */}
        <div className="col-span-12">
          <PaymentsTable payments={mockDashboardData.payments} />
        </div>
        
      </div>
    </div>
  );
}
