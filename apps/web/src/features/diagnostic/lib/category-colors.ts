/**
 * Color schemes for diagnostic categories
 */

export interface CategoryColorScheme {
  background: string;
  badge: string;
  border: string;
  button: string;
  buttonHover: string;
}

export const categoryColors: Record<string, CategoryColorScheme> = {
  'cat-manejo-info': {
    background: 'from-blue-50 via-blue-100 to-cyan-50',
    badge: 'bg-blue-100 text-blue-800 border-2 border-blue-300',
    border: 'border-l-4 border-blue-500',
    button: 'bg-blue-500 text-white',
    buttonHover: 'hover:bg-blue-600',
  },
  'cat-comunicacion': {
    background: 'from-green-50 via-emerald-100 to-teal-50',
    badge: 'bg-green-100 text-green-800 border-2 border-green-300',
    border: 'border-l-4 border-green-500',
    button: 'bg-green-500 text-white',
    buttonHover: 'hover:bg-green-600',
  },
  'cat-creacion': {
    background: 'from-purple-50 via-violet-100 to-fuchsia-50',
    badge: 'bg-purple-100 text-purple-800 border-2 border-purple-300',
    border: 'border-l-4 border-purple-500',
    button: 'bg-purple-500 text-white',
    buttonHover: 'hover:bg-purple-600',
  },
  'cat-ia-educacion': {
    background: 'from-orange-50 via-amber-100 to-yellow-50',
    badge: 'bg-orange-100 text-orange-800 border-2 border-orange-300',
    border: 'border-l-4 border-orange-500',
    button: 'bg-orange-500 text-white',
    buttonHover: 'hover:bg-orange-600',
  },
  'cat-resolucion': {
    background: 'from-rose-50 via-pink-100 to-red-50',
    badge: 'bg-rose-100 text-rose-800 border-2 border-rose-300',
    border: 'border-l-4 border-rose-500',
    button: 'bg-rose-500 text-white',
    buttonHover: 'hover:bg-rose-600',
  },
};

// Default color scheme (fallback)
export const defaultColorScheme: CategoryColorScheme = {
  background: 'from-gray-50 via-gray-100 to-slate-50',
  badge: 'bg-gray-100 text-gray-800 border-2 border-gray-300',
  border: 'border-l-4 border-gray-500',
  button: 'bg-gray-500 text-white',
  buttonHover: 'hover:bg-gray-600',
};

export function getCategoryColors(categoryId: string): CategoryColorScheme {
  return categoryColors[categoryId] || defaultColorScheme;
}
