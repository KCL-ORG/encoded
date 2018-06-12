import { cacheSavedCart } from './actions';


/**
 * Add encode item @ids to the store.
 *
 * @param {array} items - Array of @ids to add to the cart
 * @param {func} dispatch - Redux dispatch function for the cart store
 */
const cartCacheSaved = (cartObj, dispatch) => {
    console.log('CARTCACHESAVED %o', cartObj);
    dispatch(cacheSavedCart(cartObj));
};

export default cartCacheSaved;
