import type { Category } from '@/lib/types/category';

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  depth: number;
  path: string;
}

export function buildTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [], depth: 0, path: cat.name_ar });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (node.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(node.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  function computeDepthAndPath(nodes: CategoryTreeNode[], currentDepth: number, parentPath: string) {
    // Preserve the database-provided sort_order. Runtime-default locale sorting can differ
    // between Node.js and the browser and reorder keyed children during hydration.
    for (const node of nodes) {
      node.depth = currentDepth;
      node.path = parentPath ? parentPath + ' / ' + node.name_ar : node.name_ar;
      if (node.children.length > 0) {
        computeDepthAndPath(node.children, currentDepth + 1, node.path);
      }
    }
  }

  computeDepthAndPath(roots, 0, '');

  return roots;
}

export function getAncestors(categoryId: string, categories: Category[]): Category[] {
  const map = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const ancestors: Category[] = [];
  
  let current = map.get(categoryId);
  if (!current) return [];

  let parentId = current.parent_id;
  const visited = new Set<string>();
  
  while (parentId !== null) {
    if (visited.has(parentId)) break;
    visited.add(parentId);
    
    const parent = map.get(parentId);
    if (!parent) break;
    
    ancestors.unshift(parent);
    parentId = parent.parent_id;
  }
  
  return ancestors;
}

export function getDescendants(categoryId: string, categories: Category[]): Category[] {
  const childrenMap = new Map<string, Category[]>();
  for (const cat of categories) {
    if (cat.parent_id) {
      if (!childrenMap.has(cat.parent_id)) childrenMap.set(cat.parent_id, []);
      childrenMap.get(cat.parent_id)!.push(cat);
    }
  }

  const descendants: Category[] = [];
  
  function traverse(id: string) {
    const children = childrenMap.get(id) || [];
    for (const child of children) {
      descendants.push(child);
      traverse(child.id);
    }
  }
  
  traverse(categoryId);
  return descendants;
}

export function getForbiddenParentIds(categoryId: string, categories: Category[]): Set<string> {
  const forbidden = new Set<string>();
  
  forbidden.add(categoryId);
  
  const target = categories.find(c => c.id === categoryId);
  if (target && target.parent_id) {
    forbidden.add(target.parent_id);
  }
  
  const descendants = getDescendants(categoryId, categories);
  for (const desc of descendants) {
    forbidden.add(desc.id);
  }
  
  return forbidden;
}

export function validateNodePlacement(
  nodeType: Category['node_type'],
  parentId: string | null,
  categories: Category[],
): { valid: boolean; error?: string } {
  if (parentId === null) {
    return nodeType === 'department'
      ? { valid: true }
      : { valid: false, error: 'يجب أن يكون العنصر الجذري قسمًا رئيسيًا' };
  }

  const parent = categories.find((category) => category.id === parentId);
  if (!parent) {
    return { valid: false, error: 'القسم الأب غير موجود أو غير نشط' };
  }

  const allowedChildren: Record<Category['node_type'], Category['node_type'][]> = {
    department: ['category'],
    category: ['subcategory', 'product_type'],
    subcategory: ['product_type'],
    product_type: [],
  };

  if (!allowedChildren[parent.node_type].includes(nodeType)) {
    const messages: Record<Category['node_type'], string> = {
      department: 'يسمح للقسم الرئيسي باحتواء تصنيفات فقط',
      category: 'يسمح للتصنيف باحتواء تصنيفات فرعية أو أنواع منتجات',
      subcategory: 'يسمح للتصنيف الفرعي باحتواء أنواع منتجات فقط',
      product_type: 'لا يمكن إضافة عناصر أسفل نوع المنتج النهائي',
    };
    return { valid: false, error: messages[parent.node_type] };
  }

  return { valid: true };
}

export function validateReparent(
  targetId: string,
  newParentId: string | null,
  categories: Category[]
): { valid: boolean; error?: string } {
  const target = categories.find((category) => category.id === targetId);
  if (!target) {
    return { valid: false, error: 'العنصر المحدد غير موجود' };
  }

  if (targetId === newParentId) {
    return { valid: false, error: 'لا يمكن للعنصر أن يكون أبًا لنفسه' };
  }

  if (newParentId !== null) {
    const forbidden = getForbiddenParentIds(targetId, categories);
    if (forbidden.has(newParentId)) {
      return { valid: false, error: 'لا يمكن نقل العنصر ليكون تحت أحد فروعه أو نفسه' };
    }
  }

  return validateNodePlacement(target.node_type, newParentId, categories);
}

export function getCategoryPath(
  categoryId: string, 
  categories: Category[], 
  separator: string = ' / ',
  key: keyof Category = 'name_ar'
): string {
  const target = categories.find(c => c.id === categoryId);
  if (!target) return '';
  
  const ancestors = getAncestors(categoryId, categories);
  const pathParts = [...ancestors.map(a => a[key]), target[key]];
  
  return pathParts.join(separator);
}

export function filterTree(tree: CategoryTreeNode[], searchQuery: string): CategoryTreeNode[] {
  if (!searchQuery.trim()) return tree;
  
  const query = searchQuery.toLowerCase().trim();
  
  return tree.map(node => {
    const isMatch = node.name_ar.toLowerCase().includes(query) || 
                   (node.name_en && node.name_en.toLowerCase().includes(query));
    
    const filteredChildren = filterTree(node.children, query);
    
    if (isMatch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }
    
    return null;
  }).filter((node): node is CategoryTreeNode => node !== null);
}
