// Action creators to use with Redux store.dispatch().
export const ADD_TO_CART = 'ADD_TO_CART';
export const ADD_MULTIPLE_TO_CART = 'ADD_MULTIPLE_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';

// Add one @id to the cart.
export const addToCart = current => (
    { type: ADD_TO_CART, current }
);

// Add multiple @ids to the cart.
export const addMultipleToCart = items => (
    { type: ADD_MULTIPLE_TO_CART, items }
);

// Remove an @id from the cart.
export const removeFromCart = current => (
    { type: REMOVE_FROM_CART, current }
);
