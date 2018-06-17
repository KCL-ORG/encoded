import React from 'react';
import PropTypes from 'prop-types';
import CartAddAll from './add_all';
import CartRemoveAll from './remove_all';
import { filterAllowedItems } from './util';


// Controls at the top of search result lists.
const CartSearchControls = ({ items }) => {
    const allowedItems = filterAllowedItems(items);
    if (allowedItems.length > 0) {
        return (
            <div className="cart__search-controls">
                <CartAddAll items={items} filtered />
                <CartRemoveAll items={items} />
            </div>
        );
    }
    return null;
};

CartSearchControls.propTypes = {
    items: PropTypes.array.isRequired, // Items in the cart
};

export default CartSearchControls;
