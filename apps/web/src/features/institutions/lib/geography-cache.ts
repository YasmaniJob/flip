import { turso } from '@/lib/db/turso';
import { educationInstitutionsMinedu } from '@/lib/db/schema-turso';
import { and, isNotNull } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

/**
 * 🗺️ Complete Peru Hierarchy Tree (Permanent & Smart)
 * Loads the entire location hierarchy once and structures it.
 */
export const getCachedPeruGeography = unstable_cache(
  async () => {
    const rawData = await turso
      .select({
        departamento: educationInstitutionsMinedu.departamento,
        provincia: educationInstitutionsMinedu.provincia,
        distrito: educationInstitutionsMinedu.distrito,
      })
      .from(educationInstitutionsMinedu)
      .where(
        and(
          isNotNull(educationInstitutionsMinedu.departamento),
          isNotNull(educationInstitutionsMinedu.provincia),
          isNotNull(educationInstitutionsMinedu.distrito)
        )
      )
      .orderBy(
        educationInstitutionsMinedu.departamento,
        educationInstitutionsMinedu.provincia,
        educationInstitutionsMinedu.distrito
      );

    const tree: Record<string, Record<string, string[]>> = {};

    for (const row of rawData) {
      const dep = row.departamento!;
      const prov = row.provincia!;
      const dist = row.distrito!;
      
      if (!tree[dep]) tree[dep] = {};
      if (!tree[dep][prov]) tree[dep][prov] = [];
      
      if (tree[dep][prov][tree[dep][prov].length - 1] !== dist) {
        tree[dep][prov].push(dist);
      }
    }

    return tree;
  },
  ['peru-ubigeo-tree'],
  { revalidate: 604800, tags: ['geography'] }
);

/**
 * Compatibility wrappers reading from the master tree.
 */

export const getCachedDepartamentos = unstable_cache(
  async () => {
    const tree = await getCachedPeruGeography();
    return Object.keys(tree).sort();
  },
  ['departamentos-list']
);

export const getCachedProvincias = unstable_cache(
  async (departamento: string) => {
    const tree = await getCachedPeruGeography();
    const deptData = tree[departamento] || {};
    return Object.keys(deptData).sort();
  },
  ['provincias-list']
);

export const getCachedDistritos = unstable_cache(
  async (departamento: string, provincia: string) => {
    const tree = await getCachedPeruGeography();
    const deptData = tree[departamento] || {};
    const provData = deptData[provincia] || [];
    return provData.sort();
  },
  ['distritos-list']
);
