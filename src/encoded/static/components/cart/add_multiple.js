import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addMultipleToCartAndSave } from './actions';
import { MAX_CART_ITEMS } from './util';
import { encodedURIComponent } from '../globals';
import { requestSearch } from '../objectutils';


class CartAddAllComponent extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        const searchQuery = `${this.props.searchResults.filters.map(element => (
            `${element.field}=${encodedURIComponent(element.term)}`
        )).join('&')}&limit=all&field=%40id`;
        requestSearch(searchQuery).then((results) => {
            if (Object.keys(results).length > 0 && results['@graph'].length > 0) {
                const itemsForCart = results['@graph'].map(result => result['@id']);
                this.props.addAllResults(itemsForCart);
            }
        });
    }

    render() {
        const overLimit = this.props.searchResults.total > MAX_CART_ITEMS;
        return <button disabled={overLimit} className="btn btn-info btn-sm" onClick={this.handleClick}>{overLimit ? `Filter to ${MAX_CART_ITEMS} to add all to cart` : `Add ${this.props.searchResults.total} items to cart`}</button>;
    }
}

CartAddAllComponent.propTypes = {
    /** Search result object of items to add to cart */
    searchResults: PropTypes.object.isRequired,
    /** Function to call when Add All clicked */
    addAllResults: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, searchResults: ownProps.searchResults });
const mapDispatchToProps = (dispatch, ownProps) => ({
    addAllResults: itemsForCart => dispatch(addMultipleToCartAndSave(itemsForCart, ownProps.sessionProperties.user, ownProps.fetch)),
});

const CartAddAllInternal = connect(mapStateToProps, mapDispatchToProps)(CartAddAllComponent);

const CartAddAll = (props, reactContext) => (
    <CartAddAllInternal searchResults={props.searchResults} sessionProperties={reactContext.session_properties} fetch={reactContext.fetch} />
);

CartAddAll.propTypes = {
    /** Search result object of items to add to cart */
    searchResults: PropTypes.object.isRequired,
};

CartAddAll.contextTypes = {
    session_properties: PropTypes.object,
    fetch: PropTypes.func,
};

export default CartAddAll;
