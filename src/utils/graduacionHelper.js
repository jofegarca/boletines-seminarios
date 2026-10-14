// 📄 src/utils/graduacionHelper.js
import { supabase } from "../supabaseClient.js";

/**
 * Obtiene todas las filas de una consulta en Supabase superando el límite de 1000 registros.
 */
export async function fetchAllRows(queryBuilder) {
  let allRows = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await queryBuilder.range(from, to);

    if (error) {
      console.error("Error durante la paginación:", error);
      throw error;
    }

    if (data) {
      allRows.push(...data);
    }

    if (!data || data.length < pageSize) {
      break;
    }

    page++;
  }
  return allRows;
}

/**
 * Normaliza una cadena de texto eliminando tildes, signos, mayúsculas y espacios duplicados.
 */
export const normalizeName = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Mapeo de alias para discrepancias tipográficas conocidas entre 'graduacion' y 'boletines'.
 */
export const NAME_ALIASES = {
  [normalizeName("Sofia Yamilet Huanca Reyes")]: normalizeName("Sofia Yamilet Huancas Reyes"),
  [normalizeName("Sofia Yamilet Huancas Reyes")]: normalizeName("Sofia Yamilet Huanca Reyes"),
  [normalizeName("Luz Analia Taboada Masias")]: normalizeName("Liz Analy Taboada Masias"),
  [normalizeName("Liz Analy Taboada Masias")]: normalizeName("Luz Analia Taboada Masias"),
  [normalizeName("Francisco Manuel Lopez")]: normalizeName("José Manuel Francisco Lopez Sangama"),
  [normalizeName("José Manuel Francisco Lopez Sangama")]: normalizeName("Francisco Manuel Lopez"),
};

/**
 * Compara si dos nombres de estudiantes corresponden a la misma persona,
 * ignorando mayúsculas, tildes, espacios extras y considerando alias conocidos.
 */
export function areSameStudents(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (NAME_ALIASES[n1] === n2 || NAME_ALIASES[n2] === n1) return true;
  return false;
}

/**
 * Obtiene todos los alumnos de graduación correspondientes a una estaca seleccionada,
 * adjuntando su historial completo de boletines y asegurando que no se omita ningún alumno
 * por diferencias de mayúsculas/minúsculas o formato de nombre.
 *
 * @param {string} estacaSeleccionada
 * @returns {Promise<{ estudiantes: Array, periodosem: Array }>}
 */
export async function getGraduadosConHistorial(estacaSeleccionada) {
  // 1. Obtener todos los graduados
  const graduadosQuery = supabase.from("graduacion").select("*");
  const graduados = await fetchAllRows(graduadosQuery);

  // 2. Obtener catálogo de periodos
  const { data: periodosem, error: pErr } = await supabase
    .from("periodosem")
    .select("*")
    .order("anio", { ascending: false })
    .order("periodo", { ascending: false });

  if (pErr) throw pErr;

  // 3. Obtener todos los boletines completos de una sola vez con paginación
  const boletinesQuery = supabase.from("boletines").select("*");
  const todosLosBoletines = await fetchAllRows(boletinesQuery);

  // 4. Mapear cada graduado con su historial y barrio respectivo
  const estudiantesProcesados = [];

  for (const grad of graduados) {
    const historialCompleto = todosLosBoletines.filter((b) =>
      areSameStudents(b.estudiante, grad.estudiante)
    );

    // Si el graduado no tiene ningún registro en boletines, no se puede asociar a una estaca
    if (historialCompleto.length === 0) continue;

    // Filtrar los boletines correspondientes a la estaca seleccionada si se indicó una específica
    const boletinesEnEstaca = historialCompleto.filter(
      (b) =>
        !estacaSeleccionada ||
        estacaSeleccionada === "Todas" ||
        b.estaca === estacaSeleccionada
    );

    // Si se seleccionó una estaca y el alumno no tiene registros en ella, omitir
    if (
      estacaSeleccionada &&
      estacaSeleccionada !== "Todas" &&
      boletinesEnEstaca.length === 0
    ) {
      continue;
    }

    // Ordenar boletines para encontrar el más reciente dentro de la estaca seleccionada
    const sortedBoletines = [
      ...(boletinesEnEstaca.length > 0 ? boletinesEnEstaca : historialCompleto),
    ].sort(
      (a, b) =>
        Number(b.anio) - Number(a.anio) || Number(b.periodo) - Number(a.periodo)
    );
    const ultimo = sortedBoletines[0];

    estudiantesProcesados.push({
      graduado: grad,
      estudiante: grad.estudiante,
      barrio: ultimo?.barrio || "Sin barrio",
      estaca: ultimo?.estaca || estacaSeleccionada || "General",
      historialCompleto,
      historialEstaca: boletinesEnEstaca,
    });
  }

  // 5. Ordenar por barrio y luego por estudiante
  estudiantesProcesados.sort((a, b) => {
    const barrioA = (a.barrio || "").toLowerCase();
    const barrioB = (b.barrio || "").toLowerCase();
    return (
      barrioA.localeCompare(barrioB) || a.estudiante.localeCompare(b.estudiante)
    );
  });

  return {
    estudiantes: estudiantesProcesados,
    periodosem: periodosem || [],
  };
}
