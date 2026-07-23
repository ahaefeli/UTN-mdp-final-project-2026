"use client";

import React, { useState } from "react";
import { PageHeader, EmptyState } from "../../components/ui";
import chromeStyles from "../../components/ui/PageChrome.module.css";
import styles from "./page.module.css";

// MOCK DATA (ESTRICTO)
const mockClubs = [
  {
    id: 1,
    name: "Club Huracán",
    location: "Necochea, BA",
    founded: "FUND. 1919",
    logo: "/images/logos/clubhuracan.jpg",
    femaleCategories: ["PRIMERA", "SUB-18", "SUB-16"],
    maleCategories: ["PRIMERA", "SUB-18"]
  },
  {
    id: 2,
    name: "Basko",
    location: "Necochea, BA",
    founded: "FUND. 1945",
    logo: "/images/logos/basko.jpg",
    femaleCategories: ["PRIMERA", "SUB-18", "SUB-14"],
    maleCategories: [] // Renderizar "Sin participación actual"
  },
  {
    id: 3,
    name: "Rivadavia",
    location: "Necochea, BA",
    founded: "FUND. 1913",
    logo: "/images/logos/rivadavia.png",
    femaleCategories: ["SUB-16", "SUB-14"],
    maleCategories: ["PRIMERA", "SUB-18", "SUB-16"]
  }
];

const CATEGORY_PILLS = [
  { id: "TODOS", label: "Todos" },
  { id: "PRIMERA", label: "Primera" },
  { id: "SUB-18", label: "Sub-18" },
  { id: "SUB-16", label: "Sub-16" },
  { id: "SUB-14", label: "Sub-14" },
  { id: "MINI VOLEY", label: "Mini Voley" }
];

export default function EquiposPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");

  // Filtrado de Clubes
  const filteredClubs = mockClubs.filter((club) => {
    // 1. Filtro por búsqueda de texto (nombre o ciudad)
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.location.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Filtro por categoría seleccionada
    if (activeCategory === "TODOS") return matchesSearch;

    const hasCategory =
      club.femaleCategories.some((cat) => cat.toUpperCase() === activeCategory.toUpperCase()) ||
      club.maleCategories.some((cat) => cat.toUpperCase() === activeCategory.toUpperCase());

    return matchesSearch && hasCategory;
  });

  return (
    <div className="appShell">
      <div className={chromeStyles.page}>
        <PageHeader
          title="Clubes Afiliados"
          subtitle="Instituciones deportivas que forman la Liga Necochense de Vóley."
        />

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <i className={`bi bi-search ${styles.searchIcon}`} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar club por nombre o ciudad..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.pills}>
            {CATEGORY_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveCategory(pill.id)}
                className={`${styles.pill} ${activeCategory === pill.id ? styles.pillActive : ''}`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {filteredClubs.length > 0 ? (
          <div className={styles.grid}>
            {filteredClubs.map((club) => (
              <article key={club.id} className={styles.clubCard}>
                <div className={styles.clubHeader}>
                  <div className={styles.clubLogo}>
                    <img src={club.logo} alt={`Escudo de ${club.name}`} />
                  </div>
                  <div>
                    <h3 className={styles.clubName}>{club.name}</h3>
                    <div className={styles.clubMeta}>
                      <span className={styles.location}>
                        <i className="bi bi-geo-alt" aria-hidden="true" />
                        {club.location}
                      </span>
                      <span className={styles.founded}>{club.founded}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.categories}>
                  <p className={styles.categoriesTitle}>Categorías competitivas</p>

                  <div className={styles.branch}>
                    <div className={`${styles.branchLabel} ${styles.branchFemale}`}>
                      <i className="bi bi-gender-female" aria-hidden="true" />
                      Rama Femenina
                    </div>
                    {club.femaleCategories.length > 0 ? (
                      <div className={styles.tags}>
                        {club.femaleCategories.map((cat) => (
                          <span key={cat} className={styles.tag}>{cat}</span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noParticipation}>Sin participación actual</span>
                    )}
                  </div>

                  <div className={styles.branch}>
                    <div className={`${styles.branchLabel} ${styles.branchMale}`}>
                      <i className="bi bi-gender-male" aria-hidden="true" />
                      Rama Masculina
                    </div>
                    {club.maleCategories.length > 0 ? (
                      <div className={styles.tags}>
                        {club.maleCategories.map((cat) => (
                          <span key={cat} className={styles.tag}>{cat}</span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noParticipation}>Sin participación actual</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="bi-search"
            title="No se encontraron clubes afiliados que coincidan con la búsqueda."
          />
        )}
      </div>
    </div>
  );
}
