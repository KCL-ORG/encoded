// Action creators to use with Redux store.dispatch().
export const ADD_TO_CART = 'ADD_TO_CART';
export const ADD_MULTIPLE_TO_CART = 'ADD_MULTIPLE_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
export const REMOVE_MULTIPLE_FROM_CART = 'REMOVE_MULTIPLE_FROM_CART';
export const CACHE_SAVED_CART = 'CACHE_SAVED_CART';

export const addToCart = current => (
    { type: ADD_TO_CART, current }
);

export const addMultipleToCart = items => (
    { type: ADD_MULTIPLE_TO_CART, items }
);

export const removeFromCart = current => (
    { type: REMOVE_FROM_CART, current }
);

export const removeMultipleFromCart = items => (
    { type: REMOVE_MULTIPLE_FROM_CART, items }
);

export const cacheSavedCart = cartObj => (
    { type: CACHE_SAVED_CART, cartObj }
);
