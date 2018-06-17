import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addAllToCart } from './actions';
import { filterAllowedItems } from './util';


const CartAddAllComponent = ({ cart, items, preFiltered, onClick }) => {
    const allowedItems = preFiltered ? items : filterAllowedItems(items);
    const disabled = allowedItems.every(item => cart.indexOf(item['@id']) > -1);
    return <button className="btn btn-info btn-sm" disabled={disabled} onClick={onClick}>Add all</button>;
};

CartAddAllComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    items: PropTypes.array.isRequired, // List of @ids of the items to add
    preFiltered: PropTypes.bool, // True if items have already been filtered for cartable items
    onClick: PropTypes.func.isRequired, // Function to call when Add All clicked
};

CartAddAllComponent.defaultProps = {
    cart: [],
    preFiltered: false,
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, items: ownProps.items, filtered: ownProps.filtered });
const mapDispatchToProps = (dispatch, ownProps) => (
    {
        onClick: () => {
            const itemAtIds = filterAllowedItems(ownProps.items).map(item => item['@id']);
            return dispatch(addAllToCart(itemAtIds));
        },
    }
);

const CartAddAll = connect(mapStateToProps, mapDispatchToProps)(CartAddAllComponent);
export default CartAddAll;
