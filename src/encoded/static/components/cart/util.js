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


/**
 * Get the user cart object. Assumes one cart per user.
 *
 * @param {object} sessionProperties - encoded session_properties <App> context object
 */
export const getUserCart = sessionProperties => (
    (sessionProperties && sessionProperties.user && sessionProperties.user.carts && sessionProperties.user.carts[0]) || null
);


/**
 * Get the saved cart contents from the given session_properties object, or [] if that doesn't
 * exist.
 *
 * @param {object} sessionProperties - Session properties
 * @return {array} - @ids of cart contents
 */
export const getSavedCart = (sessionProperties) => {
    const userCart = getUserCart(sessionProperties);
    return (userCart && userCart.items) || [];
};
