/**
 * Entidad de dominio: un estudiante.
 * Espejo de la tabla `estudiantes`.
 */
export interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  carrera: string;
}

/** Datos para crear (sin id: lo genera el backend) */
export type NuevoEstudiante = Omit<Estudiante, 'id'>;