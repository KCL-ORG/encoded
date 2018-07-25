import React from 'react';
import PropTypes from 'prop-types';
import CartAddAll from './add_multiple';
import getAllowedResultFilters from './util';


// Controls at the top of search result lists.
const CartSearchControls = ({ searchResults }) => {
    const allowedResultFilters = getAllowedResultFilters(searchResults.filters);
    if (allowedResultFilters.length > 0) {
        // allowedResultFilters has an array of search result filters to search for everything
        // we can add to the cart.
        return (
            <div className="cart__search-controls">
                <CartAddAll searchFilterElements={allowedResultFilters} />
            </div>
        );
    }
    return null;
};

CartSearchControls.propTypes = {
    searchResults: PropTypes.object.isRequired, // Search URI to get all searched @ids without limit
};

export default CartSearchControls;
