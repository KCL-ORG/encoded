export const ADD_TO_CART = 'ADD_TO_CART';
export const ADD_MULTIPLE_TO_CART = 'ADD_MULTIPLE_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';

export const addToCart = current => (
    { type: ADD_TO_CART, current }
);

export const addMultipleToCart = items => (
    { type: ADD_MULTIPLE_TO_CART, items }
);

export const removeFromCart = current => (
    { type: REMOVE_FROM_CART, current }
);
