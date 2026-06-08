function getItemIds(items = []) {
  return new Set((items || []).map(item => item.id).filter(Boolean));
}

function countCheckedByItems(checkedMap = {}, items = []) {
  const validIds = getItemIds(items);
  let count = 0;

  validIds.forEach(id => {
    if (checkedMap && checkedMap[id]) {
      count++;
    }
  });

  return count;
}

function normalizeCheckedMap(checkedMap = {}, items = []) {
  const validIds = getItemIds(items);
  const normalized = {};

  validIds.forEach(id => {
    if (Object.prototype.hasOwnProperty.call(checkedMap || {}, id)) {
      normalized[id] = Boolean(checkedMap[id]);
    }
  });

  return normalized;
}

module.exports = {
  countCheckedByItems,
  normalizeCheckedMap
};
