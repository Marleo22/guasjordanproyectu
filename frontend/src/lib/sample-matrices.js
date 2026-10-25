// Matrices de ejemplo para el botón «Cargar ejemplo».
// Coinciden con los casos MAT-xx del plan y con los ejemplos rectangulares de GET /api/gauss-jordan/examples.
// Si cambias esta lista, regenera las respuestas del modo sin servidor con `npm run fixtures`.
export const SAMPLES = [
  { id: 'MAT-01', label: '2×2 · solución única', rows: 2, columns: 2, matrix: [['2', '1', '5'], ['1', '-1', '1']] },
  { id: 'MAT-05', label: '2×2 · pivote inicial cero', rows: 2, columns: 2, matrix: [['0', '1', '2'], ['1', '1', '3']] },
  { id: 'MAT-06', label: '2×2 · con fracciones', rows: 2, columns: 2, matrix: [['1/2', '1', '1'], ['1', '-1', '0']] },
  {
    id: 'MAT-02',
    label: '3×3 · solución única (ejemplo Figma)',
    rows: 3,
    columns: 3,
    matrix: [['1', '1', '1', '6'], ['2', '3', '1', '11'], ['1', '2', '3', '14']],
  },
  {
    id: 'MAT-03',
    label: '3×3 · infinitas soluciones',
    rows: 3,
    columns: 3,
    matrix: [['1', '1', '1', '2'], ['2', '2', '2', '4'], ['1', '-1', '1', '0']],
  },
  {
    id: 'MAT-04',
    label: '3×3 · sin solución',
    rows: 3,
    columns: 3,
    matrix: [['1', '1', '0', '3'], ['2', '2', '0', '6'], ['1', '1', '0', '4']],
  },
  {
    id: 'unique-3x2',
    label: '3 ecuaciones, 2 incógnitas · solución única',
    rows: 3,
    columns: 2,
    matrix: [['1', '1', '3'], ['1', '-1', '1'], ['2', '1', '5']],
  },
  {
    id: 'inconsistent-3x2',
    label: '3 ecuaciones, 2 incógnitas · sin solución',
    rows: 3,
    columns: 2,
    matrix: [['1', '1', '2'], ['2', '2', '5'], ['1', '-1', '0']],
  },
  {
    id: 'infinite-2x3',
    label: '2 ecuaciones, 3 incógnitas · infinitas soluciones',
    rows: 2,
    columns: 3,
    matrix: [['1', '1', '1', '6'], ['2', '3', '1', '11']],
  },
  {
    id: 'EX-4x4',
    label: '4×4 · solución única',
    rows: 4,
    columns: 4,
    matrix: [
      ['0', '2', '1', '1', '11'],
      ['1', '1', '1', '1', '10'],
      ['2', '1', '-1', '1', '5'],
      ['1', '-1', '2', '0', '5'],
    ],
  },
  {
    id: 'EX-5x5',
    label: '5×5 · solución única con fracciones',
    rows: 5,
    columns: 5,
    matrix: [
      ['2', '1', '0', '0', '1', '9'],
      ['1', '3', '1', '0', '0', '10'],
      ['0', '1', '4', '1', '0', '18'],
      ['0', '0', '1', '5', '1', '28'],
      ['1', '0', '0', '1', '6', '35'],
    ],
  },
]
