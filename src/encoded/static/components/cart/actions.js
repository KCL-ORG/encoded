// Action creators to use with Redux store.dispatch().
export const ADD_TO_CART = 'ADD_TO_CART';
export const ADD_ALL_TO_CART = 'ADD_ALL_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
export const REMOVE_ALL_FROM_CART = 'REMOVE_ALL_FROM_CART';
export const CACHE_SAVED_CART = 'CACHE_SAVED_CART';

export const addToCart = current => (
    { type: ADD_TO_CART, current }
);

export const addAllToCart = items => (
    { type: ADD_ALL_TO_CART, items }
);

export const removeFromCart = current => (
    { type: REMOVE_FROM_CART, current }
);

export const removeAllFromCart = items => (
    { type: REMOVE_ALL_FROM_CART, items }
);

export const cacheSavedCart = cartObj => (
    { type: CACHE_SAVED_CART, cartObj }
);
