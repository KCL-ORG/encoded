export const ADD_TO_CART = 'ADD_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';

export const addToCart = currentUuid => (
    { type: ADD_TO_CART, currentUuid }
);

export const removeFromCart = currentUuid => (
    ({ type: REMOVE_FROM_CART, currentUuid })
);
