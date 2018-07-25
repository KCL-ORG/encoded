import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addMultipleToCart } from './actions';
import getAllowedResultFilters from './util';
import { encodedURIComponent } from '../globals';
import { requestSearch } from '../objectutils';


class CartAddAllComponent extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        const searchQuery = `${this.props.searchFilterElements.map(element => (
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
        const { cart, onClick } = this.props;
        return <button className="btn btn-info btn-sm" onClick={this.handleClick}>Add all</button>;
    }
};

CartAddAllComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    searchFilterElements: PropTypes.array.isRequired, // Array of elements making a search of items to add to the cart
    addAllResults: PropTypes.func.isRequired, // Function to call when Add All clicked
};

CartAddAllComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, searchFilterElements: ownProps.searchFilterElements });
const mapDispatchToProps = dispatch => (
    {
        addAllResults: (itemsForCart) => {
            return dispatch(addMultipleToCart(itemsForCart));
        },
    }
);

const CartAddAll = connect(mapStateToProps, mapDispatchToProps)(CartAddAllComponent);

export default CartAddAll;
