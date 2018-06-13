// List of object @type allowed in the cart.
export const allowedTypes = [
    'Experiment',
];


/**
 * Given array of items, return an array of those items whose @type can be added to carts.
 *
 * @param {array} items - Object with @types to be filtered
 * @return {array} - All `items` with @types in `allowedTypes`
 */
export const filterAllowedItems = items => (
    items.filter(item => allowedTypes.indexOf(item['@type'][0]) > -1)
);
