// List of object @type allowed in the cart.
const allowedTypes = [
    'Dataset',
];


/**
 * Given array of items, return an array of those items whose @type can be added to carts.
 *
 * @param {array} items - Object with @types to be filtered
 * @return {array} - All `items` with @types in `allowedTypes`
 */
const filterAllowedItems = items => (
    items.filter(item => item['@type'].find(itemType => allowedTypes.indexOf(itemType) >= 0))
);

export default filterAllowedItems;
