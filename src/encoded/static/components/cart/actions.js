// Action creators to use with Redux store.dispatch().
export const ADD_TO_CART = 'ADD_TO_CART';
export const ADD_MULTIPLE_TO_CART = 'ADD_MULTIPLE_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
export const REMOVE_MULTIPLE_FROM_CART = 'REMOVE_MULTIPLE_FROM_CART';
export const CACHE_SAVED_CART = 'CACHE_SAVED_CART';

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

// Remove multiple @ids from the cart.
export const removeMultipleFromCart = items => (
    { type: REMOVE_MULTIPLE_FROM_CART, items }
);

// Cache saved cart to Redux store.
export const cacheSavedCart = cartObj => (
    { type: CACHE_SAVED_CART, cartObj }
);
