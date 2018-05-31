import React from 'react';
import PropTypes from 'prop-types';
import CartAddMultiple from './add_multiple';
import CartRemoveMultiple from './remove_multiple';
import { filterAllowedItems } from './util';


// Controls at the top of search result lists.
const CartSearchControls = ({ items }) => {
    const allowedItems = filterAllowedItems(items);
    if (allowedItems.length > 0) {
        return (
            <div className="cart__search-controls">
                <CartAddMultiple items={items} filtered />
                <CartRemoveMultiple items={items} />
            </div>
        );
    }
    return null;
};

CartSearchControls.propTypes = {
    items: PropTypes.array.isRequired, // Items in the cart
};

export default CartSearchControls;
