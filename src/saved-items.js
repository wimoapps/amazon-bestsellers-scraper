let itemsCount = 0;

/**
 *
 * @param {number} count
 */
exports.setItemsCount = (count) => {
  itemsCount = count;
};

exports.getItemsCount = () => itemsCount;

exports.incrementItemsCount = () => {
  itemsCount += 1;
};
