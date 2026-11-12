export function reorderItems(items, order, key) {
  if (!Array.isArray(order) || order.length !== items.length || new Set(order).size !== items.length) throw new Error("排序资料不完整，请刷新后重试。现有资料未修改。");
  const lookup = new Map(items.map(item => [item[key], item]));
  if (order.some(id => !lookup.has(id))) throw new Error("作品列表已变化，请刷新后重试。现有资料未修改。");
  return order.map(id => lookup.get(id));
}
